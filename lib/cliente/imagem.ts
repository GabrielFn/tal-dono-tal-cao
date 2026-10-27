// Roda no navegador: abre a foto (inclusive HEIC do celular), reduz e devolve um JPEG leve para enviar.

export const MENSAGENS_FOTO = {
  naoEImagem: "Esse arquivo não é uma imagem. Escolha uma foto.",
  naoAbriu: "Não conseguimos abrir essa foto. Tenta tirar um print dela e enviar o print.",
} as const;

const PADRAO_HEIC_TIPO = /^image\/hei[cf](-sequence)?$/i;
const PADRAO_HEIC_NOME = /\.(heic|heif)$/i;
const PADRAO_IMAGEM_NOME = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

/** HEIC/HEIF é o formato padrão do iPhone e de vários Android; o Chrome não abre. */
export function ehHeic(arquivo: Pick<File, "type" | "name">): boolean {
  return PADRAO_HEIC_TIPO.test(arquivo.type) || PADRAO_HEIC_NOME.test(arquivo.name);
}

/** Alguns celulares mandam a foto sem tipo (type = ""), então o nome também conta. */
export function pareceImagem(arquivo: Pick<File, "type" | "name">): boolean {
  return arquivo.type.startsWith("image/") || PADRAO_IMAGEM_NOME.test(arquivo.name) || ehHeic(arquivo);
}

/** Calcula o tamanho final mantendo a proporção, com o maior lado limitado a `lado`. */
export function dimensoesReduzidas(largura: number, altura: number, lado: number) {
  const escala = Math.min(1, lado / Math.max(largura, altura));
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

type FonteDecodificada = {
  desenhavel: CanvasImageSource;
  largura: number;
  altura: number;
  liberar: () => void;
};

function carregarViaElemento(blob: Blob): Promise<FonteDecodificada> {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      ok({ desenhavel: img, largura: img.naturalWidth, altura: img.naturalHeight, liberar: () => {} });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      falha(new Error("O navegador não conseguiu decodificar a imagem"));
    };
    img.src = url;
  });
}

/**
 * Tenta createImageBitmap (rápido e já corrige a rotação da câmera) e, se falhar,
 * o <img> clássico. Evita img.decode(), que falha à toa no Safari com fotos grandes.
 */
async function decodificar(blob: Blob): Promise<FonteDecodificada> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return {
        desenhavel: bitmap,
        largura: bitmap.width,
        altura: bitmap.height,
        liberar: () => bitmap.close(),
      };
    } catch {
      // segue para o <img>
    }
  }
  return carregarViaElemento(blob);
}

/** Converte HEIC para JPEG. A biblioteca (~1 MB) só é baixada quando realmente precisa. */
async function converterHeicParaJpeg(arquivo: Blob): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const convertido = await heic2any({ blob: arquivo, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(convertido) ? convertido[0] : convertido;
}

async function abrirFoto(arquivo: File): Promise<FonteDecodificada> {
  // Primeiro tenta direto: o Safari abre HEIC sozinho, então lá a conversão nem acontece.
  // Se falhar e for HEIC (caso do Chrome e do Android), converte para JPEG e tenta de novo.
  try {
    return await decodificar(arquivo);
  } catch (erroDireto) {
    // Também tenta a conversão em arquivos sem tipo, pois podem ser HEIC sem extensão.
    if (!ehHeic(arquivo) && arquivo.type !== "") throw erroDireto;
    return decodificar(await converterHeicParaJpeg(arquivo));
  }
}

/** Abre a foto, reduz para no máximo `lado` px no maior lado e devolve um data URL JPEG. */
export async function comprimirFoto(arquivo: File, lado = 896, qualidade = 0.85): Promise<string> {
  if (!pareceImagem(arquivo)) throw new Error(MENSAGENS_FOTO.naoEImagem);

  let fonte: FonteDecodificada;
  try {
    fonte = await abrirFoto(arquivo);
  } catch (erro) {
    console.warn("[foto] Falha ao abrir", { tipo: arquivo.type, nome: arquivo.name, erro });
    throw new Error(MENSAGENS_FOTO.naoAbriu);
  }

  try {
    const { largura, altura } = dimensoesReduzidas(fonte.largura, fonte.altura, lado);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(MENSAGENS_FOTO.naoAbriu);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(fonte.desenhavel, 0, 0, largura, altura);
    return canvas.toDataURL("image/jpeg", qualidade);
  } finally {
    fonte.liberar();
  }
}
