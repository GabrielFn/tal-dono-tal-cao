// Desenha o card 1080x1920 (formato Stories/TikTok) no navegador.
import type { ResultadoValido } from "@/lib/tipos";

const LARGURA = 1080;
const ALTURA = 1920;
const CENTRO_X = LARGURA / 2;
const FONTE = `"Arial Rounded MT Bold", "Nunito", ui-rounded, "Segoe UI", system-ui, sans-serif`;

const COR = {
  fundo: "#FFF3E0",
  tinta: "#2A1A10",
  tintaSuave: "rgba(42,26,16,0.8)",
  bolinhas: "rgba(42,26,16,0.06)",
  laranja: "#FF6B2C",
  verde: "#17A398",
  amarelo: "#FFC93C",
  branco: "#FFFFFF",
} as const;

/** Posições de cada elemento. Mude aqui para reorganizar o card. */
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

type Ctx = CanvasRenderingContext2D;

function fonte(peso: number, tamanho: number): string {
  return `${peso} ${tamanho}px ${FONTE}`;
}

function quebrarTexto(ctx: Ctx, texto: string, largura: number): string[] {
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

function circulo(ctx: Ctx, x: number, y: number, raio: number, cor: string) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);
  ctx.fill();
}

async function carregarImagem(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function desenharFundo(ctx: Ctx) {
  const { espaco, raio } = LAYOUT.bolinhas;
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  for (let y = espaco / 2, linha = 0; y < ALTURA; y += espaco, linha++) {
    const deslocamento = linha % 2 ? espaco / 2 : espaco;
    for (let x = deslocamento; x < LARGURA; x += espaco) circulo(ctx, x, y, raio, COR.bolinhas);
  }
}

function desenharMarca(ctx: Ctx) {
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, LAYOUT.marca.tamanho);
  ctx.fillText("TAL DONO, TAL CÃO", CENTRO_X, LAYOUT.marca.y);
}

function desenharFotoCircular(ctx: Ctx, img: HTMLImageElement, cx: number) {
  const { y: cy, raio, borda, sombra } = LAYOUT.fotos;
  circulo(ctx, cx + sombra, cy + sombra, raio + borda, COR.tinta);
  circulo(ctx, cx, cy, raio + borda, COR.tinta);

  // Recorte quadrado central (object-fit: cover), levemente para cima, onde costumam ficar os rostos.
  const lado = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - lado) / 2;
  const sy = Math.max(0, (img.naturalHeight - lado) / 2.6);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, lado, lado, cx - raio, cy - raio, raio * 2, raio * 2);
  ctx.restore();
}

function desenharEtiqueta(ctx: Ctx, texto: string, cx: number, cor: string) {
  const { y: cy, tamanho, altura } = LAYOUT.etiquetas;
  ctx.font = fonte(800, tamanho);
  const largura = ctx.measureText(texto).width + 60;
  const x = cx - largura / 2;
  const y = cy - altura / 2;

  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, largura, altura, altura / 2);
  ctx.fill();

  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, altura / 2);
  ctx.fill();
  ctx.strokeStyle = COR.tinta;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = COR.branco;
  ctx.fillText(texto, cx, cy + 2);
}

