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
  fotos: { y: 560, raio: 220, xPessoa: 300, xPet: 780, borda: 10, sombra: 14 },
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
  "nota" | "titulo" | "fraseCard" | "somDoAnimal" | "inusitado" | "especie" | "halloween"
>;

/** Cores que mudam com o tema sazonal. */
type Paleta = {
  fundo: string;
  bolinhas: string;
  texto: string;
  textoSuave: string;
  bordaFoto: string;
  rodapeFundo: string;
  rodapeTexto: string;
};

const PALETA_NORMAL: Paleta = {
  fundo: COR.fundo,
  bolinhas: COR.bolinhas,
  texto: COR.tinta,
  textoSuave: COR.tintaSuave,
  bordaFoto: COR.tinta,
  rodapeFundo: COR.tinta,
  rodapeTexto: COR.branco,
};

const PALETA_HALLOWEEN: Paleta = {
  fundo: "#24123A",
  bolinhas: "rgba(255,107,44,0.16)",
  texto: COR.fundo,
  textoSuave: "rgba(255,243,224,0.88)",
  bordaFoto: COR.laranja,
  rodapeFundo: COR.laranja,
  rodapeTexto: COR.tinta,
};

/** Morcegos e abóboras da edição de Halloween: [x, y, escala]. */
const DECORACAO_HALLOWEEN = {
  morcegos: [
    [110, 80, 1],
    [985, 100, 0.8],
    [150, 1300, 0.7],
    [935, 1280, 0.9],
  ],
  aboboras: [
    [105, 1110, 1],
    [975, 1120, 0.85],
  ],
} as const;

/** Texto do selo inclinado no topo: plot twist (bicho inusitado) ou gato preto no Halloween. */
export function textoDoSelo(dados: DadosCena): string | null {
  if (dados.inusitado) return `PLOT TWIST: É ${dados.especie.toLocaleUpperCase("pt-BR")}!`;
  if (dados.halloween?.gatoPreto) return "GATO PRETO OFICIAL DO HALLOWEEN";
  return null;
}

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

function desenharFundo(ctx: Ctx, paleta: Paleta) {
  const { espaco, raio } = LAYOUT.bolinhas;
  ctx.fillStyle = paleta.fundo;
  ctx.fillRect(0, 0, LARGURA_CENA, ALTURA_CENA);
  for (let y = espaco / 2, linha = 0; y < ALTURA_CENA; y += espaco, linha++) {
    const deslocamento = linha % 2 ? espaco / 2 : espaco;
    for (let x = deslocamento; x < LARGURA_CENA; x += espaco) circulo(ctx, x, y, raio, paleta.bolinhas);
  }
}

function desenharMorcego(ctx: Ctx, x: number, y: number, escala: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = "#0E0716";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  // Asa direita com a borda de baixo recortada.
  ctx.quadraticCurveTo(30, -40, 78, -22);
  ctx.quadraticCurveTo(66, -6, 70, 12);
  ctx.quadraticCurveTo(54, 2, 44, 16);
  ctx.quadraticCurveTo(32, 4, 18, 20);
  ctx.quadraticCurveTo(10, 12, 0, 22);
  // Asa esquerda (espelhada).
  ctx.quadraticCurveTo(-10, 12, -18, 20);
  ctx.quadraticCurveTo(-32, 4, -44, 16);
  ctx.quadraticCurveTo(-54, 2, -70, 12);
  ctx.quadraticCurveTo(-66, -6, -78, -22);
  ctx.quadraticCurveTo(-30, -40, 0, -14);
  ctx.fill();
  // Orelhas.
  ctx.beginPath();
  ctx.moveTo(-9, -12);
  ctx.lineTo(-6, -30);
  ctx.lineTo(0, -16);
  ctx.lineTo(6, -30);
  ctx.lineTo(9, -12);
  ctx.fill();
  ctx.restore();
}

function desenharAbobora(ctx: Ctx, x: number, y: number, escala: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = "#3C7A2E";
  ctx.fillRect(-6, -60, 12, 22);
  for (const [dx, largura] of [
    [-26, 34],
    [26, 34],
    [0, 36],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(dx, 0, largura, 44, 0, 0, Math.PI * 2);
    ctx.fillStyle = COR.laranja;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = COR.tinta;
    ctx.stroke();
  }
  // Rosto.
  ctx.fillStyle = COR.tinta;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 22, -16);
    ctx.lineTo(lado * 10, 0);
    ctx.lineTo(lado * 34, 0);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-28, 14);
  ctx.quadraticCurveTo(0, 36, 28, 14);
  ctx.quadraticCurveTo(0, 24, -28, 14);
  ctx.fill();
  ctx.restore();
}

