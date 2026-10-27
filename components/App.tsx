"use client";

import TelaInicio from "./TelaInicio";
import TelaResultado from "./TelaResultado";
import { useAnalise } from "@/hooks/useAnalise";

/** Composição: escolhe a tela de acordo com a etapa. A lógica fica no hook useAnalise. */
export default function App() {
  const { estado, prontoParaAnalisar, escolherFoto, analisar, recomecar } = useAnalise();
  const { resultado, fotos } = estado;

  if (estado.etapa === "resultado" && resultado && fotos.pessoa && fotos.cachorro) {
    return (
      <TelaResultado
        resultado={resultado}
        fotoPessoa={fotos.pessoa}
        fotoCachorro={fotos.cachorro}
        onRecomecar={recomecar}
      />
    );
  }

  return (
    <TelaInicio
      estado={estado}
      pronto={prontoParaAnalisar}
      onEscolherFoto={escolherFoto}
      onAnalisar={analisar}
    />
  );
}
