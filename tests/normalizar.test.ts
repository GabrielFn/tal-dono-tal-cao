import { describe, expect, it } from "vitest";
import { MENSAGENS_PADRAO, NOMES_CATEGORIAS, normalizarResultado } from "@/lib/analise/normalizar";

describe("normalizarResultado", () => {
  it("mantém um resultado válido bem formado", () => {
    const r = normalizarResultado({
      valido: true,
      nota: 87,
      titulo: "Almas gêmeas",
      veredito: "Iguais.",
      fraseCard: "Frase",
      racaProvavel: "Golden",
      categorias: NOMES_CATEGORIAS.map((nome) => ({ nome, nota: 80, comentario: "ok" })),
    });
    expect(r).toMatchObject({ valido: true, nota: 87, titulo: "Almas gêmeas", racaProvavel: "Golden" });
  });

  it("limita notas entre 0 e 100 e arredonda", () => {
    const r = normalizarResultado({
      valido: true,
      nota: 140,
      categorias: [
        { nome: "Olhar", nota: -5 },
        { nome: "Vibe", nota: 99.6 },
      ],
    });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.nota).toBe(100);
    expect(r.categorias.find((c) => c.nome === "Olhar")?.nota).toBe(0);
    expect(r.categorias.find((c) => c.nome === "Vibe")?.nota).toBe(100);
  });

  it("sempre devolve as 5 categorias na ordem certa, mesmo se a IA mandar menos ou fora de ordem", () => {
    const r = normalizarResultado({
      valido: true,
      categorias: [
        { nome: "vibe", nota: 50 },
        { nome: "Olhar", nota: 70 },
      ],
    });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.categorias.map((c) => c.nome)).toEqual([...NOMES_CATEGORIAS]);
    expect(r.categorias[0].nota).toBe(70);
    expect(r.categorias[4].nota).toBe(50);
  });

  it("calcula a média das categorias quando a nota geral não vem", () => {
    const r = normalizarResultado({
      valido: true,
      categorias: NOMES_CATEGORIAS.map((nome, i) => ({ nome, nota: (i + 1) * 10 })),
    });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.nota).toBe(30);
  });

  it("corta textos longos e preenche padrões", () => {
    const r = normalizarResultado({ valido: true, titulo: "x".repeat(500), racaProvavel: "  " });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.titulo).toHaveLength(50);
    expect(r.racaProvavel).toBe("Bicho de respeito");
  });

  it("converte resultado inválido com motivo desconhecido em 'outro'", () => {
    expect(normalizarResultado({ valido: false, motivo: "inventado" })).toEqual({
      valido: false,
      motivo: "outro",
      mensagem: MENSAGENS_PADRAO.outro,
    });
  });

  it("mantém a mensagem da IA para resultado inválido", () => {
    expect(
      normalizarResultado({ valido: false, motivo: "sem_animal", mensagem: "Isso é uma pantufa!" }),
    ).toEqual({ valido: false, motivo: "sem_animal", mensagem: "Isso é uma pantufa!" });
  });
});

describe("normalizarResultado: quando o bicho não é cachorro", () => {
  const base = { valido: true, nota: 70, titulo: "t" };

  it("cachorro tem AU-AU e nenhum plot twist, mesmo se a IA inventar", () => {
    const r = normalizarResultado({ ...base, ehCachorro: true, somDoAnimal: "MIAU", plotTwist: "x" });
    expect(r).toMatchObject({ ehCachorro: true, especie: "cachorro", somDoAnimal: "AU-AU", plotTwist: "" });
  });

  it("assume cachorro quando a IA não informa a espécie (compatibilidade)", () => {
    expect(normalizarResultado(base)).toMatchObject({ ehCachorro: true, somDoAnimal: "AU-AU" });
  });

  it("mantém espécie, som e plot twist de outro bicho", () => {
    const r = normalizarResultado({
      ...base,
      ehCachorro: false,
      especie: "Gato",
      somDoAnimal: "miau",
      plotTwist: "É um gato.",
    });
    expect(r).toMatchObject({
      ehCachorro: false,
      especie: "gato",
      somDoAnimal: "MIAU",
      plotTwist: "É um gato.",
    });
  });

  it("limpa o som para caber e ser seguro no card", () => {
    const r = normalizarResultado({
      ...base,
      ehCachorro: false,
      especie: "pato",
      somDoAnimal: "quack!!! 🦆 <b>quack</b>",
    });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.somDoAnimal).toMatch(/^[\p{Lu}\-. ]{1,10}$/u);
    expect(r.somDoAnimal.startsWith("QUACK")).toBe(true);
  });

  it("aceita acentos no som (CÓ-CÓ)", () => {
    const r = normalizarResultado({ ...base, ehCachorro: false, especie: "galinha", somDoAnimal: "có-có" });
    expect(r).toMatchObject({ somDoAnimal: "CÓ-CÓ" });
  });

  it("preenche padrões engraçados se a IA esquecer", () => {
    const r = normalizarResultado({ ...base, ehCachorro: false });
    expect(r).toMatchObject({ especie: "bicho misterioso", somDoAnimal: "???" });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.plotTwist).toContain("não é um cachorro");
  });

  it("converte o motivo antigo 'sem_cachorro' para 'sem_animal'", () => {
    expect(normalizarResultado({ valido: false, motivo: "sem_cachorro" })).toMatchObject({
      motivo: "sem_animal",
    });
  });

  it("tira o 'Plot twist:' repetido do começo da frase", () => {
    for (const bruto of [
      "Plot twist: isso é um gato.",
      "PLOT TWIST! isso é um gato.",
      "plot-twist — isso é um gato.",
    ]) {
      const r = normalizarResultado({ ...base, ehCachorro: false, especie: "gato", plotTwist: bruto });
      expect(r).toMatchObject({ plotTwist: "Isso é um gato." });
    }
  });
});
