// Configuração exclusiva do servidor (segredos e limites). Nunca importar em componentes de cliente.
import "server-only";

function inteiroPositivo(valor: string | undefined, padrao: number): number {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : padrao;
}

function texto(valor: string | undefined): string | undefined {
  const t = valor?.trim();
  return t ? t : undefined;
}

export type ConfigServidor = {
  anthropic: { chave?: string; modelo: string; timeoutMs: number };
  modoDemo: boolean;
  limites: { porIp: number; global: number };
  upstash?: { url: string; token: string };
  pagamento: {
    /** Sem token, o Pix roda em modo demo (aprova sozinho depois de alguns segundos). */
    mercadoPagoToken?: string;
    modoDemo: boolean;
    precoPremiumCentavos: number;
    limites: { porIp: number; global: number };
  };
};

/** Lê as variáveis de ambiente a cada chamada, para facilitar testes. */
export function lerConfigServidor(env: NodeJS.ProcessEnv = process.env): ConfigServidor {
  const chave = texto(env.ANTHROPIC_API_KEY);
  const upstashUrl = texto(env.UPSTASH_REDIS_REST_URL);
  const upstashToken = texto(env.UPSTASH_REDIS_REST_TOKEN);
  const mercadoPagoToken = texto(env.MERCADOPAGO_ACCESS_TOKEN);

  return {
    anthropic: {
      chave,
      modelo: texto(env.ANTHROPIC_MODEL) ?? "claude-haiku-5-5",
      timeoutMs: 45_000,
    },
    modoDemo: env.DEMO_MODE === "1" || !chave,
    limites: {
      porIp: inteiroPositivo(env.LIMITE_DIARIO_POR_IP, 5),
      global: inteiroPositivo(env.LIMITE_DIARIO_GLOBAL, 500),
    },
    upstash: upstashUrl && upstashToken ? { url: upstashUrl, token: upstashToken } : undefined,
    pagamento: {
      mercadoPagoToken,
      modoDemo: env.PIX_DEMO === "1" || !mercadoPagoToken,
      precoPremiumCentavos: inteiroPositivo(env.PRECO_PREMIUM_CENTAVOS, 490),
      limites: {
        porIp: inteiroPositivo(env.LIMITE_PIX_POR_IP, 10),
        global: inteiroPositivo(env.LIMITE_PIX_GLOBAL, 2000),
      },
    },
  };
}
