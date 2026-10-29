import { describe, expect, it } from "vitest";
import { temaDoDia } from "@/lib/conteudo/temporada";
import { normalizarResultado } from "@/lib/analise/normalizar";
import {
  ferramentaParaTema,
  FERRAMENTA_RESULTADO,
  promptDoSistema,
  PROMPT_SISTEMA,
} from "@/lib/analise/prompt";
import { AnalisadorDemo } from "@/lib/analise/demo";
import { textoDoSelo } from "@/lib/cliente/card";
import { textoDeCompartilhamento } from "@/lib/cliente/compartilhar";

// 12h em Brasília = 15h UTC.
const em = (mesDia: string) => new Date(`2026-${mesDia}T15:00:00Z`);

describe("temaDoDia", () => {
  it("liga de 29/10 a 02/11 (horário de Brasília) e desliga fora disso", () => {
    expect(temaDoDia(em("10-28"))).toBeNull();
    expect(temaDoDia(em("10-29"))).toBe("halloween");
    expect(temaDoDia(em("10-31"))).toBe("halloween");
    expect(temaDoDia(em("11-02"))).toBe("halloween");
    expect(temaDoDia(em("11-03"))).toBeNull();
  });

  it("usa o fuso de Brasília: 02h UTC de 29/10 ainda é dia 28 no Brasil", () => {
    expect(temaDoDia(new Date("2026-10-29T02:00:00Z"))).toBeNull();
    expect(temaDoDia(new Date("2026-11-03T02:00:00Z"))).toBe("halloween");
  });

  it("TEMA_FORCADO liga ou desliga em qualquer data, e ignora valor inválido", () => {
    expect(temaDoDia(em("05-10"), "halloween")).toBe("halloween");
    expect(temaDoDia(em("10-31"), "nenhum")).toBeNull();
    expect(temaDoDia(em("05-10"), "natal-inventado")).toBeNull();
  });
});

describe("prompt e ferramenta no Halloween", () => {
  it("fora do tema, nada muda", () => {
    expect(promptDoSistema(null)).toBe(PROMPT_SISTEMA);
    expect(ferramentaParaTema(null)).toBe(FERRAMENTA_RESULTADO);
  });

  it("no Halloween pede a fantasia de dupla e o gato preto", () => {
    expect(promptDoSistema("halloween")).toContain("fantasiaDeDupla");
    expect(promptDoSistema("halloween")).toContain("Dia do Saci");
    expect(promptDoSistema("halloween").trim().endsWith('"registrar_resultado".')).toBe(true);
    const f = ferramentaParaTema("halloween");
    expect(f.input_schema.required).toEqual(expect.arrayContaining(["fantasiaDeDupla", "gatoPreto"]));
    expect(Object.keys(f.input_schema.properties)).toContain("fantasiaDeDupla");
  });
});

describe("normalizarResultado com tema", () => {
  const base = { valido: true, nota: 70, especie: "gato" };

  it("sem tema, não cria extras de Halloween", () => {
    expect(normalizarResultado({ ...base, fantasiaDeDupla: "x" })).not.toHaveProperty("halloween");
  });

  it("no Halloween guarda a fantasia e o gato preto", () => {
    const r = normalizarResultado(
      { ...base, fantasiaDeDupla: " Bruxa e gato. ", gatoPreto: true },
      "halloween",
    );
    expect(r).toMatchObject({ halloween: { fantasia: "Bruxa e gato.", gatoPreto: true } });
  });

  it("gato preto só vale para gato, e a fantasia tem padrão", () => {
    const r = normalizarResultado({ ...base, especie: "cachorro", gatoPreto: true }, "halloween");
    if (!r.valido) throw new Error("esperava válido");
    expect(r.halloween?.gatoPreto).toBe(false);
    expect(r.halloween?.fantasia.length).toBeGreaterThan(10);
  });

  it("resultado inválido não ganha extras", () => {
    expect(normalizarResultado({ valido: false, motivo: "sem_pessoa" }, "halloween")).not.toHaveProperty(
      "halloween",
    );
  });
});

describe("demo, selo e compartilhamento", () => {
  it("a demo traz fantasia no Halloween e nada fora dele", async () => {
    const demo = new AnalisadorDemo({ atrasoMs: 0, aleatorio: () => 0 });
    expect((await demo.analisar(undefined, undefined, "halloween")).halloween?.fantasia).toBeTruthy();
    expect(await demo.analisar()).not.toHaveProperty("halloween");
  });

  it("selo do topo: plot twist tem prioridade, depois gato preto", () => {
    const dados = {
      nota: 1,
      titulo: "",
      fraseCard: "",
      somDoAnimal: "MIAU",
      especie: "gato",
      inusitado: false,
    };
    expect(textoDoSelo(dados)).toBeNull();
    expect(textoDoSelo({ ...dados, halloween: { fantasia: "f", gatoPreto: true } })).toBe(
      "GATO PRETO OFICIAL DO HALLOWEEN",
    );
    expect(textoDoSelo({ ...dados, especie: "iguana", inusitado: true })).toBe("PLOT TWIST: É IGUANA!");
  });

  it("texto de compartilhar ganha #Halloween só na edição temática", () => {
    const r = { nota: 80, inusitado: false, especie: "gato" };
    expect(textoDeCompartilhamento(r, "https://x.app")).not.toContain("#Halloween");
    expect(
      textoDeCompartilhamento({ ...r, halloween: { fantasia: "f", gatoPreto: false } }, "https://x.app"),
    ).toContain("#Halloween");
  });
});
