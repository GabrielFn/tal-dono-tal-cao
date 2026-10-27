// Roda no navegador: reduz a foto antes de enviar (mais rápido e mais barato na API).

export async function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // A imagem decodificada continua utilizável depois de liberar a URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Redimensiona para no máximo `lado` px no maior lado e devolve um data URL JPEG. */
export async function comprimirFoto(arquivo: File, lado = 896, qualidade = 0.85): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Esse arquivo não é uma imagem.");
  let img: HTMLImageElement;
  try {
    img = await carregarImagem(arquivo);
  } catch {
    throw new Error("Não conseguimos abrir essa foto. Tenta outra (JPG ou PNG).");
  }
  const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * escala));
  const h = Math.max(1, Math.round(img.naturalHeight * escala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", qualidade);
}
