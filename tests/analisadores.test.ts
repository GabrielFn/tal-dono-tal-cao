import { describe, expect, it } from "vitest";
import { criarAnalisador } from "@/lib/analise";
import { AnalisadorAnthropic } from "@/lib/analise/anthropic";
import { AnalisadorDemo } from "@/lib/analise/demo";
import { FERRAMENTA_RESULTADO } from "@/lib/analise/prompt";
import { ErroAnalise, type ImagemBase64 } from "@/lib/analise/tipos";
import { lerConfigServidor } from "@/lib/config/servidor";
import { fetchFalso } from "./auxiliares";

const IMG: ImagemBase64 = { tipo: "image/jpeg", dados: "AAAA" };
const OPCOES = { chave: "chave-teste", modelo: "modelo-teste", timeoutMs: 1000 };

describe("AnalisadorAnthropic", () => {
  it("monta a requisição com chave, modelo, ferramenta obrigatória e as duas imagens", async () => {
    const { fn, chamadas } = fetchFalso(200, {
      content: [{ type: "tool_use", name: FERRAMENTA_RESULTADO.name, input: { valido: true, nota: 70 } }],
    });
    await new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG);

    const { init } = chamadas[0];
    const headers = init?.headers as Record<string, string>;
    const corpo = JSON.parse(String(init?.body));
    expect(headers["x-api-key"]).toBe("chave-teste");
    expect(corpo.model).toBe("modelo-teste");
    expect(corpo.tool_choice).toEqual({ type: "tool", name: FERRAMENTA_RESULTADO.name });
    expect(corpo.messages[0].content.filter((c: { type: string }) => c.type === "image")).toHaveLength(2);
  });

  it("normaliza a resposta da ferramenta", async () => {
    const { fn } = fetchFalso(200, {
      content: [
        { type: "text", text: "pensando" },
        { type: "tool_use", name: FERRAMENTA_RESULTADO.name, input: { valido: true, nota: 250 } },
      ],
    });
    const r = await new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG);
    expect(r).toMatchObject({ valido: true, nota: 100 });
  });

  it("lança ErroAnalise em erro HTTP", async () => {
    const { fn } = fetchFalso(401, { error: "invalid x-api-key" });
    await expect(new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG)).rejects.toBeInstanceOf(
      ErroAnalise,
    );
  });

  it("lança ErroAnalise se a IA não chamar a ferramenta", async () => {
    const { fn } = fetchFalso(200, { content: [{ type: "text", text: "oi" }] });
    await expect(new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG)).rejects.toBeInstanceOf(
      ErroAnalise,
    );
  });

  it("lança ErroAnalise em falha de rede", async () => {
    const quebrado = (async () => {
      throw new TypeError("network");
    }) as typeof fetch;
    await expect(
      new AnalisadorAnthropic({ ...OPCOES, fetch: quebrado }).analisar(IMG, IMG),
    ).rejects.toBeInstanceOf(ErroAnalise);
  });

  it("REGRESSÃO: não envia temperature, top_p nem top_k (o Claude Haiku 5.5 não aceita)", async () => {
    const { fn, chamadas } = fetchFalso(200, {
      content: [{ type: "tool_use", name: FERRAMENTA_RESULTADO.name, input: { valido: true } }],
    });
    await new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG);
    const corpo = JSON.parse(String(chamadas[0].init?.body));
    expect(corpo).not.toHaveProperty("temperature");
    expect(corpo).not.toHaveProperty("top_p");
    expect(corpo).not.toHaveProperty("top_k");
  });

  it("não termina a conversa com mensagem do assistente (prefill dá erro 400 no Haiku 5.5)", async () => {
    const { fn, chamadas } = fetchFalso(200, {
      content: [{ type: "tool_use", name: FERRAMENTA_RESULTADO.name, input: { valido: true } }],
    });
    await new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG);
    const { messages } = JSON.parse(String(chamadas[0].init?.body));
    expect(messages.at(-1).role).toBe("user");
  });

  it("recusa do modelo vira resultado inválido amigável, não erro técnico", async () => {
    const { fn } = fetchFalso(200, { content: [], stop_reason: "refusal" });
    const r = await new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG);
    expect(r).toMatchObject({ valido: false, motivo: "outro" });
  });

  it("resposta cortada por max_tokens vira ErroAnalise com o motivo", async () => {
    const { fn } = fetchFalso(200, { content: [{ type: "text", text: "..." }], stop_reason: "max_tokens" });
    await expect(new AnalisadorAnthropic({ ...OPCOES, fetch: fn }).analisar(IMG, IMG)).rejects.toThrow(
      /max_tokens/,
    );
  });
});

describe("AnalisadorDemo", () => {
  it("devolve um resultado marcado como demo e não consome cota", async () => {
    const demo = new AnalisadorDemo({ atrasoMs: 0, aleatorio: () => 0 });
    expect(demo.consomeCota).toBe(false);
    expect(await demo.analisar()).toMatchObject({ valido: true, demo: true });
  });

  it("nunca estoura o índice, mesmo com aleatorio() = 1", async () => {
    const demo = new AnalisadorDemo({ atrasoMs: 0, aleatorio: () => 1 });
    expect((await demo.analisar()).valido).toBe(true);
  });
});

describe("criarAnalisador (factory) + lerConfigServidor", () => {
  it("usa o demo sem chave", () => {
    expect(criarAnalisador(lerConfigServidor({} as NodeJS.ProcessEnv))).toBeInstanceOf(AnalisadorDemo);
  });

  it("usa o demo com DEMO_MODE=1 mesmo com chave", () => {
    const env = { ANTHROPIC_API_KEY: "x", DEMO_MODE: "1" } as unknown as NodeJS.ProcessEnv;
    expect(criarAnalisador(lerConfigServidor(env))).toBeInstanceOf(AnalisadorDemo);
  });

  it("usa a Anthropic com chave", () => {
    const env = { ANTHROPIC_API_KEY: "x" } as unknown as NodeJS.ProcessEnv;
    expect(criarAnalisador(lerConfigServidor(env))).toBeInstanceOf(AnalisadorAnthropic);
  });

  it("ignora limites inválidos e usa os padrões", () => {
    const env = { LIMITE_DIARIO_POR_IP: "abc", LIMITE_DIARIO_GLOBAL: "-3" } as unknown as NodeJS.ProcessEnv;
    expect(lerConfigServidor(env).limites).toEqual({ porIp: 5, global: 500 });
  });

  it("só liga o Upstash com URL e token", () => {
    const soUrl = { UPSTASH_REDIS_REST_URL: "u" } as unknown as NodeJS.ProcessEnv;
    expect(lerConfigServidor(soUrl).upstash).toBeUndefined();
  });
});
