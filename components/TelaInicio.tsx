"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SlotFoto from "./SlotFoto";
import type { Estado, TipoFoto } from "@/lib/cliente/estado";

const MENSAGENS_CARREGANDO = [
  "Comparando olhares…",
  "Medindo o nível de fofura…",
  "Cheirando as fotos…",
  "Consultando o júri canino…",
  "Contando os pelos (e os fios)…",
  "Calculando a vibe da dupla…",
];
const TROCA_MENSAGEM_MS = 1400;

function useMensagemRotativa(ativa: boolean): string {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (!ativa) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % MENSAGENS_CARREGANDO.length), TROCA_MENSAGEM_MS);
    return () => {
      clearInterval(id);
      setIndice(0);
    };
  }, [ativa]);
  return MENSAGENS_CARREGANDO[indice];
}

type Props = {
  estado: Estado;
  pronto: boolean;
  onEscolherFoto: (arquivo: File, foto: TipoFoto) => void;
  onAnalisar: () => void;
};

export default function TelaInicio({ estado, pronto, onEscolherFoto, onAnalisar }: Props) {
  const analisando = estado.etapa === "analisando";
  const mensagem = useMensagemRotativa(analisando);

  return (
    <section className="inicio">
      <div className="slots">
        <SlotFoto
          rotulo="Sua selfie"
          dica="Rosto de frente, com boa luz"
          emoji="🤳"
          cor="var(--verde)"
          foto={estado.fotos.pessoa}
          onEscolher={(arquivo) => onEscolherFoto(arquivo, "pessoa")}
        />
        <SlotFoto
          rotulo="Seu cachorro"
          dica="Focinho bem visível"
          emoji="🐶"
          cor="var(--laranja)"
          foto={estado.fotos.cachorro}
          onEscolher={(arquivo) => onEscolherFoto(arquivo, "cachorro")}
        />
      </div>

      {estado.aviso && (
        <p className="aviso" role="alert">
          {estado.aviso}
        </p>
      )}

      <button
        className="botao botao-principal botao-grande"
        onClick={onAnalisar}
        disabled={!pronto}
        aria-busy={analisando}
      >
        {analisando ? mensagem : "Ver o quanto a gente se parece"}
      </button>

      <p className="letra-miuda">
        Grátis. As fotos não são salvas: são analisadas e descartadas na hora. Ao continuar, você concorda com
        os <Link href="/termos">termos</Link> e a <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </section>
  );
}
