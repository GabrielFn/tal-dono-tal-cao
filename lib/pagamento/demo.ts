// Pix de mentira para testar o fluxo sem conta no Mercado Pago.
// Sem estado no servidor: o horário de criação vai dentro do próprio id,
// então funciona mesmo com várias instâncias da Vercel.
import type { CobrancaPix, PedidoCobranca, ProvedorPix, StatusPix } from "./tipos";

const PREFIXO = "demo_";
const PADRAO_ID = /^demo_(\d{10,15})_[a-z0-9]{4,12}$/;

export type OpcoesPixDemo = {
  /** Depois de quanto tempo a cobrança "é paga" sozinha. */
  aprovaEmMs?: number;
  agora?: () => number;
};

export class ProvedorPixDemo implements ProvedorPix {
  private readonly aprovaEmMs: number;
  private readonly agora: () => number;

  constructor(opcoes: OpcoesPixDemo = {}) {
    this.aprovaEmMs = opcoes.aprovaEmMs ?? 8_000;
    this.agora = opcoes.agora ?? Date.now;
  }

  async criarCobranca(pedido: PedidoCobranca): Promise<CobrancaPix> {
    const criadoEm = this.agora();
    const sufixo = Math.random().toString(36).slice(2, 10).padEnd(4, "0");
    return {
      id: `${PREFIXO}${criadoEm}_${sufixo}`,
      status: "pendente",
      copiaECola: "00020126DEMO-PIX-COPIA-E-COLA-NAO-PAGUE-ISTO5204000053039865802BR6304DEMO",
      qrCodeBase64: "",
      expiraEm: new Date(criadoEm + 30 * 60_000).toISOString(),
      valorCentavos: pedido.valorCentavos,
      demo: true,
    };
  }

  async consultarStatus(id: string): Promise<StatusPix> {
    const encontrado = PADRAO_ID.exec(id);
    if (!encontrado) return "falhou";
    return this.agora() - Number(encontrado[1]) >= this.aprovaEmMs ? "pago" : "pendente";
  }
}
