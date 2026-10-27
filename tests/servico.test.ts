import { describe, expect, it, vi } from "vitest";
import { analisarFotos, type Dependencias } from "@/lib/analise/servico";
import type { AnalisadorDeFotos } from "@/lib/analise/tipos";
import type { Bloqueio, Reserva } from "@/lib/limite";
import type { Resultado } from "@/lib/tipos";
import { dataUrlFalso } from "./auxiliares";

const CORPO_VALIDO = { pessoa: dataUrlFalso(), cachorro: dataUrlFalso() };

const RESULTADO: Resultado = {
  valido: true,
  nota: 80,
  titulo: "t",
  veredito: "v",
  fraseCard: "f",
  racaProvavel: "r",
  categorias: [],
};

function analisador(comportamento: () => Promise<Resultado>, consomeCota = true): AnalisadorDeFotos {
  return { consomeCota, analisar: vi.fn(comportamento) };
}

function limitador(resposta: Reserva | Bloqueio) {
  return { reservar: vi.fn(async () => resposta) };
}

function reservaOk() {
  const devolver = vi.fn(async () => {});
  return { reserva: { permitido: true as const, devolver }, devolver };
}

function deps(parcial: Partial<Dependencias>): Dependencias {
  return {
    analisador: analisador(async () => RESULTADO),
    limitador: limitador(reservaOk().reserva),
    registrarErro: () => {},
    ...parcial,
  };
}

describe("analisarFotos", () => {
  it("recusa corpo que não é objeto", async () => {
    expect((await analisarFotos(null, "ip", deps({}))).status).toBe(400);
    expect((await analisarFotos("texto", "ip", deps({}))).status).toBe(400);
  });

  it("recusa imagens inválidas sem gastar cota nem chamar a IA", async () => {
    const lim = limitador(reservaOk().reserva);
    const ia = analisador(async () => RESULTADO);
    const r = await analisarFotos(
      { pessoa: "x", cachorro: dataUrlFalso() },
      "ip",
      deps({ limitador: lim, analisador: ia }),
    );
    expect(r.status).toBe(400);
    expect(r.corpo).toMatchObject({ codigo: "imagem_invalida" });
    expect(lim.reservar).not.toHaveBeenCalled();
    expect(ia.analisar).not.toHaveBeenCalled();
  });

  it("devolve o resultado quando tudo dá certo", async () => {
    const r = await analisarFotos(CORPO_VALIDO, "ip", deps({}));
    expect(r).toEqual({ status: 200, corpo: RESULTADO });
  });

  it("bloqueia por limite de IP (429) e global (503) sem chamar a IA", async () => {
    const ia = analisador(async () => RESULTADO);
    const porIp = await analisarFotos(
      CORPO_VALIDO,
      "ip",
      deps({ analisador: ia, limitador: limitador({ permitido: false, motivo: "ip" }) }),
    );
    const global = await analisarFotos(
      CORPO_VALIDO,
      "ip",
      deps({ analisador: ia, limitador: limitador({ permitido: false, motivo: "global" }) }),
    );
    expect(porIp.status).toBe(429);
    expect(global.status).toBe(503);
    expect(ia.analisar).not.toHaveBeenCalled();
  });

  it("REGRESSÃO: quando a IA falha, devolve a cota e responde 502", async () => {
    const { reserva, devolver } = reservaOk();
    const registrarErro = vi.fn();
    const r = await analisarFotos(
      CORPO_VALIDO,
      "ip",
      deps({
        analisador: analisador(async () => {
          throw new Error("IA fora do ar");
        }),
        limitador: limitador(reserva),
        registrarErro,
      }),
    );
    expect(r.status).toBe(502);
    expect(devolver).toHaveBeenCalledOnce();
    expect(registrarErro).toHaveBeenCalledOnce();
  });

  it("resultado inválido da IA (ex.: sem cachorro) conta como uso, pois a IA trabalhou", async () => {
    const { reserva, devolver } = reservaOk();
    const invalido: Resultado = { valido: false, motivo: "sem_cachorro", mensagem: "Cadê o cachorro?" };
    const r = await analisarFotos(
      CORPO_VALIDO,
      "ip",
      deps({ analisador: analisador(async () => invalido), limitador: limitador(reserva) }),
    );
    expect(r).toEqual({ status: 200, corpo: invalido });
    expect(devolver).not.toHaveBeenCalled();
  });

  it("modo demo não consulta o limite", async () => {
    const lim = limitador(reservaOk().reserva);
    await analisarFotos(
      CORPO_VALIDO,
      "ip",
      deps({ analisador: analisador(async () => RESULTADO, false), limitador: lim }),
    );
    expect(lim.reservar).not.toHaveBeenCalled();
  });
});
