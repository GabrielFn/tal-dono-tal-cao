// Peças de desenho compartilhadas pelo card, pelo certificado e pelo vídeo (navegador).

export const FONTE = `"Arial Rounded MT Bold", "Nunito", ui-rounded, "Segoe UI", system-ui, sans-serif`;

export const COR = {
  fundo: "#FFF3E0",
  papel: "#FFFBF3",
  tinta: "#2A1A10",
  tintaSuave: "rgba(42,26,16,0.8)",
  bolinhas: "rgba(42,26,16,0.06)",
  laranja: "#FF6B2C",
  verde: "#17A398",
  amarelo: "#FFC93C",
  branco: "#FFFFFF",
} as const;

export type Ctx = CanvasRenderingContext2D;

export function fonte(peso: number, tamanho: number, estilo = ""): string {
  return `${estilo} ${peso} ${tamanho}px ${FONTE}`.trim();
}

/** Diminui a fonte até o texto caber na largura. Deixa a fonte aplicada no ctx e devolve o tamanho. */
export function ajustarFonte(
  ctx: Ctx,
  texto: string,
  {
    peso,
    max,
    min,
    largura,
    estilo = "",
  }: { peso: number; max: number; min: number; largura: number; estilo?: string },
): number {
  let tamanho = max;
  ctx.font = fonte(peso, tamanho, estilo);
  while (ctx.measureText(texto).width > largura && tamanho > min) {
    tamanho -= 2;
    ctx.font = fonte(peso, tamanho, estilo);
  }
  return tamanho;
}

export function quebrarTexto(ctx: Ctx, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  let linha = "";
  for (const palavra of texto.split(/\s+/)) {
    const teste = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largura && linha) {
      linhas.push(linha);
      linha = palavra;
    } else {
      linha = teste;
    }
  }
  if (linha) linhas.push(linha);
  return linhas;
}

/** Escreve linhas centralizadas em `x` e devolve o y depois da última linha. */
export function escreverLinhas(ctx: Ctx, linhas: string[], x: number, yInicial: number, alturaLinha: number) {
  let y = yInicial;
  for (const linha of linhas) {
    ctx.fillText(linha, x, y);
    y += alturaLinha;
  }
  return y;
}

export function circulo(ctx: Ctx, x: number, y: number, raio: number, cor: string) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);
  ctx.fill();
}

export function retanguloArredondado(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  cor: string,
) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Foto recortada em círculo (object-fit: cover), levemente para cima, onde costumam ficar os rostos. */
export function fotoEmCirculo(
  ctx: Ctx,
  img: CanvasImageSource & { width: number; height: number },
  cx: number,
  cy: number,
  raio: number,
) {
  const largura = "naturalWidth" in img ? (img as HTMLImageElement).naturalWidth : img.width;
  const altura = "naturalHeight" in img ? (img as HTMLImageElement).naturalHeight : img.height;
  const lado = Math.min(largura, altura);
  const sx = (largura - lado) / 2;
  const sy = Math.max(0, (altura - lado) / 2.6);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, lado, lado, cx - raio, cy - raio, raio * 2, raio * 2);
  ctx.restore();
}

export async function carregarImagem(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export function criarCanvas(largura: number, altura: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  return { canvas, ctx };
}

export function canvasParaBlob(canvas: HTMLCanvasElement, tipo = "image/png"): Promise<Blob> {
  return new Promise((ok, falha) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : falha(new Error("Falha ao gerar a imagem"))), tipo),
  );
}

// ---- Curvas de animação (usadas pelo vídeo) ----

export const limitar01 = (t: number) => Math.min(1, Math.max(0, t));

/** Progresso 0→1 de um trecho [inicio, fim] dentro do tempo t (em segundos). */
export const trecho = (t: number, inicio: number, fim: number) => limitar01((t - inicio) / (fim - inicio));

export const suavizarSaida = (p: number) => 1 - Math.pow(1 - p, 3);

/** Passa um pouco do ponto e volta: efeito de "pulo". */
export function suavizarComPulo(p: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}
