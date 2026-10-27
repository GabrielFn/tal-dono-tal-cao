// Tipos compartilhados entre o servidor (API) e a interface.

export type Categoria = {
  nome: string;
  nota: number; // 0 a 100
  comentario: string;
};

export type ResultadoValido = {
  valido: true;
  nota: number; // 0 a 100
  titulo: string;
  veredito: string;
  fraseCard: string;
  racaProvavel: string;
  categorias: Categoria[];
  /** false quando a foto é de outro bicho (gato, papagaio, iguana...). */
  ehCachorro: boolean;
  /** Ex.: "cachorro", "gato", "papagaio". */
  especie: string;
  /** Onomatopeia do bicho, em maiúsculas, usada no card. Ex.: "AU-AU", "MIAU". */
  somDoAnimal: string;
  /** Frase engraçada quando não é cachorro; vazia quando é. */
  plotTwist: string;
  demo?: boolean;
};

export type MotivoInvalido = "sem_pessoa" | "sem_animal" | "foto_ruim" | "outro";

export type ResultadoInvalido = {
  valido: false;
  motivo: MotivoInvalido;
  mensagem: string;
};

export type Resultado = ResultadoValido | ResultadoInvalido;

export type RespostaErro = { erro: string; codigo: string };
