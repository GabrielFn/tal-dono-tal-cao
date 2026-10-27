import { describe, expect, it } from "vitest";
import {
  ContadorComReserva,
  ContadorEmMemoria,
  ContadorUpstash,
  type ContadorDiario,
} from "@/lib/limite/contadores";
import { LimitadorDeUso } from "@/lib/limite/limitador";
import { fetchFalso } from "./auxiliares";

const MEIO_DIA_BRASILIA = Date.UTC(2026, 9, 27, 15, 0, 0);

function criar(limitePorIp = 2, limiteGlobal = 100, agora = () => MEIO_DIA_BRASILIA) {
  const contador = new ContadorEmMemoria(agora);
  return { contador, limitador: new LimitadorDeUso(contador, { limitePorIp, limiteGlobal, agora }) };
}

describe("LimitadorDeUso", () => {
  it("permite até o limite por IP e bloqueia depois", async () => {
    const { limitador } = criar(2);
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
    expect(await limitador.reservar("ip1")).toEqual({ permitido: false, motivo: "ip" });
    expect((await limitador.reservar("ip2")).permitido).toBe(true);
  });

  it("devolver() libera a cota de novo (correção do bug: falha da IA não gasta tentativa)", async () => {
    const { limitador } = criar(1);
    const reserva = await limitador.reservar("ip1");
    if (!reserva.permitido) throw new Error("esperava reserva");
    await reserva.devolver();
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
  });

  it("devolver() duas vezes não cria cota extra", async () => {
    const { limitador } = criar(1);
    const reserva = await limitador.reservar("ip1");
    if (!reserva.permitido) throw new Error("esperava reserva");
    await reserva.devolver();
    await reserva.devolver();
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
    expect((await limitador.reservar("ip1")).permitido).toBe(false);
  });

  it("bloqueio global não consome a cota do IP", async () => {
    const { limitador } = criar(5, 1);
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
    expect(await limitador.reservar("ip2")).toEqual({ permitido: false, motivo: "global" });
    // ip2 não gastou nada: se o limite global subir, ele ainda tem 5 tentativas.
  });

  it("tentativas bloqueadas não inflam o contador", async () => {
    const { limitador, contador } = criar(1);
    await limitador.reservar("ip1");
    await limitador.reservar("ip1");
    await limitador.reservar("ip1");
    expect(await contador.incrementar("tdtc:ip:ip1:2026-10-27", 60)).toBe(2);
  });

  it("zera à meia-noite de Brasília (03:00 UTC)", async () => {
    let agora = Date.UTC(2026, 9, 28, 2, 59); // 23:59 em Brasília
    const { limitador } = criar(1, 100, () => agora);
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
    expect((await limitador.reservar("ip1")).permitido).toBe(false);
    agora = Date.UTC(2026, 9, 28, 3, 1); // 00:01 do dia seguinte
    expect((await limitador.reservar("ip1")).permitido).toBe(true);
  });
});

describe("ContadorEmMemoria", () => {
  it("expira a chave depois do TTL", async () => {
    let agora = 0;
    const contador = new ContadorEmMemoria(() => agora);
    expect(await contador.incrementar("k", 10)).toBe(1);
    expect(await contador.incrementar("k", 10)).toBe(2);
    agora = 10_001;
    expect(await contador.incrementar("k", 10)).toBe(1);
  });

  it("nunca fica negativo", async () => {
    const contador = new ContadorEmMemoria();
    await contador.incrementar("k", 60);
    await contador.decrementar("k");
    await contador.decrementar("k");
    expect(await contador.incrementar("k", 60)).toBe(1);
  });
});

describe("ContadorUpstash", () => {
  it("envia INCR + EXPIRE NX no pipeline e lê o resultado", async () => {
    const { fn, chamadas } = fetchFalso(200, [{ result: 3 }, { result: 1 }]);
    const contador = new ContadorUpstash("https://redis.exemplo", "tok", fn);
    expect(await contador.incrementar("k", 60)).toBe(3);
    expect(chamadas[0].url).toBe("https://redis.exemplo/pipeline");
    expect(JSON.parse(String(chamadas[0].init?.body))).toEqual([
      ["INCR", "k"],
      ["EXPIRE", "k", "60", "NX"],
    ]);
  });

  it("lança erro se o Redis responder com falha", async () => {
    const { fn } = fetchFalso(500, "erro");
    await expect(new ContadorUpstash("u", "t", fn).incrementar("k", 60)).rejects.toThrow();
  });
});

describe("ContadorComReserva", () => {
  const quebrado: ContadorDiario = {
    incrementar: async () => {
      throw new Error("fora do ar");
    },
    decrementar: async () => {
      throw new Error("fora do ar");
    },
  };

  it("usa o reserva quando o principal falha, sem derrubar o app", async () => {
    const erros: unknown[] = [];
    const contador = new ContadorComReserva(quebrado, new ContadorEmMemoria(), (e) => erros.push(e));
    expect(await contador.incrementar("k", 60)).toBe(1);
    await expect(contador.decrementar("k")).resolves.toBeUndefined();
    expect(erros).toHaveLength(2);
  });
});
