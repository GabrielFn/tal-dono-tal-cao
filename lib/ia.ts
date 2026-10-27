// Chamada à API da Anthropic (Claude) e limpeza da resposta.
import { FERRAMENTA_RESULTADO, PROMPT_SISTEMA } from "./prompt";
import type { Categoria, MotivoInvalido, Resultado } from "./tipos";

export type ImagemBase64 = { tipo: "image/jpeg" | "image/png" | "image/webp"; dados: string };

const NOMES_CATEGORIAS = ["Olhar", "Cabelo x pelo", "Expressão", "Pose e postura", "Vibe"];

const MENSAGENS_PADRAO: Record<MotivoInvalido, string> = {
  sem_pessoa: "Não encontramos um rosto humano. Manda uma selfie com o rosto bem visível!",
  sem_cachorro: "Cadê o au-au? Precisamos de uma foto do seu cachorro.",
  foto_ruim: "A foto ficou escura ou borrada. Tenta outra com mais luz e o rosto de frente.",
  outro: "Não conseguimos analisar essas fotos. Tenta com outras.",
};

const limitar = (n: unknown, min = 0, max = 100) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
};
const texto = (t: unknown, max: number) => String(t ?? "").trim().slice(0, max);

export class ErroIA extends Error {}

export async function analisarComIA(pessoa: ImagemBase64, cachorro: ImagemBase64): Promise<Resultado> {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) throw new ErroIA("ANTHROPIC_API_KEY não configurada");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": chave,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 1200,
      temperature: 0.8,
      system: PROMPT_SISTEMA,
      tools: [FERRAMENTA_RESULTADO],
      tool_choice: { type: "tool", name: FERRAMENTA_RESULTADO.name },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Foto 1 (deveria ser a pessoa):" },
            { type: "image", source: { type: "base64", media_type: pessoa.tipo, data: pessoa.dados } },
            { type: "text", text: "Foto 2 (deveria ser o cachorro):" },
            { type: "image", source: { type: "base64", media_type: cachorro.tipo, data: cachorro.dados } },
            { type: "text", text: "Compare os dois e registre o resultado." },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!resp.ok) {
    const corpo = await resp.text().catch(() => "");
    throw new ErroIA(`Anthropic respondeu ${resp.status}: ${corpo.slice(0, 300)}`);
  }

  const json = (await resp.json()) as {
    content?: Array<{ type: string; name?: string; input?: Record<string, unknown> }>;
  };
  const bloco = json.content?.find((c) => c.type === "tool_use" && c.name === FERRAMENTA_RESULTADO.name);
  if (!bloco?.input) throw new ErroIA("Resposta da IA sem resultado");

  return normalizar(bloco.input);
}

// Garante que a resposta da IA tem o formato certo, mesmo se ela "escorregar".
export function normalizar(bruto: Record<string, unknown>): Resultado {
  if (!bruto.valido) {
    const motivo = (["sem_pessoa", "sem_cachorro", "foto_ruim", "outro"] as const).includes(
      bruto.motivo as MotivoInvalido,
    )
      ? (bruto.motivo as MotivoInvalido)
      : "outro";
    return {
      valido: false,
      motivo,
      mensagem: texto(bruto.mensagem, 200) || MENSAGENS_PADRAO[motivo],
    };
  }

  const recebidas = Array.isArray(bruto.categorias) ? (bruto.categorias as Record<string, unknown>[]) : [];
  const categorias: Categoria[] = NOMES_CATEGORIAS.map((nome, i) => {
    const achada =
      recebidas.find((c) => String(c.nome ?? "").toLowerCase() === nome.toLowerCase()) ?? recebidas[i] ?? {};
    return { nome, nota: limitar(achada.nota), comentario: texto(achada.comentario, 120) };
  });

  const media = Math.round(categorias.reduce((s, c) => s + c.nota, 0) / categorias.length);
  const nota = bruto.nota === undefined ? media : limitar(bruto.nota);

  return {
    valido: true,
    nota,
    titulo: texto(bruto.titulo, 50) || "Dupla dinâmica",
    veredito: texto(bruto.veredito, 320),
    fraseCard: texto(bruto.fraseCard, 90),
    racaProvavel: texto(bruto.racaProvavel, 50) || "Cachorro de respeito",
    categorias,
  };
}
