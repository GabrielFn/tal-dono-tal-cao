import { describe, expect, it } from "vitest";
import { CLICHES_PROIBIDOS, FERRAMENTA_RESULTADO, PROMPT_SISTEMA } from "@/lib/analise/prompt";
import { AnalisadorDemo } from "@/lib/analise/demo";
import { normalizarResultado } from "@/lib/analise/normalizar";

describe("prompt contra respostas genéricas", () => {
  it("o inventário visual vem antes das piadas no schema (o modelo escreve na ordem)", () => {
    const ordem = Object.keys(FERRAMENTA_RESULTADO.input_schema.properties);
    const antes = (a: string, b: string) => expect(ordem.indexOf(a)).toBeLessThan(ordem.indexOf(b));
    antes("observacoes", "detalheSecreto");
    antes("detalheSecreto", "categorias");
    antes("categorias", "titulo");
    antes("observacoes", "veredito");
    expect(FERRAMENTA_RESULTADO.input_schema.required).toContain("observacoes");
    expect(FERRAMENTA_RESULTADO.input_schema.required).toContain("detalheSecreto");
  });

  it("lista os clichês proibidos no prompt", () => {
    for (const cliche of CLICHES_PROIBIDOS) expect(PROMPT_SISTEMA).toContain(`"${cliche}"`);
  });

  it("os exemplos da demo dão o exemplo: nenhum clichê e sempre um detalhe secreto", async () => {
    for (let i = 0; i < 5; i++) {
      const demo = new AnalisadorDemo({ atrasoMs: 0, aleatorio: () => i / 5 + 0.01 });
      const r = await demo.analisar();
      if (!r.valido) throw new Error("demo deveria ser válida");
      expect(r.detalheSecreto.length).toBeGreaterThan(20);
      const textos = [
        r.titulo,
        r.veredito,
        r.fraseCard,
        r.detalheSecreto,
        ...r.categorias.map((c) => c.comentario),
      ]
        .join(" ")
        .toLowerCase();
      for (const cliche of CLICHES_PROIBIDOS) expect(textos, `exemplo ${i}`).not.toContain(cliche);
    }
  });
});

describe("normalizarResultado: detalhe secreto", () => {
  it("mantém e corta o detalhe secreto, e ignora o inventário interno", () => {
    const r = normalizarResultado({
      valido: true,
      nota: 60,
      detalheSecreto: "  " + "a".repeat(400),
      observacoes: { pessoa: ["x"], pet: ["y"], coincidencias: ["z"] },
    });
    if (!r.valido) throw new Error("esperava válido");
    expect(r.detalheSecreto).toHaveLength(160);
    expect(r).not.toHaveProperty("observacoes");
  });

  it("fica vazio quando a IA não manda (respostas antigas)", () => {
    expect(normalizarResultado({ valido: true, nota: 60 })).toMatchObject({ detalheSecreto: "" });
  });
});
