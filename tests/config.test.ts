import { describe, expect, it } from "vitest";
import { resolverSiteUrl } from "@/lib/config/publico";

describe("resolverSiteUrl", () => {
  it("usa o endereço da Vercel por padrão", () => {
    expect(resolverSiteUrl(undefined, undefined)).toBe("https://tal-dono-tal-pet.vercel.app");
  });

  it("usa o domínio de produção informado pela Vercel (que vem sem https)", () => {
    expect(resolverSiteUrl(undefined, "meusite.vercel.app")).toBe("https://meusite.vercel.app");
  });

  it("NEXT_PUBLIC_SITE_URL tem prioridade e perde a barra final", () => {
    expect(resolverSiteUrl("https://taldonotalcao.com.br/", "x.vercel.app")).toBe(
      "https://taldonotalcao.com.br",
    );
  });

  it("ignora valores vazios ou inválidos", () => {
    expect(resolverSiteUrl("   ", undefined)).toBe("https://tal-dono-tal-pet.vercel.app");
    expect(resolverSiteUrl("https://", undefined)).toBe("https://tal-dono-tal-pet.vercel.app");
  });
});
