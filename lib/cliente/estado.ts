// Máquina de estados da tela, como reducer puro (sem React), para ser testável.
import type { ResultadoValido } from "@/lib/tipos";

export type Etapa = "inicio" | "analisando" | "resultado";
export type TipoFoto = "pessoa" | "cachorro";

export type Estado = {
  etapa: Etapa;
  fotos: Record<TipoFoto, string | null>;
  aviso: string | null;
  resultado: ResultadoValido | null;
};

export type Acao =
  | { tipo: "foto_escolhida"; foto: TipoFoto; dataUrl: string }
  | { tipo: "aviso"; mensagem: string }
  | { tipo: "analise_iniciada" }
  | { tipo: "analise_concluida"; resultado: ResultadoValido }
  | { tipo: "analise_falhou"; mensagem: string }
  | { tipo: "recomecar" };

export const ESTADO_INICIAL: Estado = {
  etapa: "inicio",
  fotos: { pessoa: null, cachorro: null },
  aviso: null,
  resultado: null,
};

export function podeAnalisar(estado: Estado): boolean {
  return estado.etapa === "inicio" && Boolean(estado.fotos.pessoa && estado.fotos.cachorro);
}

export function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case "foto_escolhida":
      return { ...estado, aviso: null, fotos: { ...estado.fotos, [acao.foto]: acao.dataUrl } };
    case "aviso":
      return { ...estado, aviso: acao.mensagem };
    case "analise_iniciada":
      return podeAnalisar(estado) ? { ...estado, etapa: "analisando", aviso: null } : estado;
    case "analise_concluida":
      return { ...estado, etapa: "resultado", resultado: acao.resultado };
    case "analise_falhou":
      return { ...estado, etapa: "inicio", aviso: acao.mensagem };
    case "recomecar":
      return ESTADO_INICIAL;
  }
}
