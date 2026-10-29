import { ferramentaParaTema, FERRAMENTA_RESULTADO, promptDoSistema } from "./prompt";
import type { Tema } from "@/lib/conteudo/temporada";
import { normalizarResultado } from "./normalizar";
import { ErroAnalise, type AnalisadorDeFotos, type ImagemBase64 } from "./tipos";
import type { Resultado } from "@/lib/tipos";

const URL_API = "https://api.anthropic.com/v1/messages";
const VERSAO_API = "2023-06-01";
// Folga generosa: os modelos 5.5 gastam ~30% mais tokens que modelos anteriores para o mesmo texto.
// O inventário visual (observacoes) vem antes do resultado e ocupa espaço.
const MAX_TOKENS = 3000;
// Não enviar temperature/top_p/top_k: os modelos Claude 5.5 não aceitam esses parâmetros
// (o tom das respostas é controlado só pelo prompt).

export type OpcoesAnthropic = {
  chave: string;
  modelo: string;
  timeoutMs: number;
  /** Permite injetar um fetch falso nos testes. */
  fetch?: typeof fetch;
};

type BlocoConteudo = { type: string; name?: string; input?: Record<string, unknown> };
type RespostaApi = { content?: BlocoConteudo[]; stop_reason?: string };

export class AnalisadorAnthropic implements AnalisadorDeFotos {
  readonly consomeCota = true;
  private readonly fetch: typeof fetch;

  constructor(private readonly opcoes: OpcoesAnthropic) {
    this.fetch = opcoes.fetch ?? globalThis.fetch;
  }

  async analisar(pessoa: ImagemBase64, pet: ImagemBase64, tema: Tema | null = null): Promise<Resultado> {
    const resposta = await this.chamarApi(pessoa, pet, tema);

    // O modelo pode se recusar a analisar (ex.: conteúdo impróprio). Não é falha técnica:
    // o usuário recebe uma mensagem amigável para tentar com outras fotos.
    if (resposta.stop_reason === "refusal") {
      return normalizarResultado({ valido: false, motivo: "outro" });
    }

    const bloco = resposta.content?.find(
      (c) => c.type === "tool_use" && c.name === FERRAMENTA_RESULTADO.name,
    );
    if (!bloco?.input) {
      throw new ErroAnalise(`Resposta da IA sem resultado (stop_reason: ${resposta.stop_reason ?? "?"})`);
    }
    return normalizarResultado(bloco.input, tema);
  }

  private async chamarApi(pessoa: ImagemBase64, pet: ImagemBase64, tema: Tema | null): Promise<RespostaApi> {
    let resposta: Response;
    try {
      resposta = await this.fetch(URL_API, {
        method: "POST",
        headers: {
          "x-api-key": this.opcoes.chave,
          "anthropic-version": VERSAO_API,
          "content-type": "application/json",
        },
        body: JSON.stringify(this.montarCorpo(pessoa, pet, tema)),
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

  private montarCorpo(pessoa: ImagemBase64, pet: ImagemBase64, tema: Tema | null) {
    const imagem = (img: ImagemBase64) => ({
      type: "image",
      source: { type: "base64", media_type: img.tipo, data: img.dados },
    });

    return {
      model: this.opcoes.modelo,
      max_tokens: MAX_TOKENS,
      system: promptDoSistema(tema),
      tools: [ferramentaParaTema(tema)],
      tool_choice: { type: "tool", name: FERRAMENTA_RESULTADO.name },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Foto 1 (deveria ser a pessoa):" },
            imagem(pessoa),
            { type: "text", text: "Foto 2 (deveria ser o pet):" },
            imagem(pet),
            {
              type: "text",
              text: "Faça primeiro o inventário detalhado das duas fotos e só depois compare. Quero o detalhe que ninguém percebeu, nada de frase genérica.",
            },
          ],
        },
      ],
    };
  }
}
