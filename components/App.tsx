"use client";

import { useEffect, useRef, useState } from "react";
import { gerarCard } from "@/lib/card";
import { comprimirFoto } from "@/lib/imagem";
import type { RespostaErro, Resultado, ResultadoValido } from "@/lib/tipos";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://taldonotalcao.com.br";

const MENSAGENS_CARREGANDO = [
  "Comparando olhares…",
  "Medindo o nível de fofura…",
  "Cheirando as fotos…",
  "Consultando o júri canino…",
  "Contando os pelos (e os fios)…",
  "Calculando a vibe da dupla…",
];

type Etapa = "inicio" | "analisando" | "resultado";

function SlotFoto({
  rotulo,
  dica,
  emoji,
  foto,
  onEscolher,
  cor,
}: {
  rotulo: string;
  dica: string;
  emoji: string;
  foto: string | null;
  onEscolher: (f: File) => void;
  cor: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      className="slot"
      style={{ ["--cor" as string]: cor }}
      onClick={() => ref.current?.click()}
      aria-label={foto ? `Trocar foto: ${rotulo}` : `Escolher foto: ${rotulo}`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={rotulo} className="slot-img" />
      ) : (
        <span className="slot-vazio">
          <span className="slot-emoji">{emoji}</span>
          <span className="slot-dica">{dica}</span>
        </span>
      )}
      <span className="slot-rotulo">{foto ? "Trocar" : rotulo}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onEscolher(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function Medidor({ nota }: { nota: number }) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    let atual = 0;
    const id = setInterval(() => {
      atual = Math.min(nota, atual + Math.max(1, Math.round((nota - atual) / 8)));
      setValor(atual);
      if (atual >= nota) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [nota]);
  return (
    <div className="medidor" role="img" aria-label={`${nota}% parecidos`}>
      <div className="medidor-numero">{valor}%</div>
      <div className="medidor-legenda">parecidos</div>
    </div>
  );
}

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [fotoPessoa, setFotoPessoa] = useState<string | null>(null);
  const [fotoCachorro, setFotoCachorro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoValido | null>(null);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (etapa !== "analisando") return;
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % MENSAGENS_CARREGANDO.length), 1400);
    return () => clearInterval(id);
  }, [etapa]);

  useEffect(() => {
    return () => {
      if (card) URL.revokeObjectURL(card.url);
    };
  }, [card]);

  async function escolher(f: File, tipo: "pessoa" | "cachorro") {
    setAviso(null);
    try {
      const dataUrl = await comprimirFoto(f);
      if (tipo === "pessoa") setFotoPessoa(dataUrl);
      else setFotoCachorro(dataUrl);
    } catch (e) {
      setAviso((e as Error).message);
    }
  }

  async function analisar() {
    if (!fotoPessoa || !fotoCachorro) return;
    setAviso(null);
    setEtapa("analisando");
    try {
      const resp = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pessoa: fotoPessoa, cachorro: fotoCachorro }),
      });
      const dados = (await resp.json()) as Resultado | RespostaErro;
      if (!resp.ok || "erro" in dados) {
        setAviso("erro" in dados ? dados.erro : "Algo deu errado. Tenta de novo.");
        setEtapa("inicio");
        return;
      }
      if (!dados.valido) {
        setAviso(dados.mensagem);
        setEtapa("inicio");
        return;
      }
      setResultado(dados);
      setEtapa("resultado");
      window.scrollTo({ top: 0, behavior: "smooth" });
      const blob = await gerarCard(dados, fotoPessoa, fotoCachorro, SITE);
      setCard({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setAviso("Sem conexão ou o servidor demorou demais. Tenta de novo.");
      setEtapa("inicio");
    }
  }

  async function compartilhar() {
    if (!card || !resultado) return;
    const arquivo = new File([card.blob], "tal-dono-tal-cao.png", { type: "image/png" });
    const texto = `Deu ${resultado.nota}% de semelhança entre eu e meu cachorro 🐶 Descubra o seu: ${SITE}`;
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], text: texto });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    baixar();
  }

  function baixar() {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card.url;
    a.download = "tal-dono-tal-cao.png";
    a.click();
  }

  function recomecar() {
    setResultado(null);
    setCard(null);
    setFotoPessoa(null);
    setFotoCachorro(null);
    setEtapa("inicio");
  }

  if (etapa === "resultado" && resultado) {
    return (
      <section className="resultado">
        {resultado.demo && (
          <p className="selo-demo">Modo demonstração: resultado de exemplo, sem IA real.</p>
        )}
        <div className="dupla">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoPessoa!} alt="Você" className="dupla-foto" />
          <span className="dupla-igual">≈</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoCachorro!} alt="Seu cachorro" className="dupla-foto" />
        </div>
        <Medidor nota={resultado.nota} />
        <h2 className="titulo-resultado">{resultado.titulo}</h2>
        <p className="veredito">{resultado.veredito}</p>
        <p className="raca">
          Raça provável: <strong>{resultado.racaProvavel}</strong>
        </p>

        <ul className="categorias">
          {resultado.categorias.map((c) => (
            <li key={c.nome}>
              <div className="cat-topo">
                <span>{c.nome}</span>
                <strong>{c.nota}%</strong>
              </div>
              <div className="barra">
                <div className="barra-cheia" style={{ width: `${c.nota}%` }} />
              </div>
              {c.comentario && <p className="cat-comentario">{c.comentario}</p>}
            </li>
          ))}
        </ul>

        <div className="card-area">
          <h3>Seu card para os Stories</h3>
          {card ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.url} alt="Card do resultado para compartilhar" className="card-preview" />
          ) : (
            <div className="card-preview card-carregando">Montando o card…</div>
          )}
          <div className="acoes">
            <button className="botao botao-principal" onClick={compartilhar} disabled={!card}>
              Compartilhar
            </button>
            <button className="botao" onClick={baixar} disabled={!card}>
              Baixar imagem
            </button>
          </div>
        </div>

        <button className="botao botao-texto" onClick={recomecar}>
          Testar outra dupla
        </button>
      </section>
    );
  }

  const pronto = fotoPessoa && fotoCachorro;

  return (
    <section className="inicio">
      <div className="slots">
        <SlotFoto
          rotulo="Sua selfie"
          dica="Rosto de frente, com boa luz"
          emoji="🤳"
          foto={fotoPessoa}
          cor="var(--verde)"
          onEscolher={(f) => escolher(f, "pessoa")}
        />
        <SlotFoto
          rotulo="Seu cachorro"
          dica="Focinho bem visível"
          emoji="🐶"
          foto={fotoCachorro}
          cor="var(--laranja)"
          onEscolher={(f) => escolher(f, "cachorro")}
        />
      </div>

      {aviso && (
        <p className="aviso" role="alert">
          {aviso}
        </p>
      )}

      <button
        className="botao botao-principal botao-grande"
        onClick={analisar}
        disabled={!pronto || etapa === "analisando"}
      >
        {etapa === "analisando" ? MENSAGENS_CARREGANDO[msgIdx] : "Ver o quanto a gente se parece"}
      </button>

      <p className="letra-miuda">
        Grátis. As fotos não são salvas: são analisadas e descartadas na hora. Ao continuar, você concorda
        com os <a href="/termos">termos</a> e a <a href="/privacidade">política de privacidade</a>.
      </p>
    </section>
  );
}