function desenharDecoracaoHalloween(ctx: Ctx) {
  // Lua atrás de um dos morcegos, para ele aparecer no fundo escuro.
  circulo(ctx, 985, 95, 62, "#FFE7A3");
  for (const [x, y, e] of DECORACAO_HALLOWEEN.morcegos) desenharMorcego(ctx, x, y, e);
  for (const [x, y, e] of DECORACAO_HALLOWEEN.aboboras) desenharAbobora(ctx, x, y, e);
}

function desenharMarca(ctx: Ctx, paleta: Paleta, halloween: boolean) {
  ctx.fillStyle = paleta.texto;
  ctx.font = fonte(900, LAYOUT.marca.tamanho);
  ctx.fillText(halloween ? "TAL DONO, TAL MONSTRO" : "TAL DONO, TAL PET", CENTRO_X, LAYOUT.marca.y);
}

function desenharFoto(ctx: Ctx, img: HTMLImageElement, cx: number, paleta: Paleta) {
  const { y: cy, raio, borda, sombra } = LAYOUT.fotos;
  circulo(ctx, cx + sombra, cy + sombra, raio + borda, COR.tinta);
  circulo(ctx, cx, cy, raio + borda, paleta.bordaFoto);
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

/** Selo inclinado no topo (ver textoDoSelo). */
function desenharSeloTopo(ctx: Ctx, texto: string) {
  const p = LAYOUT.plotTwist;
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

function desenharLegenda(ctx: Ctx, paleta: Paleta) {
  ctx.fillStyle = paleta.texto;
  ctx.font = fonte(800, LAYOUT.legenda.tamanho);
  ctx.fillText("PARECIDOS", CENTRO_X, LAYOUT.legenda.y);
}

type LayoutTitulo = { linhas: string[]; tamanho: number; alturaLinha: number };

/**
 * Quebra o título em linhas. `compacto` (Halloween) tenta caber numa linha só, diminuindo a fonte,
 * para sobrar espaço para a fantasia de dupla. Deixa a fonte aplicada no ctx.
 */
function medirTitulo(ctx: Ctx, titulo: string, compacto: boolean): LayoutTitulo {
  const t = LAYOUT.titulo;
  const tamanho = compacto
    ? ajustarFonte(ctx, titulo, { peso: 900, max: t.tamanho, min: 54, largura: t.largura })
    : t.tamanho;
  ctx.font = fonte(900, tamanho);
  const linhas = quebrarTexto(ctx, titulo, t.largura).slice(0, t.maxLinhas);
  return { linhas, tamanho, alturaLinha: Math.round((t.alturaLinha * tamanho) / t.tamanho) };
}

/** Desenha o título já medido. */
function desenharTitulo(ctx: Ctx, layout: LayoutTitulo, paleta: Paleta) {
  ctx.fillStyle = paleta.texto;
  ctx.font = fonte(900, layout.tamanho);
  escreverLinhas(ctx, layout.linhas, CENTRO_X, LAYOUT.titulo.y, layout.alturaLinha);
}

/** Frase abaixo do título. Usa só as linhas que cabem antes do rodapé e põe "…" se cortar. */
function desenharFrase(ctx: Ctx, texto: string, yInicial: number, paleta: Paleta, compacta = false) {
  const f = LAYOUT.frase;
  const tamanho = compacta ? f.tamanho - 6 : f.tamanho;
  const alturaLinha = compacta ? f.alturaLinha - 8 : f.alturaLinha;
  const y = yInicial + f.espaco;
  const cabem = Math.floor((LAYOUT.rodape.y - 24 - y) / alturaLinha);
  const maxLinhas = Math.max(1, Math.min(compacta ? 3 : f.maxLinhas, cabem));
  ctx.fillStyle = paleta.textoSuave;
  ctx.font = fonte(600, tamanho);
  const todas = quebrarTexto(ctx, texto, f.largura);
  const linhas = todas.slice(0, maxLinhas);
  if (todas.length > maxLinhas)
    linhas[maxLinhas - 1] = `${linhas[maxLinhas - 1].replace(/[\s.,;:!?]+$/, "")}…`;
  escreverLinhas(ctx, linhas, CENTRO_X, y, alturaLinha);
}

function desenharRodape(ctx: Ctx, dominio: string, paleta: Paleta) {
  const r = LAYOUT.rodape;
  retanguloArredondado(ctx, r.x, r.y, r.largura, r.altura, r.altura / 2, paleta.rodapeFundo);
  const texto = `Descubra o seu em ${dominio}`;
  ajustarFonte(ctx, texto, { peso: 800, max: r.tamanhoMax, min: r.tamanhoMin, largura: r.larguraTexto });
  ctx.fillStyle = paleta.rodapeTexto;
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
  const halloween = Boolean(dados.halloween);
  const paleta = halloween ? PALETA_HALLOWEEN : PALETA_NORMAL;
  desenharFundo(ctx, paleta);
  if (halloween) desenharDecoracaoHalloween(ctx);
  comEfeito(ctx, a.marca, CENTRO_X, LAYOUT.marca.y, 1, () => desenharMarca(ctx, paleta, halloween));

  // Fotos entram pelas laterais.
  if (a.fotos > 0) {
    const deslocamento = (1 - a.fotos) * 700;
    comEfeito(ctx, a.fotos, 0, 0, 1, () => {
      ctx.translate(-deslocamento, 0);
      desenharFoto(ctx, imagens.pessoa, fotos.xPessoa, paleta);
      ctx.translate(deslocamento * 2, 0);
      desenharFoto(ctx, imagens.bicho, fotos.xPet, paleta);
    });
  }
  comEfeito(ctx, a.etiquetas, CENTRO_X, etiquetas.y, 1, () => {
    desenharEtiqueta(ctx, "EU", fotos.xPessoa, COR.verde);
    desenharEtiqueta(ctx, dados.somDoAnimal, fotos.xPet, COR.laranja);
  });
  comEfeito(ctx, Math.min(1, a.selo), CENTRO_X, fotos.y, a.selo, () => desenharSelo(ctx));

  // A nota "conta" de 0 até o valor final.
  comEfeito(ctx, Math.min(1, a.nota * 3), CENTRO_X, nota.y, 1, () =>
    desenharNota(ctx, Math.round(dados.nota * Math.min(1, a.nota))),
  );
  comEfeito(ctx, a.legenda, CENTRO_X, LAYOUT.legenda.y, 1, () => desenharLegenda(ctx, paleta));

  const titulo = medirTitulo(ctx, dados.titulo, halloween);
  const yFrase = LAYOUT.titulo.y + titulo.linhas.length * titulo.alturaLinha;
  comEfeito(ctx, Math.min(1, a.titulo), CENTRO_X, LAYOUT.titulo.y, a.titulo, () =>
    desenharTitulo(ctx, titulo, paleta),
  );
  // No Halloween, a fantasia sugerida ocupa o lugar da frase.
  const frase = dados.halloween
    ? `Fantasia da dupla: ${dados.halloween.fantasia}`
    : dados.fraseCard && `“${dados.fraseCard}”`;
  if (frase)
    comEfeito(ctx, a.frase, CENTRO_X, yFrase, 1, () => desenharFrase(ctx, frase, yFrase, paleta, halloween));
  comEfeito(ctx, a.rodape, CENTRO_X, LAYOUT.rodape.y, 1, () => desenharRodape(ctx, dominio, paleta));

  // O selo "carimba" por cima de tudo, por isso vem por último.
  const selo = textoDoSelo(dados);
  if (selo) {
    comEfeito(ctx, Math.min(1, a.plotTwist), CENTRO_X, LAYOUT.plotTwist.y, a.plotTwist, () =>
      desenharSeloTopo(ctx, selo),
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
  fotoPet: string,
  dominio: string,
): Promise<Blob> {
  const imagens = await carregarImagensCena(fotoPessoa, fotoPet);
  const { canvas, ctx } = criarCanvas(LARGURA_CENA, ALTURA_CENA);
  desenharCena(ctx, resultado, imagens, dominio);
  return canvasParaBlob(canvas);
}
