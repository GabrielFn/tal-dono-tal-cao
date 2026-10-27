import type { ImagemBase64, TipoImagem } from "./tipos";

const TIPOS_ACEITOS: readonly TipoImagem[] = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MINIMO_BYTES = 2_000;
export const TAMANHO_MAXIMO_BYTES = 2.5 * 1024 * 1024;

const PADRAO_DATA_URL = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/;

function tamanhoDecodificado(base64: string): number {
  const preenchimento = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - preenchimento;
}

/** Converte um data URL em imagem validada, ou devolve null se for inválido. */
export function lerImagemDataUrl(valor: unknown): ImagemBase64 | null {
  if (typeof valor !== "string") return null;

  const encontrado = PADRAO_DATA_URL.exec(valor);
  if (!encontrado) return null;

  const [, tipo, dados] = encontrado;
  if (!TIPOS_ACEITOS.includes(tipo as TipoImagem)) return null;

  const bytes = tamanhoDecodificado(dados);
  if (bytes < TAMANHO_MINIMO_BYTES || bytes > TAMANHO_MAXIMO_BYTES) return null;

  return { tipo: tipo as TipoImagem, dados };
}

/** IP do cliente. Na Vercel, o primeiro item de x-forwarded-for é definido pela própria plataforma. */
export function obterIp(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || cabecalhos.get("x-real-ip")?.trim() || "desconhecido";
}
