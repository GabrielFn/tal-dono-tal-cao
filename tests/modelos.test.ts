import { describe, expect, it } from "vitest";
import { AnalisadorAnthropic, aceitaFerramentaForcada } from "@/lib/analise/anthropic";
import { ferramentaParaTema, FERRAMENTA_RESULTADO } from "@/lib/analise/prompt";
import type { ImagemBase64 } from "@/lib/analise/tipos";
import { fetchFalso } from "./auxiliares";

const IMG: ImagemBase64 = { tipo: "image/jpeg", dados: "AAAA" };
const opcoes = (modelo: string) => ({ chave: "k", modelo, timeoutMs: 1000 });
const RESPOSTA_OK = {
  content: [{ type: "tool_use", name: FERRAMENTA_RESULTADO.name, input: { valido: true, nota: 70 } }],
};

async function corpoEnviado(modelo: string) {
  const { fn, chamadas } = fetchFalso(200, RESPOSTA_OK);
  await new AnalisadorAnthropic({ ...opcoes(modelo), fetch: fn }).analisar(IMG, IMG);
  return JSON.parse(String(chamadas[0].init?.body));
}

describe("compatibilidade com cada modelo", () => {
  it("Sonnet 5.5 e Opus 5.5 não recebem tool_choice forçado (dá erro 400 neles)", async () => {
    for (const modelo of ["claude-sonnet-5-5", "claude-opus-5-5"]) {
      expect(aceitaFerramentaForcada(modelo)).toBe(false);
      const corpo = await corpoEnviado(modelo);
      expect(corpo.tool_choice).toEqual({ type: "auto" });
      expect(corpo.thinking).toEqual({ type: "between_tools" });
    }
  });

  it("Haiku 5.5 continua com a ferramenta obrigatória e sem o campo thinking", async () => {
    const corpo = await corpoEnviado("claude-haiku-5-5");
    expect(corpo.tool_choice).toEqual({ type: "tool", name: FERRAMENTA_RESULTADO.name });
    expect(corpo).not.toHaveProperty("thinking");
    expect(corpo).not.toHaveProperty("temperature");
  });

  it("se o modelo responder em texto com JSON, o resultado ainda é aproveitado", async () => {
    const { fn } = fetchFalso(200, {
      content: [{ type: "text", text: 'Aqui está: {"valido": true, "nota": 64, "titulo": "Dupla"}' }],
    });
    const r = await new AnalisadorAnthropic({ ...opcoes("claude-sonnet-5-5"), fetch: fn }).analisar(IMG, IMG);
    expect(r).toMatchObject({ valido: true, nota: 64, titulo: "Dupla" });
  });
});

describe("schema compatível com strict: true", () => {
  type No = Record<string, unknown>;
  const problemas = (no: No, caminho = "raiz"): string[] => {
    const erros: string[] = [];
    for (const proibido of ["minimum", "maximum", "minLength", "maxLength", "multipleOf"])
      if (proibido in no) erros.push(`${caminho}: ${proibido}`);
    if (no.type === "object") {
      if (no.additionalProperties !== false) erros.push(`${caminho}: sem additionalProperties false`);
      const props = (no.properties ?? {}) as Record<string, No>;
      const obrigatorios = (no.required ?? []) as string[];
      for (const chave of Object.keys(props)) {
        if (!obrigatorios.includes(chave)) erros.push(`${caminho}.${chave}: não obrigatório`);
        erros.push(...problemas(props[chave], `${caminho}.${chave}`));
      }
    }
    if (no.type === "array" && no.items) erros.push(...problemas(no.items as No, `${caminho}[]`));
    return erros;
  };

  it.each([null, "halloween"] as const)("tema %s", (tema) => {
    const ferramenta = ferramentaParaTema(tema);
    expect(ferramenta.strict).toBe(true);
    expect(problemas(ferramenta.input_schema as unknown as No)).toEqual([]);
  });
});
