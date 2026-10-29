"use client";

import Medidor from "./Medidor";
import PainelPremium from "./PainelPremium";
import { useCard } from "@/hooks/useCard";
import { baixarArquivo, compartilharImagem, textoDeCompartilhamento } from "@/lib/cliente/compartilhar";
import { configPublica } from "@/lib/config/publico";
import type { ResultadoValido } from "@/lib/tipos";

type Props = {
  resultado: ResultadoValido;
  fotoPessoa: string;
  fotoPet: string;
  precoPremiumCentavos: number;
  onRecomecar: () => void;
};

function Categorias({ categorias }: Pick<ResultadoValido, "categorias">) {
  return (
    <ul className="categorias">
      {categorias.map((c) => (
        <li key={c.nome}>
          <div className="cat-topo">
            <span>{c.nome}</span>
            <strong>{c.nota}%</strong>
          </div>
          <div className="barra" aria-hidden>
            <div className="barra-cheia" style={{ width: `${c.nota}%` }} />
          </div>
          {c.comentario && <p className="cat-comentario">{c.comentario}</p>}
        </li>
      ))}
    </ul>
  );
}

function AreaDoCard({ resultado, fotoPessoa, fotoPet }: Pick<Props, "resultado" | "fotoPessoa" | "fotoPet">) {
  const { card, erro } = useCard(resultado, fotoPessoa, fotoPet);

  const compartilhar = () =>
    card && compartilharImagem(card.blob, textoDeCompartilhamento(resultado, configPublica.siteUrl));

  return (
    <div className="card-area">
      <h3>Seu card para os Stories</h3>
      {card ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob local gerado no navegador
        <img src={card.url} alt="Card do resultado para compartilhar" className="card-preview" />
      ) : (
        <div className="card-preview card-carregando">
          {erro ? "Não deu para montar o card neste navegador." : "Montando o card…"}
        </div>
      )}
      <div className="acoes">
        <button className="botao botao-principal" onClick={compartilhar} disabled={!card}>
          Compartilhar
        </button>
        <button className="botao" onClick={() => card && baixarArquivo(card.url)} disabled={!card}>
          Baixar imagem
        </button>
      </div>
    </div>
  );
}

export default function TelaResultado({
  resultado,
  fotoPessoa,
  fotoPet,
  precoPremiumCentavos,
  onRecomecar,
}: Props) {
  return (
    <section className="resultado">
      {resultado.demo && <p className="selo-demo">Modo demonstração: resultado de exemplo, sem IA real.</p>}

      <div className="dupla">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
        <img src={fotoPessoa} alt="Você" className="dupla-foto" />
        <span className="dupla-igual" aria-hidden>
          ≈
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
        <img src={fotoPet} alt={`Seu pet (${resultado.especie})`} className="dupla-foto" />
      </div>

      {resultado.inusitado && (
        <p className="plot-twist" role="status">
          <span className="plot-twist-selo">Plot twist!</span>
          {resultado.plotTwist}
        </p>
      )}

      <Medidor nota={resultado.nota} />
      <h2 className="titulo-resultado">{resultado.titulo}</h2>
      <p className="veredito">{resultado.veredito}</p>
      {resultado.detalheSecreto && (
        <p className="detalhe-secreto">
          <span className="detalhe-secreto-rotulo">🔍 O detalhe que ninguém notou</span>
          {resultado.detalheSecreto}
        </p>
      )}
      <p className="raca">
        Raça provável: <strong>{resultado.racaProvavel}</strong>
      </p>

      <Categorias categorias={resultado.categorias} />
      <AreaDoCard resultado={resultado} fotoPessoa={fotoPessoa} fotoPet={fotoPet} />

      <PainelPremium
        resultado={resultado}
        fotoPessoa={fotoPessoa}
        fotoBicho={fotoPet}
        precoCentavos={precoPremiumCentavos}
      />

      <button className="botao botao-texto" onClick={onRecomecar}>
        Testar outra dupla
      </button>
    </section>
  );
}
