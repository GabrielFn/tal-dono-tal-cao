"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SlotFoto from "./SlotFoto";
import { mensagensDeAviso, type Estado, type TipoFoto } from "@/lib/cliente/estado";

// A análise leva de 15 a 40 s: as mensagens avançam como etapas e param na última,
// em vez de repetir em loop (repetição passa a impressão de que travou).
const MENSAGENS_CARREGANDO = [
  "Abrindo as fotos…",
  "Olhando cada detalhe do seu rosto…",
  "Agora o do seu pet…",
  "Comparando sobrancelhas e orelhas…",
  "Conferindo cabelo x pelo…",
  "Procurando o detalhe que ninguém notou…",
  "Medindo poses e ângulos…",
  "O júri está deliberando…",
  "Escrevendo o veredito…",
  "Quase lá, caprichando no resultado…",
];
const TROCA_MENSAGEM_MS = 4500;

function useMensagemRotativa(ativa: boolean): string {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (!ativa) return;
    const ultima = MENSAGENS_CARREGANDO.length - 1;
    const id = setInterval(() => setIndice((i) => Math.min(i + 1, ultima)), TROCA_MENSAGEM_MS);
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
  const avisos = mensagensDeAviso(estado);

  return (
    <section className="inicio">
      <div className="slots">
        <SlotFoto
          rotulo="Sua selfie"
          dica="Rosto de frente, com boa luz"
          emoji="🤳"
          cor="var(--verde)"
          foto={estado.fotos.pessoa}
          carregando={estado.carregando.pessoa}
          onEscolher={(arquivo) => onEscolherFoto(arquivo, "pessoa")}
        />
        <SlotFoto
          rotulo="Seu pet"
          dica="Cachorro, gato… ou algo mais inusitado 👀"
          emoji="🐾"
          cor="var(--laranja)"
          foto={estado.fotos.pet}
          carregando={estado.carregando.pet}
          onEscolher={(arquivo) => onEscolherFoto(arquivo, "pet")}
        />
      </div>

      {avisos.length > 0 && (
        <div className="aviso" role="alert">
          {avisos.map((texto) => (
            <p key={texto}>{texto}</p>
          ))}
        </div>
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
        Grátis. Não guardamos suas fotos: elas servem só para gerar o resultado. Ao continuar, você declara
        ter 18 anos ou autorização do responsável e concorda com os <Link href="/termos">termos</Link> e a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </section>
  );
}