/** Selo inclinado "PLOT TWIST: É UM GATO!" quando o bicho não é cachorro. */
function desenharSeloPlotTwist(ctx: Ctx, especie: string) {
  const p = LAYOUT.plotTwist;
  const texto = `PLOT TWIST: É ${especie.toLocaleUpperCase("pt-BR")}!`;

  let tamanho: number = p.tamanhoMax;
  ctx.font = fonte(900, tamanho);
  while (ctx.measureText(texto).width > p.larguraMax - 60 && tamanho > p.tamanhoMin) {
    tamanho -= 2;
    ctx.font = fonte(900, tamanho);
  }
  const largura = ctx.measureText(texto).width + 60;

  ctx.save();
  ctx.translate(CENTRO_X, p.y);
  ctx.rotate(p.rotacao);
  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  ctx.roundRect(-largura / 2 + 7, -p.altura / 2 + 7, largura, p.altura, 14);
  ctx.fill();
  ctx.fillStyle = COR.amarelo;
  ctx.beginPath();
  ctx.roundRect(-largura / 2, -p.altura / 2, largura, p.altura, 14);
  ctx.fill();
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

  // Sombra deslocada
  ctx.fillStyle = COR.tinta;
  ctx.strokeText(texto, CENTRO_X + sombra, y + sombra);
  ctx.fillText(texto, CENTRO_X + sombra, y + sombra);
  // Número principal
  ctx.strokeText(texto, CENTRO_X, y);
  ctx.fillStyle = COR.laranja;
  ctx.fillText(texto, CENTRO_X, y);

  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(800, LAYOUT.legenda.tamanho);
  ctx.fillText("PARECIDOS", CENTRO_X, LAYOUT.legenda.y);
}

/** Escreve linhas centralizadas e devolve o y depois da última linha. */
function escreverLinhas(ctx: Ctx, linhas: string[], yInicial: number, alturaLinha: number): number {
  let y = yInicial;
  for (const linha of linhas) {
    ctx.fillText(linha, CENTRO_X, y);
    y += alturaLinha;
  }
  return y;
}

function desenharTextos(ctx: Ctx, titulo: string, frase: string) {
  const t = LAYOUT.titulo;
  ctx.fillStyle = COR.tinta;
  ctx.font = fonte(900, t.tamanho);
  const yDepoisDoTitulo = escreverLinhas(
    ctx,
    quebrarTexto(ctx, titulo, t.largura).slice(0, t.maxLinhas),
    t.y,
    t.alturaLinha,
  );

  if (!frase) return;
  const f = LAYOUT.frase;
  ctx.fillStyle = COR.tintaSuave;
  ctx.font = fonte(600, f.tamanho);
  escreverLinhas(
    ctx,
    quebrarTexto(ctx, `“${frase}”`, f.largura).slice(0, f.maxLinhas),
    yDepoisDoTitulo + f.espaco,
    f.alturaLinha,
  );
}

function desenharRodape(ctx: Ctx, dominio: string) {
  const r = LAYOUT.rodape;
  ctx.fillStyle = COR.tinta;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.largura, r.altura, r.altura / 2);
  ctx.fill();

  const texto = `Descubra o seu em ${dominio}`;
  let tamanho: number = r.tamanhoMax;
  ctx.font = fonte(800, tamanho);
  while (ctx.measureText(texto).width > r.larguraTexto && tamanho > r.tamanhoMin) {
    tamanho -= 2;
    ctx.font = fonte(800, tamanho);
  }
  ctx.fillStyle = COR.branco;
  ctx.fillText(texto, CENTRO_X, r.y + r.altura / 2 + 2);
}

export async function gerarCard(
  resultado: ResultadoValido,
  fotoPessoa: string,
  fotoCachorro: string,
  dominio: string,
): Promise<Blob> {
  const [imgPessoa, imgCachorro] = await Promise.all([
    carregarImagem(fotoPessoa),
    carregarImagem(fotoCachorro),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  desenharFundo(ctx);
  desenharMarca(ctx);
  desenharFotoCircular(ctx, imgPessoa, LAYOUT.fotos.xPessoa);
  desenharFotoCircular(ctx, imgCachorro, LAYOUT.fotos.xCachorro);
  desenharEtiqueta(ctx, "EU", LAYOUT.fotos.xPessoa, COR.verde);
  desenharEtiqueta(ctx, resultado.somDoAnimal, LAYOUT.fotos.xCachorro, COR.laranja);
  if (!resultado.ehCachorro) desenharSeloPlotTwist(ctx, resultado.especie);
  desenharSelo(ctx);
  desenharNota(ctx, resultado.nota);
  desenharTextos(ctx, resultado.titulo, resultado.fraseCard);
  desenharRodape(ctx, dominio);

  return new Promise((ok, falha) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : falha(new Error("Falha ao gerar o card"))), "image/png"),
  );
}
