// "Certificado Oficial de Sósia" (premium): imagem paisagem no formato A4, gerada no navegador.
import type { ResultadoValido } from "@/lib/tipos";
import {
  ajustarFonte,
  canvasParaBlob,
  carregarImagem,
  circulo,
  COR,
  criarCanvas,
  fonte,
  fotoEmCirculo,
  type Ctx,
} from "./desenho";

export const LARGURA_CERTIFICADO = 1754;
export const ALTURA_CERTIFICADO = 1240; // proporção A4 deitada
const CX = LARGURA_CERTIFICADO / 2;

export type DadosCertificado = Pick<ResultadoValido, "nota" | "titulo" | "ehCachorro" | "especie"> & {
  nomeTutor: string;
  nomePet: string;
  /** Usado para gerar o número do certificado. */
  codigo: string;
  emitidoEm: Date;
};

export const NOME_TUTOR_PADRAO = "Tutor(a) de respeito";
export const NOME_PET_PADRAO = "Pet de respeito";

/** Número curto e estável a partir do código da compra. Ex.: "TDTC-048213". */
export function numeroCertificado(codigo: string): string {
  let hash = 2166136261;
  for (const letra of codigo) {
    hash ^= letra.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `TDTC-${String((hash >>> 0) % 1_000_000).padStart(6, "0")}`;
}

export function dataPorExtenso(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function desenharMoldura(ctx: Ctx) {
  ctx.fillStyle = COR.papel;
  ctx.fillRect(0, 0, LARGURA_CERTIFICADO, ALTURA_CERTIFICADO);
  ctx.lineWidth = 18;
  ctx.strokeStyle = COR.tinta;
  ctx.strokeRect(24, 24, LARGURA_CERTIFICADO - 48, ALTURA_CERTIFICADO - 48);
  ctx.lineWidth = 4;
  ctx.strokeStyle = COR.laranja;
  ctx.setLineDash([18, 12]);
  ctx.strokeRect(58, 58, LARGURA_CERTIFICADO - 116, ALTURA_CERTIFICADO - 116);
  ctx.setLineDash([]);
  // Patinhas nos cantos
  for (const [x, y] of [
    [100, 100],
    [LARGURA_CERTIFICADO - 100, 100],
    [100, ALTURA_CERTIFICADO - 100],
    [LARGURA_CERTIFICADO - 100, ALTURA_CERTIFICADO - 100],
  ]) {
    desenharPatinha(ctx, x, y, 0.8, COR.laranja);
  }
}

function desenharPatinha(ctx: Ctx, x: number, y: number, escala: number, cor: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.ellipse(0, 8, 16, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [
    [-17, -10],
    [-6, -20],
    [6, -20],
    [17, -10],
  ]) {
    ctx.beginPath();
    ctx.ellipse(dx, dy, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function desenharCabecalho(ctx: Ctx) {
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, 84);
  ctx.fillText("CERTIFICADO OFICIAL DE SÓSIA", CX, 175);
  ctx.font = fonte(700, 30);
  ctx.fillStyle = COR.tintaSuave;
  ctx.fillText("Emitido pelo Júri Canino do Tal Dono, Tal Cão", CX, 245);
}

function desenharFoto(ctx: Ctx, img: HTMLImageElement, cx: number, cy: number) {
  circulo(ctx, cx + 10, cy + 10, 168, COR.tinta);
  circulo(ctx, cx, cy, 168, COR.tinta);
  fotoEmCirculo(ctx, img, cx, cy, 160);
}

function desenharCorpo(ctx: Ctx, d: DadosCertificado) {
  const larguraTexto = 760;
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(600, 32);
  ctx.fillText("Certificamos, para os devidos fins de fofura, que", CX, 360);

  ctx.fillStyle = COR.laranja;
  ajustarFonte(ctx, d.nomeTutor, { peso: 900, max: 64, min: 34, largura: larguraTexto });
  ctx.fillText(d.nomeTutor, CX, 440);

  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(600, 32);
  ctx.fillText("e", CX, 505);

  ctx.fillStyle = COR.verde;
  ajustarFonte(ctx, d.nomePet, { peso: 900, max: 64, min: 34, largura: larguraTexto });
  ctx.fillText(d.nomePet, CX, 570);

  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(600, 32);
  ctx.fillText("são oficialmente", CX, 640);

  ctx.font = fonte(900, 120);
  ctx.lineJoin = "round";
  ctx.lineWidth = 14;
  ctx.strokeStyle = COR.tinta;
  const nota = `${d.nota}% PARECIDOS`;
  // Cabe entre as duas fotos (que vão até x≈458 e x≈1296).
  ajustarFonte(ctx, nota, { peso: 900, max: 110, min: 60, largura: 800 });
  ctx.strokeText(nota, CX, 750);
  ctx.fillStyle = COR.amarelo;
  ctx.fillText(nota, CX, 750);

  ctx.fillStyle = COR.tinta;
  ajustarFonte(ctx, `— ${d.titulo} —`, { peso: 700, max: 40, min: 26, largura: 1100, estilo: "italic" });
  ctx.fillText(`— ${d.titulo} —`, CX, 850);

  if (!d.ehCachorro) {
    ctx.fillStyle = COR.tintaSuave;
    ajustarFonte(ctx, `(com ressalvas: o júri constatou que se trata de ${d.especie})`, {
      peso: 600,
      max: 28,
      min: 20,
      largura: 1100,
    });
    ctx.fillText(`(com ressalvas: o júri constatou que se trata de ${d.especie})`, CX, 905);
  }
}

function desenharSelo(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.scale(0.85, 0.85);
  // Borda serrilhada
  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  const pontas = 24;
  for (let i = 0; i <= pontas * 2; i++) {
    const raio = i % 2 ? 108 : 122;
    const ang = (i / (pontas * 2)) * Math.PI * 2;
    ctx.lineTo(Math.cos(ang) * raio, Math.sin(ang) * raio);
  }
  ctx.fill();
  circulo(ctx, 0, 0, 100, COR.amarelo);
  ctx.lineWidth = 4;
  ctx.strokeStyle = COR.tinta;
  ctx.beginPath();
  ctx.arc(0, 0, 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, 27);
  ctx.fillText("APROVADO", 0, -22);
  ctx.font = fonte(700, 18);
  ctx.fillText("PELO JÚRI CANINO", 0, 10);
  desenharPatinha(ctx, 0, 52, 0.8, COR.tinta);
  ctx.restore();
}

function desenharRodape(ctx: Ctx, d: DadosCertificado) {
  const y = 1060;
  // Emissão
  ctx.textAlign = "left";
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(700, 26);
  ctx.fillText(`Emitido em ${dataPorExtenso(d.emitidoEm)}`, 140, y);
  ctx.font = fonte(600, 24);
  ctx.fillStyle = COR.tintaSuave;
  ctx.fillText(`Nº ${numeroCertificado(d.codigo)}`, 140, y + 40);

  // Assinatura
  ctx.textAlign = "center";
  const xAss = LARGURA_CERTIFICADO - 400;
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(700, 52, "italic");
  ctx.fillText("Dr. Au-Au", xAss, y - 30);
  ctx.fillRect(xAss - 190, y + 2, 380, 3);
  ctx.font = fonte(700, 24);
  ctx.fillText("Juiz-Chefe do Júri Canino", xAss, y + 32);
  if (!d.ehCachorro) {
    ctx.font = fonte(600, 20);
    ctx.fillStyle = COR.tintaSuave;
    ctx.fillText("(assinou sob protesto)", xAss, y + 62);
  }
  ctx.textAlign = "center";
}

export async function gerarCertificado(
  dados: DadosCertificado,
  fotoPessoa: string,
  fotoBicho: string,
): Promise<Blob> {
  const [pessoa, bicho] = await Promise.all([carregarImagem(fotoPessoa), carregarImagem(fotoBicho)]);
  const { canvas, ctx } = criarCanvas(LARGURA_CERTIFICADO, ALTURA_CERTIFICADO);

  desenharMoldura(ctx);
  desenharCabecalho(ctx);
  desenharFoto(ctx, pessoa, 290, 560);
  desenharFoto(ctx, bicho, LARGURA_CERTIFICADO - 290, 560);
  desenharCorpo(ctx, dados);
  desenharSelo(ctx, CX, 1065);
  desenharRodape(ctx, dados);

  return canvasParaBlob(canvas);
}
