// Cena 1080x1920 (formato Stories/TikTok). O card é a cena completa; o vídeo anima a mesma cena.
import type { ResultadoValido } from "@/lib/tipos";
import {
  ajustarFonte,
  canvasParaBlob,
  carregarImagem,
  circulo,
  COR,
  criarCanvas,
  escreverLinhas,
  fonte,
  fotoEmCirculo,
  quebrarTexto,
  retanguloArredondado,
  type Ctx,
} from "./desenho";

export const LARGURA_CENA = 1080;
export const ALTURA_CENA = 1920;
const CENTRO_X = LARGURA_CENA / 2;

/** Posições de cada elemento. Mude aqui para reorganizar o card (e o vídeo). */
const LAYOUT = {
  marca: { y: 150, tamanho: 54 },
  fotos: { y: 560, raio: 220, xPessoa: 300, xCachorro: 780, borda: 10, sombra: 14 },
  etiquetas: { y: 840, tamanho: 40, altura: 64 },
  selo: { raio: 70, sombra: 6 },
  nota: { y: 1120, tamanho: 300, contorno: 26, sombra: 10 },
  legenda: { y: 1300, tamanho: 52 },
  titulo: { y: 1430, tamanho: 76, alturaLinha: 88, largura: 920, maxLinhas: 2 },
  frase: { espaco: 10, tamanho: 46, alturaLinha: 60, largura: 900, maxLinhas: 2 },
  rodape: { x: 120, y: 1740, largura: 840, altura: 110, tamanhoMax: 40, tamanhoMin: 20, larguraTexto: 760 },
  bolinhas: { espaco: 60, raio: 5 },
  plotTwist: { y: 250, altura: 76, rotacao: -0.05, tamanhoMax: 38, tamanhoMin: 22, larguraMax: 860 },
} as const;

export type DadosCena = Pick<
  ResultadoValido,
  "nota" | "titulo" | "fraseCard" | "somDoAnimal" | "ehCachorro" | "especie"
>;

export type ImagensCena = { pessoa: HTMLImageElement; bicho: HTMLImageElement };

/**
 * Progresso de cada elemento, de 0 (invisível) a 1 (no lugar).
 * Valores acima de 1 são permitidos em escalas, para o efeito de "pulo".
 */
export type Animacao = {
  marca: number;
  fotos: number;
  etiquetas: number;
  selo: number;
  nota: number;
  legenda: number;
  plotTwist: number;
  titulo: number;
  frase: number;
  rodape: number;
};

export const CENA_COMPLETA: Animacao = {
  marca: 1,
  fotos: 1,
  etiquetas: 1,
  selo: 1,
  nota: 1,
  legenda: 1,
  plotTwist: 1,
  titulo: 1,
  frase: 1,
  rodape: 1,
};

/** Desenha algo com transparência e escala em torno de (cx, cy). Não desenha nada se p <= 0. */
function comEfeito(ctx: Ctx, p: number, cx: number, cy: number, escala: number, desenhar: () => void) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, p);
  if (escala !== 1) {
    ctx.translate(cx, cy);
    ctx.scale(escala, escala);
    ctx.translate(-cx, -cy);
  }
  desenhar();
  ctx.restore();
}

function desenharFundo(ctx: Ctx) {
  const { espaco, raio } = LAYOUT.bolinhas;
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA_CENA, ALTURA_CENA);
  for (let y = espaco / 2, linha = 0; y < ALTURA_CENA; y += espaco, linha++) {
    const deslocamento = linha % 2 ? espaco / 2 : espaco;
    for (let x = deslocamento; x < LARGURA_CENA; x += espaco) circulo(ctx, x, y, raio, COR.bolinhas);
  }
}

function desenharMarca(ctx: Ctx) {
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, LAYOUT.marca.tamanho);
  ctx.fillText("TAL DONO, TAL CÃO", CENTRO_X, LAYOUT.marca.y);
}

function desenharFoto(ctx: Ctx, img: HTMLImageElement, cx: number) {
  const { y: cy, raio, borda, sombra } = LAYOUT.fotos;
  circulo(ctx, cx + sombra, cy + sombra, raio + borda, COR.tinta);
  circulo(ctx, cx, cy, raio + borda, COR.tinta);
  fotoEmCirculo(ctx, img, cx, cy, raio);
}

