"use client";

import { useRef, type CSSProperties } from "react";

type Props = {
  rotulo: string;
  dica: string;
  emoji: string;
  cor: string;
  foto: string | null;
  onEscolher: (arquivo: File) => void;
};

export default function SlotFoto({ rotulo, dica, emoji, cor, foto, onEscolher }: Props) {
  const entrada = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      className="slot"
      style={{ "--cor": cor } as CSSProperties}
      onClick={() => entrada.current?.click()}
      aria-label={foto ? `Trocar foto: ${rotulo}` : `Escolher foto: ${rotulo}`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem otimização do Next
        <img src={foto} alt={rotulo} className="slot-img" />
      ) : (
        <span className="slot-vazio">
          <span className="slot-emoji" aria-hidden>
            {emoji}
          </span>
          <span className="slot-dica">{dica}</span>
        </span>
      )}
      <span className="slot-rotulo">{foto ? "Trocar" : rotulo}</span>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) onEscolher(arquivo);
          e.target.value = "";
        }}
      />
    </button>
  );
}
