"use client";

import { useEffect, useState } from "react";

const INTERVALO_MS = 30;
const SUAVIZACAO = 8;

/** Número que "sobe" de 0 até a nota, desacelerando no final. */
export default function Medidor({ nota }: { nota: number }) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let atual = 0;
    const id = setInterval(() => {
      atual = Math.min(nota, atual + Math.max(1, Math.round((nota - atual) / SUAVIZACAO)));
      setValor(atual);
      if (atual >= nota) clearInterval(id);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [nota]);

  return (
    <div className="medidor" role="img" aria-label={`${nota}% parecidos`}>
      <div className="medidor-numero" aria-hidden>
        {valor}%
      </div>
      <div className="medidor-legenda" aria-hidden>
        parecidos
      </div>
    </div>
  );
}
