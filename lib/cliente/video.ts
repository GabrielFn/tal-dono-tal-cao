// Vídeo animado 1080x1920 para Reels/TikTok (premium), gravado no próprio navegador.
// Anima a mesma cena do card (card.ts) e grava com MediaRecorder.
import {
  ALTURA_CENA,
  carregarImagensCena,
  desenharCena,
  LARGURA_CENA,
  textoDoSelo,
  type Animacao,
  type DadosCena,
} from "./card";
import { criarCanvas, suavizarComPulo, suavizarSaida, trecho } from "./desenho";

export const DURACAO_VIDEO_S = 7;
const QUADROS_POR_SEGUNDO = 30;
const BITS_POR_SEGUNDO = 8_000_000;

/** Em ordem de preferência: MP4 abre direto no Instagram/TikTok; WebM é o plano B. */
const FORMATOS = [
  { mime: "video/mp4;codecs=avc1.42E01E", extensao: "mp4" },
  { mime: "video/mp4;codecs=avc1", extensao: "mp4" },
  { mime: "video/mp4", extensao: "mp4" },
  { mime: "video/webm;codecs=vp9", extensao: "webm" },
  { mime: "video/webm;codecs=vp8", extensao: "webm" },
  { mime: "video/webm", extensao: "webm" },
] as const;

export type FormatoVideo = (typeof FORMATOS)[number];

export function formatoDeVideoSuportado(): FormatoVideo | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  if (typeof HTMLCanvasElement.prototype.captureStream !== "function") return null;
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported(f.mime)) ?? null;
}

/**
 * Linha do tempo (segundos): fotos entram → selo pula → nota conta →
 * plot twist "carimba" (se o bicho for inusitado) → título → frase e rodapé → pausa final.
 */
/** `comSelo`: a cena tem o selo inclinado no topo (plot twist ou gato preto). */
export function animacaoNoTempo(t: number, comSelo: boolean): Animacao {
  const inicioTitulo = comSelo ? 3.9 : 3.4;
  const plotTwist = !comSelo || t < 3.4 ? 0 : 1 + 2 * (1 - suavizarSaida(trecho(t, 3.4, 3.75)));
  const comPulo = (inicio: number, fim: number) => {
    const p = trecho(t, inicio, fim);
    return p <= 0 ? 0 : suavizarComPulo(p);
  };
  return {
    marca: trecho(t, 0, 0.4),
    fotos: suavizarSaida(trecho(t, 0.2, 1.0)),
    etiquetas: trecho(t, 0.9, 1.2),
    selo: comPulo(1.0, 1.4),
    nota: suavizarSaida(trecho(t, 1.4, 3.2)),
    legenda: trecho(t, 3.0, 3.3),
    plotTwist,
    titulo: comPulo(inicioTitulo, inicioTitulo + 0.4),
    frase: trecho(t, 4.3, 4.8),
    rodape: trecho(t, 4.6, 5.0),
  };
}

export type VideoGerado = { blob: Blob; formato: FormatoVideo };

export async function gerarVideo(
  dados: DadosCena,
  fotoPessoa: string,
  fotoBicho: string,
  dominio: string,
  aoProgredir?: (fracao: number) => void,
): Promise<VideoGerado> {
  const formato = formatoDeVideoSuportado();
  if (!formato)
    throw new Error("Este navegador não consegue gravar vídeo. Tenta pelo Chrome ou Safari atualizados.");

  const imagens = await carregarImagensCena(fotoPessoa, fotoBicho);
  const { canvas, ctx } = criarCanvas(LARGURA_CENA, ALTURA_CENA);
  const desenhar = (t: number) =>
    desenharCena(ctx, dados, imagens, dominio, animacaoNoTempo(t, textoDoSelo(dados) !== null));
  desenhar(0);

  const stream = canvas.captureStream(QUADROS_POR_SEGUNDO);
  const gravador = new MediaRecorder(stream, {
    mimeType: formato.mime,
    videoBitsPerSecond: BITS_POR_SEGUNDO,
  });
  const pedacos: Blob[] = [];
  gravador.ondataavailable = (e) => e.data.size > 0 && pedacos.push(e.data);
  const terminou = new Promise<void>((ok, falha) => {
    gravador.onstop = () => ok();
    gravador.onerror = () => falha(new Error("Falha ao gravar o vídeo"));
  });

  gravador.start(250);
  const inicio = performance.now();

  await new Promise<void>((ok) => {
    const quadro = () => {
      const t = (performance.now() - inicio) / 1000;
      desenhar(Math.min(t, DURACAO_VIDEO_S));
      aoProgredir?.(Math.min(1, t / DURACAO_VIDEO_S));
      if (t >= DURACAO_VIDEO_S) ok();
      else requestAnimationFrame(quadro);
    };
    requestAnimationFrame(quadro);
  });

  gravador.stop();
  await terminou;
  stream.getTracks().forEach((faixa) => faixa.stop());

  const blob = new Blob(pedacos, { type: formato.mime.split(";")[0] });
  if (blob.size === 0)
    throw new Error("O vídeo saiu vazio. Mantém a tela aberta durante a gravação e tenta de novo.");
  return { blob, formato };
}
