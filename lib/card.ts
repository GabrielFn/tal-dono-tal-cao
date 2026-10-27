// Roda no navegador: desenha o card 1080x1920 (formato Stories/TikTok) para compartilhar.
import type { ResultadoValido } from "./tipos";

const L = 1080;
const A = 1920;
const FONTE = `"Arial Rounded MT Bold", "Nunito", ui-rounded, "Segoe UI", system-ui, sans-serif`;
const COR = {
  fundo: "#FFF3E0",
  tinta: "#2A1A10",
  laranja: "#FF6B2C",
  verde: "#17A398",
  amarelo: "#FFC93C",
  branco: "#FFFFFF",
};

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let linha = "";
  for (const p of palavras) {
    const teste = linha ? `${linha} ${p}` : p;
    if (ctx.measureText(teste).width > largura && linha) {
      linhas.push(linha);
      linha = p;
    } else linha = teste;
  }
  if (linha) linhas.push(linha);
  return linhas;
}

function retanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fotoCircular(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  // sombra "adesivo"
  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  ctx.arc(cx + 14, cy + 14, r + 10, 0, Math.PI * 2);
  ctx.fill();
  // borda
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fill();
  // foto recortada no centro (object-fit: cover)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const lado = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - lado) / 2;
  const sy = (img.naturalHeight - lado) / 2.6; // leve viés para cima: rostos costumam ficar no topo
  ctx.drawImage(img, sx, Math.max(0, sy), lado, lado, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function etiqueta(ctx: CanvasRenderingContext2D, texto: string, cx: number, cy: number, cor: string) {
  ctx.font = `800 40px ${FONTE}`;
  const w = ctx.measureText(texto).width + 60;
  ctx.fillStyle = COR.tinta;
  retanguloArredondado(ctx, cx - w / 2 + 6, cy - 32 + 6, w, 64, 32);
  ctx.fill();
  ctx.fillStyle = cor;
  retanguloArredondado(ctx, cx - w / 2, cy - 32, w, 64, 32);
  ctx.fill();
  ctx.strokeStyle = COR.tinta;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = COR.branco;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, cx, cy + 2);
}

async function dataUrlParaImagem(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export async function gerarCard(
  r: ResultadoValido,
  fotoPessoa: string,
  fotoCachorro: string,
  site: string,
): Promise<Blob> {
  const [imgP, imgC] = await Promise.all([dataUrlParaImagem(fotoPessoa), dataUrlParaImagem(fotoCachorro)]);
  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext("2d")!;

  // Fundo com bolinhas
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, L, A);
  ctx.fillStyle = "rgba(42,26,16,0.06)";
  for (let y = 30; y < A; y += 60)
    for (let x = (y / 60) % 2 ? 30 : 60; x < L; x += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

  // Marca no topo
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COR.tinta;
  ctx.font = `900 54px ${FONTE}`;
  ctx.fillText("TAL DONO, TAL CÃO", L / 2, 150);

  // Fotos
  fotoCircular(ctx, imgP, 300, 560, 220);
  fotoCircular(ctx, imgC, 780, 560, 220);
  etiqueta(ctx, "EU", 300, 840, COR.verde);
  etiqueta(ctx, "AU-AU", 780, 840, COR.laranja);

  // Selo "=" no meio
  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  ctx.arc(546, 566, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COR.amarelo;
  ctx.beginPath();
  ctx.arc(540, 560, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = COR.tinta;
  ctx.stroke();
  ctx.fillStyle = COR.tinta;
  ctx.font = `900 96px ${FONTE}`;
  ctx.fillText("≈", 540, 566);

  // Nota gigante
  ctx.font = `900 300px ${FONTE}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 26;
  ctx.strokeStyle = COR.tinta;
  ctx.strokeText(`${r.nota}%`, L / 2 + 10, 1120 + 10);
  ctx.fillStyle = COR.tinta;
  ctx.fillText(`${r.nota}%`, L / 2 + 10, 1120 + 10);
  ctx.strokeText(`${r.nota}%`, L / 2, 1120);
  ctx.fillStyle = COR.laranja;
  ctx.fillText(`${r.nota}%`, L / 2, 1120);

  ctx.fillStyle = COR.tinta;
  ctx.font = `800 52px ${FONTE}`;
  ctx.fillText("PARECIDOS", L / 2, 1300);

  // Título e frase
  ctx.font = `900 76px ${FONTE}`;
  let y = 1430;
  for (const linha of quebrarTexto(ctx, r.titulo, 920).slice(0, 2)) {
    ctx.fillText(linha, L / 2, y);
    y += 88;
  }
  if (r.fraseCard) {
    ctx.font = `600 46px ${FONTE}`;
    ctx.fillStyle = "rgba(42,26,16,0.8)";
    y += 10;
    for (const linha of quebrarTexto(ctx, `“${r.fraseCard}”`, 900).slice(0, 2)) {
      ctx.fillText(linha, L / 2, y);
      y += 60;
    }
  }

  // Rodapé com o site (marca d'água)
  const dominio = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.fillStyle = COR.tinta;
  retanguloArredondado(ctx, 120, 1740, 840, 110, 55);
  ctx.fill();
  ctx.fillStyle = COR.branco;
  const rodape = `Descubra o seu em ${dominio}`;
  let tamanho = 40;
  do {
    ctx.font = `800 ${tamanho}px ${FONTE}`;
    tamanho -= 2;
  } while (ctx.measureText(rodape).width > 760 && tamanho > 20);
  ctx.fillText(rodape, L / 2, 1797);

  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Falha ao gerar o card"))), "image/png"),
  );
}
