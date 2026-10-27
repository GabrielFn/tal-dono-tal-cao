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
    expect(r.racaProvavel).toBe("Cachorro de respeito");
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
      normalizarResultado({ valido: false, motivo: "sem_cachorro", mensagem: "Isso é um gato!" }),
    ).toEqual({ valido: false, motivo: "sem_cachorro", mensagem: "Isso é um gato!" });
  });
});
