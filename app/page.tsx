import App from "@/components/App";
import Rodape from "@/components/Rodape";
import { lerConfigServidor } from "@/lib/config/servidor";

export default function Home() {
  // O preço vem do servidor (variável PRECO_PREMIUM_CENTAVOS) para não ficar duplicado.
  const { precoPremiumCentavos } = lerConfigServidor().pagamento;
  return (
    <main className="pagina">
      <header className="cabecalho">
        <p className="marca">Tal Dono, Tal Cão 🐾</p>
        <h1>
          O quanto você se parece com o <span className="destaque">seu cachorro?</span>
        </h1>
        <p className="subtitulo">Duas fotos, uma IA e a verdade que todo mundo já desconfiava.</p>
      </header>

      <App precoPremiumCentavos={precoPremiumCentavos} />

      <section className="como-funciona" aria-labelledby="como">
        <h2 id="como">Como funciona</h2>
        <ol>
          <li>
            <strong>Mande as fotos.</strong> Uma selfie sua e uma do seu cachorro.
          </li>
          <li>
            <strong>A IA compara.</strong> Olhar, cabelo x pelo, expressão, pose e vibe.
          </li>
          <li>
            <strong>Compartilhe.</strong> Receba sua nota e um card pronto para os Stories e o TikTok.
          </li>
        </ol>
        <p className="ciencia">
          Tem até ciência: estudos de psicologia mostram que muita gente escolhe cachorros parecidos consigo,
          principalmente no olhar.
        </p>
      </section>

      <Rodape />
    </main>
  );
}