function desenharEtiqueta(ctx: Ctx, texto: string, cx: number, cor: string) {
  const { y: cy, tamanho, altura } = LAYOUT.etiquetas;
  ctx.font = fonte(800, tamanho);
  const largura = ctx.measureText(texto).width + 60;
  const x = cx - largura / 2;
  const y = cy - altura / 2;
  retanguloArredondado(ctx, x + 6, y + 6, largura, altura, altura / 2, COR.tinta);
  retanguloArredondado(ctx, x, y, largura, altura, altura / 2, cor);
  ctx.strokeStyle = COR.tinta;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = COR.branco;
  ctx.fillText(texto, cx, cy + 2);
}

/** Selo inclinado "PLOT TWIST: É GATO!" quando o bicho não é cachorro. */
function desenharSeloPlotTwist(ctx: Ctx, especie: string) {
  const p = LAYOUT.plotTwist;
  const texto = `PLOT TWIST: É ${especie.toLocaleUpperCase("pt-BR")}!`;
  ajustarFonte(ctx, texto, { peso: 900, max: p.tamanhoMax, min: p.tamanhoMin, largura: p.larguraMax - 60 });
  const largura = ctx.measureText(texto).width + 60;

  ctx.save();
  ctx.translate(CENTRO_X, p.y);
  ctx.rotate(p.rotacao);
  retanguloArredondado(ctx, -largura / 2 + 7, -p.altura / 2 + 7, largura, p.altura, 14, COR.tinta);
  retanguloArredondado(ctx, -largura / 2, -p.altura / 2, largura, p.altura, 14, COR.amarelo);
  ctx.lineWidth = 5;
  ctx.strokeStyle = COR.tinta;
  ctx.stroke();
  ctx.fillStyle = COR.tinta;
  ctx.fillText(texto, 0, 3);
  ctx.restore();
}

function desenharSelo(ctx: Ctx) {
  const { raio, sombra } = LAYOUT.selo;
  const cy = LAYOUT.fotos.y;
  circulo(ctx, CENTRO_X + sombra, cy + sombra, raio, COR.tinta);
  circulo(ctx, CENTRO_X, cy, raio, COR.amarelo);
  ctx.lineWidth = 8;
  ctx.strokeStyle = COR.tinta;
  ctx.stroke();
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, 96);
  ctx.fillText("≈", CENTRO_X, cy + 6);
}

function desenharNota(ctx: Ctx, nota: number) {
  const { y, tamanho, contorno, sombra } = LAYOUT.nota;
  const texto = `${nota}%`;
  ctx.font = fonte(900, tamanho);
  ctx.lineJoin = "round";
  ctx.lineWidth = contorno;
  ctx.strokeStyle = COR.tinta;
  ctx.fillStyle = COR.tinta;
  ctx.strokeText(texto, CENTRO_X + sombra, y + sombra);
  ctx.fillText(texto, CENTRO_X + sombra, y + sombra);
  ctx.strokeText(texto, CENTRO_X, y);
  ctx.fillStyle = COR.laranja;
  ctx.fillText(texto, CENTRO_X, y);
}

function desenharLegenda(ctx: Ctx) {
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(800, LAYOUT.legenda.tamanho);
  ctx.fillText("PARECIDOS", CENTRO_X, LAYOUT.legenda.y);
}

/** Desenha o título e devolve o y onde a frase deve começar. */
function desenharTitulo(ctx: Ctx, titulo: string): number {
  const t = LAYOUT.titulo;
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, t.tamanho);
  const linhas = quebrarTexto(ctx, titulo, t.largura).slice(0, t.maxLinhas);
  return escreverLinhas(ctx, linhas, CENTRO_X, t.y, t.alturaLinha);
}

function alturaDoTitulo(ctx: Ctx, titulo: string): number {
  const t = LAYOUT.titulo;
  ctx.font = fonte(900, t.tamanho);
  return t.y + quebrarTexto(ctx, titulo, t.largura).slice(0, t.maxLinhas).length * t.alturaLinha;
}

function desenharFrase(ctx: Ctx, frase: string, yInicial: number) {
  const f = LAYOUT.frase;
  ctx.fillStyle = COR.tintaSuave;
  ctx.font = fonte(600, f.tamanho);
  const linhas = quebrarTexto(ctx, `“${frase}”`, f.largura).slice(0, f.maxLinhas);
  escreverLinhas(ctx, linhas, CENTRO_X, yInicial + f.espaco, f.alturaLinha);
}

