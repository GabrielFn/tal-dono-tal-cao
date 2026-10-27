"use client";

import { useEffect, useState } from "react";
import { gerarCard } from "@/lib/cliente/card";
import { dominioDoSite } from "@/lib/config/publico";
import type { ResultadoValido } from "@/lib/tipos";

export type Card = { blob: Blob; url: string };

/** Gera o card quando há resultado e libera a memória (object URL) quando ele muda ou some. */
export function useCard(
  resultado: ResultadoValido | null,
  fotoPessoa: string | null,
  fotoPet: string | null,
) {
  const [card, setCard] = useState<Card | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setCard(null);
    setErro(false);
    if (!resultado || !fotoPessoa || !fotoPet) return;

    let cancelado = false;
    let url: string | null = null;

    gerarCard(resultado, fotoPessoa, fotoPet, dominioDoSite)
      .then((blob) => {
        if (cancelado) return;
        url = URL.createObjectURL(blob);
        setCard({ blob, url });
      })
      .catch(() => !cancelado && setErro(true));

    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [resultado, fotoPessoa, fotoPet]);

  return { card, erro };
}
