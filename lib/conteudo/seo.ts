// Conteúdo usado tanto na página (visível) quanto nos dados estruturados (JSON-LD) para o Google.
// Uma fonte só: o Google penaliza dados estruturados que não batem com o que aparece na tela.

export const NOME_DO_SITE = "Tal Dono, Tal Pet";

export const TITULO_SEO = "Tal Dono, Tal Pet: o quanto você se parece com seu cachorro ou gato?";

export const DESCRICAO_SEO =
  "Teste grátis com IA: mande uma selfie e uma foto do seu cachorro, gato ou outro pet e veja quantos % vocês são parecidos. Sem cadastro.";

export type PerguntaFrequente = { pergunta: string; resposta: string };

/** Perguntas escritas do jeito que as pessoas pesquisam no Google. */
export const PERGUNTAS_FREQUENTES: PerguntaFrequente[] = [
  {
    pergunta: "Como saber se eu pareço com meu cachorro?",
    resposta:
      "Envie uma selfie e uma foto do seu cachorro no Tal Dono, Tal Pet. A inteligência artificial compara olhar, cabelo e pelo, expressão, pose e vibe e dá uma nota de 0 a 100% de semelhança, com comentários bem-humorados.",
  },
  {
    pergunta: "Funciona com gato e outros animais?",
    resposta:
      "Sim. O teste funciona com cachorro, gato e qualquer outro pet. Calopsita, coelho, galinha ou iguana também valem e ganham um selo especial de plot twist.",
  },
  {
    pergunta: "O teste é grátis?",
    resposta:
      "Sim, o teste é grátis e não precisa de cadastro. Existe um pacote premium opcional, pago por Pix, com um certificado oficial de sósia e um vídeo animado do resultado.",
  },
  {
    pergunta: "Vocês guardam minhas fotos?",
    resposta:
      "Não. As fotos são reduzidas no seu celular, enviadas só para gerar o resultado e não ficam guardadas no nosso servidor. Os detalhes estão na política de privacidade.",
  },
  {
    pergunta: "É verdade que donos se parecem com seus cachorros?",
    resposta:
      "Há estudos que apontam isso. Uma pesquisa de 2013 publicada na revista Anthrozoös mostrou que as pessoas conseguem ligar cães aos donos pela região dos olhos. Por isso o olhar é uma das categorias do teste.",
  },
  {
    pergunta: "Posso compartilhar o resultado?",
    resposta:
      "Sim. O resultado vem com um card no formato dos Stories e do TikTok, pronto para compartilhar ou baixar.",
  },
];

/** Dados estruturados (schema.org) da página inicial. */
export function dadosEstruturados(siteUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: NOME_DO_SITE,
      url: siteUrl,
      description: DESCRICAO_SEO,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Qualquer (navegador)",
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS_FREQUENTES.map(({ pergunta, resposta }) => ({
        "@type": "Question",
        name: pergunta,
        acceptedAnswer: { "@type": "Answer", text: resposta },
      })),
    },
  ];
}
