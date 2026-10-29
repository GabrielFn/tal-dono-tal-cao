import App from "@/components/App";
import Rodape from "@/components/Rodape";
import { configPublica } from "@/lib/config/publico";
import { lerConfigServidor } from "@/lib/config/servidor";
import { dadosEstruturados, PERGUNTAS_FREQUENTES } from "@/lib/conteudo/seo";
import { temaAtual } from "@/lib/conteudo/temporada";

// Revalida a página a cada 10 min para o tema sazonal ligar e desligar sozinho na data.
export const revalidate = 600;

export default function Home() {
  // O preço vem do servidor (variável PRECO_PREMIUM_CENTAVOS) para não ficar duplicado.
  const { precoPremiumCentavos } = lerConfigServidor().pagamento;
  const tema = temaAtual();
  return (
    <main className="pagina">
      <script
        type="application/ld+json"
        // JSON gerado por nós a partir de constantes; o replace evita fechar a tag <script> por engano.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dadosEstruturados(configPublica.siteUrl)).replace(/</g, "\\u003c"),
        }}
      />
      <header className="cabecalho">
        {tema === "halloween" && (
          <p className="faixa-tema">🎃 Edição de Halloween: a IA sugere a fantasia da dupla</p>
        )}
        <p className="marca">Tal Dono, Tal Pet 🐾</p>
        <h1>
          O quanto você se parece com o <span className="destaque">seu pet?</span>
        </h1>
        <p className="subtitulo">Duas fotos, uma IA e a verdade que todo mundo já desconfiava.</p>
      </header>

      <App precoPremiumCentavos={precoPremiumCentavos} />

      <section className="como-funciona" aria-labelledby="como">
        <h2 id="como">Como funciona</h2>
        <ol>
          <li>
            <strong>Mande as fotos.</strong> Uma selfie sua e uma do seu pet: cachorro, gato ou o que você
            tiver aí.
          </li>
          <li>
            <strong>A inteligência artificial compara.</strong> Olhar, cabelo x pelo, expressão, pose e vibe
            viram uma nota de 0 a 100%.
          </li>
          <li>
            <strong>Compartilhe.</strong> Receba sua nota e um card pronto para os Stories e o TikTok.
          </li>
        </ol>
        <p className="ciencia">
          Tem até ciência: estudos de psicologia mostram que muita gente escolhe pets parecidos consigo,
          principalmente no olhar.
        </p>
      </section>

      <section className="perguntas" aria-labelledby="faq">
        <h2 id="faq">Perguntas frequentes</h2>
        {PERGUNTAS_FREQUENTES.map(({ pergunta, resposta }) => (
          <details key={pergunta}>
            <summary>
              <h3>{pergunta}</h3>
            </summary>
            <p>{resposta}</p>
          </details>
        ))}
      </section>

      <Rodape />
    </main>
  );
}
