// Integração com a API Orders do Mercado Pago (Pix).
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/pix
import {
  centavosParaDecimal,
  ErroPagamento,
  type CobrancaPix,
  type PedidoCobranca,
  type ProvedorPix,
  type StatusPix,
} from "./tipos";

const URL_ORDERS = "https://api.mercadopago.com/v1/orders";
/** O Mercado Pago aceita de 30 minutos a 30 dias. 30 minutos combina com uma compra por impulso. */
const VALIDADE_PIX_MINUTOS = 30;
const TIMEOUT_MS = 15_000;

type PagamentoMP = {
  id?: string;
  status?: string;
  status_detail?: string;
  payment_method?: { qr_code?: string; qr_code_base64?: string };
};
type OrderMP = { id?: string; status?: string; transactions?: { payments?: PagamentoMP[] } };

/** Traduz o status do Mercado Pago para o nosso. Tudo que ainda pode virar pago é "pendente". */
export function traduzirStatus(order: OrderMP): StatusPix {
  const pagamento = order.transactions?.payments?.[0];
  const status = pagamento?.status ?? order.status;
  switch (status) {
    case "processed":
      // "processed" com "partially_refunded" ainda conta como pago.
      return "pago";
    case "expired":
      return "expirado";
    case "canceled":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";
    case "failed":
      return "falhou";
    default:
      // created, processing, action_required (waiting_transfer), in_review...
      return "pendente";
  }
}

export type OpcoesMercadoPago = {
  accessToken: string;
  fetch?: typeof fetch;
  agora?: () => number;
  gerarId?: () => string;
};

export class ProvedorMercadoPago implements ProvedorPix {
  private readonly fetch: typeof fetch;
  private readonly agora: () => number;
  private readonly gerarId: () => string;

  constructor(private readonly opcoes: OpcoesMercadoPago) {
    this.fetch = opcoes.fetch ?? globalThis.fetch;
    this.agora = opcoes.agora ?? Date.now;
    this.gerarId = opcoes.gerarId ?? (() => crypto.randomUUID());
  }

  async criarCobranca(pedido: PedidoCobranca): Promise<CobrancaPix> {
    const valor = centavosParaDecimal(pedido.valorCentavos);
    const order = await this.requisitar<OrderMP>(URL_ORDERS, {
      method: "POST",
      headers: { "X-Idempotency-Key": this.gerarId() },
      body: JSON.stringify({
        type: "online",
        processing_mode: "automatic",
        total_amount: valor,
        external_reference: pedido.referencia,
        description: pedido.descricao,
        payer: { email: pedido.email },
        transactions: {
          payments: [
            {
              amount: valor,
              payment_method: { id: "pix", type: "bank_transfer" },
              expiration_time: `PT${VALIDADE_PIX_MINUTOS}M`,
            },
          ],
        },
      }),
    });

    const pagamento = order.transactions?.payments?.[0];
    const copiaECola = pagamento?.payment_method?.qr_code;
    if (!order.id || !copiaECola) {
      throw new ErroPagamento(`Mercado Pago não devolveu o código Pix (order ${order.id ?? "?"})`);
    }

    return {
      id: order.id,
      status: traduzirStatus(order),
      copiaECola,
      qrCodeBase64: pagamento?.payment_method?.qr_code_base64 ?? "",
      expiraEm: new Date(this.agora() + VALIDADE_PIX_MINUTOS * 60_000).toISOString(),
      valorCentavos: pedido.valorCentavos,
    };
  }

  async consultarStatus(id: string): Promise<StatusPix> {
    const order = await this.requisitar<OrderMP>(`${URL_ORDERS}/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    return traduzirStatus(order);
  }

  private async requisitar<T>(url: string, init: RequestInit): Promise<T> {
    let resposta: Response;
    try {
      resposta = await this.fetch(url, {
        ...init,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.opcoes.accessToken}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (erro) {
      throw new ErroPagamento("Falha de rede ao falar com o Mercado Pago", { cause: erro });
    }
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      throw new ErroPagamento(`Mercado Pago respondeu ${resposta.status}: ${corpo.slice(0, 300)}`);
    }
    return resposta.json() as Promise<T>;
  }
}
