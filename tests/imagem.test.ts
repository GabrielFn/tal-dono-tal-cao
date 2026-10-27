import { describe, expect, it } from "vitest";
import { dimensoesReduzidas, ehHeic, pareceImagem } from "@/lib/cliente/imagem";

const arquivo = (name: string, type: string) => ({ name, type });

describe("ehHeic", () => {
  it("reconhece HEIC/HEIF pelo tipo ou pela extensão", () => {
    expect(ehHeic(arquivo("IMG_0001.HEIC", ""))).toBe(true);
    expect(ehHeic(arquivo("foto", "image/heic"))).toBe(true);
    expect(ehHeic(arquivo("foto", "image/heif"))).toBe(true);
    expect(ehHeic(arquivo("foto.heif", "application/octet-stream"))).toBe(true);
    expect(ehHeic(arquivo("foto", "image/heic-sequence"))).toBe(true);
  });

  it("não confunde com JPEG/PNG", () => {
    expect(ehHeic(arquivo("foto.jpg", "image/jpeg"))).toBe(false);
    expect(ehHeic(arquivo("heic.png", "image/png"))).toBe(false);
  });
});

describe("pareceImagem", () => {
  it("aceita pelo tipo ou, quando o celular não manda tipo, pela extensão", () => {
    expect(pareceImagem(arquivo("x", "image/jpeg"))).toBe(true);
    expect(pareceImagem(arquivo("IMG_0001.HEIC", ""))).toBe(true);
    expect(pareceImagem(arquivo("foto.webp", ""))).toBe(true);
  });

  it("recusa o que claramente não é imagem", () => {
    expect(pareceImagem(arquivo("contrato.pdf", "application/pdf"))).toBe(false);
    expect(pareceImagem(arquivo("video.mp4", "video/mp4"))).toBe(false);
  });
});

describe("dimensoesReduzidas", () => {
  it("reduz foto de celular (12 MP, retrato) mantendo a proporção", () => {
    expect(dimensoesReduzidas(3024, 4032, 896)).toEqual({ largura: 672, altura: 896 });
  });

  it("reduz paisagem pelo lado maior", () => {
    expect(dimensoesReduzidas(4000, 2000, 896)).toEqual({ largura: 896, altura: 448 });
  });

  it("não amplia fotos pequenas", () => {
    expect(dimensoesReduzidas(400, 300, 896)).toEqual({ largura: 400, altura: 300 });
  });
});