function desenharRodape(ctx: Ctx, dominio: string) {
  const r = LAYOUT.rodape;
  retanguloArredondado(ctx, r.x, r.y, r.largura, r.altura, r.altura / 2, COR.tinta);
  const texto = `Descubra o seu em ${dominio}`;
  ajustarFonte(ctx, texto, { peso: 800, max: r.tamanhoMax, min: r.tamanhoMin, largura: r.larguraTexto });
  ctx.fillStyle = COR.branco;
  ctx.fillText(texto, CENTRO_X, r.y + r.altura / 2 + 2);
}

/** Desenha a cena inteira de acordo com o progresso de cada elemento. */
export function desenharCena(
  ctx: Ctx,
  dados: DadosCena,
  imagens: ImagensCena,
  dominio: string,
  a: Animacao = CENA_COMPLETA,
) {
  const { fotos, etiquetas, nota } = LAYOUT;
  desenharFundo(ctx);
  comEfeito(ctx, a.marca, CENTRO_X, LAYOUT.marca.y, 1, () => desenharMarca(ctx));

  // Fotos entram pelas laterais.
  if (a.fotos > 0) {
    const deslocamento = (1 - a.fotos) * 700;
    comEfeito(ctx, a.fotos, 0, 0, 1, () => {
      ctx.translate(-deslocamento, 0);
      desenharFoto(ctx, imagens.pessoa, fotos.xPessoa);
      ctx.translate(deslocamento * 2, 0);
      desenharFoto(ctx, imagens.bicho, fotos.xCachorro);
    });
  }
  comEfeito(ctx, a.etiquetas, CENTRO_X, etiquetas.y, 1, () => {
    desenharEtiqueta(ctx, "EU", fotos.xPessoa, COR.verde);
    desenharEtiqueta(ctx, dados.somDoAnimal, fotos.xCachorro, COR.laranja);
  });
  comEfeito(ctx, Math.min(1, a.selo), CENTRO_X, fotos.y, a.selo, () => desenharSelo(ctx));

  // A nota "conta" de 0 até o valor final.
  comEfeito(ctx, Math.min(1, a.nota * 3), CENTRO_X, nota.y, 1, () =>
    desenharNota(ctx, Math.round(dados.nota * Math.min(1, a.nota))),
  );
  comEfeito(ctx, a.legenda, CENTRO_X, LAYOUT.legenda.y, 1, () => desenharLegenda(ctx));

  const yFrase = alturaDoTitulo(ctx, dados.titulo);
  comEfeito(ctx, Math.min(1, a.titulo), CENTRO_X, LAYOUT.titulo.y, a.titulo, () =>
    desenharTitulo(ctx, dados.titulo),
  );
  if (dados.fraseCard)
    comEfeito(ctx, a.frase, CENTRO_X, yFrase, 1, () => desenharFrase(ctx, dados.fraseCard, yFrase));
  comEfeito(ctx, a.rodape, CENTRO_X, LAYOUT.rodape.y, 1, () => desenharRodape(ctx, dominio));

  // O selo "carimba" por cima de tudo, por isso vem por último.
  if (!dados.ehCachorro) {
    comEfeito(ctx, Math.min(1, a.plotTwist), CENTRO_X, LAYOUT.plotTwist.y, a.plotTwist, () =>
      desenharSeloPlotTwist(ctx, dados.especie),
    );
  }
}

export async function carregarImagensCena(fotoPessoa: string, fotoBicho: string): Promise<ImagensCena> {
  const [pessoa, bicho] = await Promise.all([carregarImagem(fotoPessoa), carregarImagem(fotoBicho)]);
  return { pessoa, bicho };
}

export async function gerarCard(
  resultado: DadosCena,
  fotoPessoa: string,
  fotoCachorro: string,
  dominio: string,
): Promise<Blob> {
  const imagens = await carregarImagensCena(fotoPessoa, fotoCachorro);
  const { canvas, ctx } = criarCanvas(LARGURA_CENA, ALTURA_CENA);
  desenharCena(ctx, resultado, imagens, dominio);
  return canvasParaBlob(canvas);
}
