import type { ConfigServidor } from "@/lib/config/servidor";
import { ProvedorPixDemo } from "./demo";
import { ProvedorMercadoPago } from "./mercadopago";
import type { ProvedorPix } from "./tipos";

export { ErroPagamento } from "./tipos";
export type { CobrancaPix, ProvedorPix, StatusPix } from "./tipos";

/** Factory: Mercado Pago com token configurado; senão, Pix de demonstração. */
export function criarProvedorPix(config: ConfigServidor): ProvedorPix {
  const { mercadoPagoToken, modoDemo } = config.pagamento;
  if (modoDemo || !mercadoPagoToken) return new ProvedorPixDemo();
  return new ProvedorMercadoPago({ accessToken: mercadoPagoToken });
}
