import { describe, expect, it } from "vitest";
import { lerImagemDataUrl, obterIp, TAMANHO_MAXIMO_BYTES } from "@/lib/analise/validacao";
import { dataUrlFalso } from "./auxiliares";

describe("lerImagemDataUrl", () => {
  it("aceita JPEG, PNG e WEBP", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      expect(lerImagemDataUrl(dataUrlFalso(5_000, tipo))?.tipo).toBe(tipo);
    }
  });

  it("recusa outros tipos, textos e valores que não são string", () => {
    expect(lerImagemDataUrl(dataUrlFalso(5_000, "image/gif"))).toBeNull();
    expect(lerImagemDataUrl("data:text/plain;base64,AAAA")).toBeNull();
    expect(lerImagemDataUrl("não é imagem")).toBeNull();
    expect(lerImagemDataUrl(123)).toBeNull();
    expect(lerImagemDataUrl(undefined)).toBeNull();
  });

  it("recusa imagens pequenas demais ou grandes demais", () => {
    expect(lerImagemDataUrl(dataUrlFalso(500))).toBeNull();
    expect(lerImagemDataUrl(dataUrlFalso(TAMANHO_MAXIMO_BYTES + 10))).toBeNull();
    expect(lerImagemDataUrl(dataUrlFalso(TAMANHO_MAXIMO_BYTES - 10))).not.toBeNull();
  });
});

describe("obterIp", () => {
  it("usa o primeiro IP de x-forwarded-for", () => {
    expect(obterIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });
  it("cai para x-real-ip e depois para 'desconhecido'", () => {
    expect(obterIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(obterIp(new Headers())).toBe("desconhecido");
  });
});
