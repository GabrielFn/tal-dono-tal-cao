import { describe, expect, it } from "vitest";
import { dadosEstruturados, DESCRICAO_SEO, PERGUNTAS_FREQUENTES, TITULO_SEO } from "@/lib/conteudo/seo";

describe("SEO", () => {
  it("título e descrição cabem no resultado do Google", () => {
    expect(TITULO_SEO.length).toBeLessThanOrEqual(70);
    expect(DESCRICAO_SEO.length).toBeLessThanOrEqual(160);
  });

  it("título contém o nome do site e as palavras que as pessoas buscam", () => {
    expect(TITULO_SEO).toContain("Tal Dono, Tal Pet");
    expect(TITULO_SEO).toMatch(/cachorro/);
    expect(TITULO_SEO).toMatch(/gato/);
  });

  it("JSON-LD de FAQ espelha exatamente as perguntas visíveis na página", () => {
    const [app, faq] = dadosEstruturados("https://exemplo.com");
    expect(app).toMatchObject({ "@type": "WebApplication", url: "https://exemplo.com", inLanguage: "pt-BR" });
    expect(faq["@type"]).toBe("FAQPage");
    const perguntas = (faq as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] })
      .mainEntity;
    expect(perguntas.map((p) => p.name)).toEqual(PERGUNTAS_FREQUENTES.map((p) => p.pergunta));
    expect(perguntas.map((p) => p.acceptedAnswer.text)).toEqual(PERGUNTAS_FREQUENTES.map((p) => p.resposta));
  });
});
