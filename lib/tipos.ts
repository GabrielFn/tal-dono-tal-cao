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
  /** true para bicho fora do comum (não é cachorro nem gato): ganha o "plot twist". */
  inusitado: boolean;
  /** Ex.: "cachorro", "gato", "papagaio". */
  especie: string;
  /** Onomatopeia do bicho, em maiúsculas, usada no card. Ex.: "AU-AU", "MIAU". */
  somDoAnimal: string;
  /** Frase engraçada quando o bicho é inusitado; vazia para cachorro e gato. */
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

// ---- Pagamento (premium) ----

export type StatusCobranca = "pendente" | "pago" | "expirado" | "cancelado" | "falhou";

/** O que a interface recebe ao criar uma cobrança Pix. */
export type CobrancaPublica = {
  id: string;
  copiaECola: string;
  qrCodeBase64: string;
  expiraEm: string;
  valorCentavos: number;
  demo?: boolean;
};

export type RespostaStatusCobranca = { status: StatusCobranca };
