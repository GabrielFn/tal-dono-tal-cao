// Máquina de estados da tela, como reducer puro (sem React), para ser testável.
import type { ResultadoValido } from "@/lib/tipos";

export type Etapa = "inicio" | "analisando" | "resultado";
export type TipoFoto = "pessoa" | "cachorro";

type PorFoto<T> = Record<TipoFoto, T>;

export type Estado = {
  etapa: Etapa;
  fotos: PorFoto<string | null>;
  /** Foto sendo aberta/convertida (HEIC pode levar alguns segundos). */
  carregando: PorFoto<boolean>;
  /** Erro de cada foto, separado, para um não apagar o aviso do outro. */
  errosFoto: PorFoto<string | null>;
  /** Erro geral (da análise). */
  aviso: string | null;
  resultado: ResultadoValido | null;
};

export type Acao =
  | { tipo: "foto_carregando"; foto: TipoFoto }
  | { tipo: "foto_escolhida"; foto: TipoFoto; dataUrl: string }
  | { tipo: "foto_falhou"; foto: TipoFoto; mensagem: string }
  | { tipo: "analise_iniciada" }
  | { tipo: "analise_concluida"; resultado: ResultadoValido }
  | { tipo: "analise_falhou"; mensagem: string }
  | { tipo: "recomecar" };

export const ESTADO_INICIAL: Estado = {
  etapa: "inicio",
  fotos: { pessoa: null, cachorro: null },
  carregando: { pessoa: false, cachorro: false },
  errosFoto: { pessoa: null, cachorro: null },
  aviso: null,
  resultado: null,
};

export function podeAnalisar(estado: Estado): boolean {
  const { fotos, carregando } = estado;
  return (
    estado.etapa === "inicio" &&
    Boolean(fotos.pessoa && fotos.cachorro) &&
    !carregando.pessoa &&
    !carregando.cachorro
  );
}

/** Mensagens a exibir: erros das fotos (com o nome do slot) e o erro geral. */
export function mensagensDeAviso(estado: Estado): string[] {
  const rotulos: PorFoto<string> = { pessoa: "Selfie", cachorro: "Foto do cachorro" };
  const daFoto = (Object.keys(rotulos) as TipoFoto[])
    .filter((foto) => estado.errosFoto[foto])
    .map((foto) => `${rotulos[foto]}: ${estado.errosFoto[foto]}`);
  return estado.aviso ? [...daFoto, estado.aviso] : daFoto;
}

const comFoto = <T>(mapa: PorFoto<T>, foto: TipoFoto, valor: T): PorFoto<T> => ({ ...mapa, [foto]: valor });

export function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case "foto_carregando":
      return {
        ...estado,
        aviso: null,
        carregando: comFoto(estado.carregando, acao.foto, true),
        errosFoto: comFoto(estado.errosFoto, acao.foto, null),
      };
    case "foto_escolhida":
      return {
        ...estado,
        fotos: comFoto(estado.fotos, acao.foto, acao.dataUrl),
        carregando: comFoto(estado.carregando, acao.foto, false),
        errosFoto: comFoto(estado.errosFoto, acao.foto, null),
      };
    case "foto_falhou":
      return {
        ...estado,
        carregando: comFoto(estado.carregando, acao.foto, false),
        errosFoto: comFoto(estado.errosFoto, acao.foto, acao.mensagem),
      };
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
