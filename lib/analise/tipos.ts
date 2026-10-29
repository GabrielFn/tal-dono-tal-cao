import type { Tema } from "@/lib/conteudo/temporada";
import type { Resultado } from "@/lib/tipos";

export type TipoImagem = "image/jpeg" | "image/png" | "image/webp";

export type ImagemBase64 = { tipo: TipoImagem; dados: string };

/**
 * Strategy: qualquer serviço capaz de comparar a foto da pessoa com a do pet.
 * Implementações: AnalisadorAnthropic (IA real) e AnalisadorDemo (resultados de exemplo).
 */
export interface AnalisadorDeFotos {
  /** Indica se o resultado é real e deve consumir a cota do usuário. */
  readonly consomeCota: boolean;
  /** `tema`: tema sazonal ativo (ex.: Halloween), que acrescenta extras ao resultado. */
  analisar(pessoa: ImagemBase64, pet: ImagemBase64, tema?: Tema | null): Promise<Resultado>;
}

/** Falha técnica na análise (rede, autenticação, resposta fora do formato). */
export class ErroAnalise extends Error {
  constructor(mensagem: string, options?: { cause?: unknown }) {
    super(mensagem, options);
    this.name = "ErroAnalise";
  }
}
