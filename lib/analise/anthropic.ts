import { FERRAMENTA_RESULTADO, PROMPT_SISTEMA } from "./prompt";
import { normalizarResultado } from "./normalizar";
import { ErroAnalise, type AnalisadorDeFotos, type ImagemBase64 } from "./tipos";
import type { Resultado } from "@/lib/tipos";

const URL_API = "https://api.anthropic.com/v1/messages";
const VERSAO_API = "2023-06-01";
const MAX_TOKENS = 1200;
const TEMPERATURA = 0.8;

export type OpcoesAnthropic = {
  chave: string;
  modelo: string;
  timeoutMs: number;
  /** Permite injetar um fetch falso nos testes. */
  fetch?: typeof fetch;
};

type BlocoConteudo = { type: string; name?: string; input?: Record<string, unknown> };

export class AnalisadorAnthropic implements AnalisadorDeFotos {
  readonly consomeCota = true;
  private readonly fetch: typeof fetch;

  constructor(private readonly opcoes: OpcoesAnthropic) {
    this.fetch = opcoes.fetch ?? globalThis.fetch;
  }

  async analisar(pessoa: ImagemBase64, cachorro: ImagemBase64): Promise<Resultado> {
    const resposta = await this.chamarApi(pessoa, cachorro);
    const bloco = resposta.content?.find(
      (c) => c.type === "tool_use" && c.name === FERRAMENTA_RESULTADO.name,
    );
    if (!bloco?.input) throw new ErroAnalise("Resposta da IA sem resultado");
    return normalizarResultado(bloco.input);
  }

  private async chamarApi(
    pessoa: ImagemBase64,
    cachorro: ImagemBase64,
  ): Promise<{ content?: BlocoConteudo[] }> {
    let resposta: Response;
    try {
      resposta = await this.fetch(URL_API, {
        method: "POST",
        headers: {
          "x-api-key": this.opcoes.chave,
          "anthropic-version": VERSAO_API,
          "content-type": "application/json",
        },
        body: JSON.stringify(this.montarCorpo(pessoa, cachorro)),
        signal: AbortSignal.timeout(this.opcoes.timeoutMs),
      });
    } catch (erro) {
      throw new ErroAnalise("Falha de rede ao chamar a IA", { cause: erro });
    }

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      throw new ErroAnalise(`Anthropic respondeu ${resposta.status}: ${corpo.slice(0, 300)}`);
    }
    return resposta.json();
  }

  private montarCorpo(pessoa: ImagemBase64, cachorro: ImagemBase64) {
    const imagem = (img: ImagemBase64) => ({
      type: "image",
      source: { type: "base64", media_type: img.tipo, data: img.dados },
    });

    return {
      model: this.opcoes.modelo,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURA,
      system: PROMPT_SISTEMA,
      tools: [FERRAMENTA_RESULTADO],
      tool_choice: { type: "tool", name: FERRAMENTA_RESULTADO.name },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Foto 1 (deveria ser a pessoa):" },
            imagem(pessoa),
            { type: "text", text: "Foto 2 (deveria ser o cachorro):" },
            imagem(cachorro),
            { type: "text", text: "Compare os dois e registre o resultado." },
          ],
        },
      ],
    };
  }
}
