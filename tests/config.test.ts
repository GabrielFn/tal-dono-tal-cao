import { describe, expect, it } from "vitest";
import { resolverSiteUrl } from "@/lib/config/publico";

describe("resolverSiteUrl", () => {
  it("usa o endereço novo por padrão", () => {
    expect(resolverSiteUrl(undefined)).toBe("https://tal-dono-tal-pet.vercel.app");
  });

  it("NEXT_PUBLIC_SITE_URL tem prioridade, ganha https se faltar e perde a barra final", () => {
    expect(resolverSiteUrl("https://taldonotalpet.com.br/")).toBe("https://taldonotalpet.com.br");
    expect(resolverSiteUrl("taldonotalpet.com.br")).toBe("https://taldonotalpet.com.br");
  });

  it("ignora valores vazios ou inválidos", () => {
    expect(resolverSiteUrl("   ")).toBe("https://tal-dono-tal-pet.vercel.app");
    expect(resolverSiteUrl("https://")).toBe("https://tal-dono-tal-pet.vercel.app");
  });

  it("nunca usa o domínio antigo, mesmo se a variável estiver com ele", () => {
    expect(resolverSiteUrl("https://tal-dono-tal-cao.vercel.app")).toBe(
      "https://tal-dono-tal-pet.vercel.app",
    );
    expect(resolverSiteUrl("tal-dono-tal-cao.vercel.app/")).toBe("https://tal-dono-tal-pet.vercel.app");
  });
});
