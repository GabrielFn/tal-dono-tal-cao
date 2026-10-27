// Tipos do módulo de pagamento (somente servidor).

export type StatusPix = "pendente" | "pago" | "expirado" | "cancelado" | "falhou";

export type CobrancaPix = {
  id: string;
  status: StatusPix;
  /** Código "Pix copia e cola". */
  copiaECola: string;
  /** Imagem do QR code em base64 (sem o prefixo data:). Vazia no modo demo. */
  qrCodeBase64: string;
  /** ISO 8601. */
  expiraEm: string;
  valorCentavos: number;
  demo?: boolean;
};

export type PedidoCobranca = {
  valorCentavos: number;
  email: string;
  descricao: string;
  /** Referência nossa, enviada ao provedor (aparece no painel dele). */
  referencia: string;
};

/**
 * Strategy: qualquer provedor capaz de gerar uma cobrança Pix e informar se ela foi paga.
 * Implementações: ProvedorMercadoPago (real) e ProvedorPixDemo (aprova sozinho, para testes).
 */
export interface ProvedorPix {
  criarCobranca(pedido: PedidoCobranca): Promise<CobrancaPix>;
  consultarStatus(id: string): Promise<StatusPix>;
}

export class ErroPagamento extends Error {
  constructor(mensagem: string, options?: { cause?: unknown }) {
    super(mensagem, options);
    this.name = "ErroPagamento";
  }
}

/** Centavos → "4.90", formato que o Mercado Pago espera. */
export function centavosParaDecimal(centavos: number): string {
  return (centavos / 100).toFixed(2);
}
