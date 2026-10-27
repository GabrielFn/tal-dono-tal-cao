import { describe, expect, it, vi } from "vitest";
import { lerConfigServidor } from "@/lib/config/servidor";
import { ContadorEmMemoria } from "@/lib/limite/contadores";
import { LimitadorDeUso } from "@/lib/limite/limitador";
import { criarProvedorPix } from "@/lib/pagamento";
import { ProvedorPixDemo } from "@/lib/pagamento/demo";
import { ProvedorMercadoPago, traduzirStatus } from "@/lib/pagamento/mercadopago";
import { consultarCobranca, criarCobrancaPremium, emailValido } from "@/lib/pagamento/servico";
import type { ProvedorPix } from "@/lib/pagamento/tipos";
import { centavosParaDecimal } from "@/lib/pagamento/tipos";
import { fetchFalso } from "./auxiliares";

const ORDER_CRIADA = {
  id: "ORD01ABC",
  status: "action_required",
  transactions: {
    payments: [
      {
        id: "PAY01XYZ",
        status: "action_required",
        status_detail: "waiting_transfer",
        payment_method: { qr_code: "00020126PIXREAL", qr_code_base64: "iVBORw0KGgo=" },
      },
    ],
  },
};

const comStatus = (status: string) => ({ id: "ORD01ABC", transactions: { payments: [{ status }] } });

describe("ProvedorMercadoPago", () => {
  const criar = (fn: typeof fetch) =>
    new ProvedorMercadoPago({ accessToken: "TOKEN", fetch: fn, agora: () => 0, gerarId: () => "idem-1" });

  it("monta a order Pix no formato da API Orders", async () => {
    const { fn, chamadas } = fetchFalso(200, ORDER_CRIADA);
    await criar(fn).criarCobranca({
      valorCentavos: 490,
      email: "a@b.com",
      descricao: "d",
      referencia: "ref-1",
    });

    const { url, init } = chamadas[0];
    const headers = init?.headers as Record<string, string>;
    const corpo = JSON.parse(String(init?.body));
    expect(url).toBe("https://api.mercadopago.com/v1/orders");
    expect(init?.method).toBe("POST");
    expect(headers.Authorization).toBe("Bearer TOKEN");
    expect(headers["X-Idempotency-Key"]).toBe("idem-1");
    expect(corpo).toMatchObject({
      type: "online",
      processing_mode: "automatic",
      total_amount: "4.90",
      external_reference: "ref-1",
      payer: { email: "a@b.com" },
    });
    expect(corpo.transactions.payments[0]).toEqual({
      amount: "4.90",
      payment_method: { id: "pix", type: "bank_transfer" },
      expiration_time: "PT30M",
    });
    // Em modo automático, a order não pode ter expiration_time própria.
    expect(corpo).not.toHaveProperty("expiration_time");
  });

  it("devolve id, copia e cola, QR e validade de 30 minutos", async () => {
    const { fn } = fetchFalso(200, ORDER_CRIADA);
    const cobranca = await criar(fn).criarCobranca({
      valorCentavos: 490,
      email: "a@b.com",
      descricao: "d",
      referencia: "r",
    });
    expect(cobranca).toEqual({
      id: "ORD01ABC",
      status: "pendente",
      copiaECola: "00020126PIXREAL",
      qrCodeBase64: "iVBORw0KGgo=",
      expiraEm: new Date(30 * 60_000).toISOString(),
      valorCentavos: 490,
    });
  });

  it("falha com erro claro se a API não devolver o código Pix", async () => {
    const { fn } = fetchFalso(200, { id: "ORD1", transactions: { payments: [{}] } });
    await expect(
      criar(fn).criarCobranca({ valorCentavos: 490, email: "a@b.com", descricao: "d", referencia: "r" }),
    ).rejects.toThrow(/código Pix/);
  });

  it("propaga erro HTTP com o status", async () => {
    const { fn } = fetchFalso(401, { message: "invalid token" });
    await expect(criar(fn).consultarStatus("ORD1")).rejects.toThrow(/401/);
  });

  it("consulta o status pelo id da order", async () => {
    const { fn, chamadas } = fetchFalso(200, comStatus("processed"));
    expect(await criar(fn).consultarStatus("ORD01ABC")).toBe("pago");
    expect(chamadas[0].url).toBe("https://api.mercadopago.com/v1/orders/ORD01ABC");
    expect(chamadas[0].init?.method).toBe("GET");
  });
});

describe("traduzirStatus", () => {
  it.each([
    ["processed", "pago"],
    ["action_required", "pendente"],
    ["created", "pendente"],
    ["processing", "pendente"],
    ["in_review", "pendente"],
    ["expired", "expirado"],
    ["canceled", "cancelado"],
    ["refunded", "cancelado"],
    ["charged_back", "cancelado"],
    ["failed", "falhou"],
  ])("%s → %s", (status, esperado) => {
    expect(traduzirStatus(comStatus(status))).toBe(esperado);
  });

  it("usa o status da order quando o pagamento não traz status", () => {
    expect(traduzirStatus({ status: "processed" })).toBe("pago");
  });
});

describe("ProvedorPixDemo", () => {
  it("aprova sozinho depois do tempo configurado", async () => {
    let agora = 1_000_000_000_000;
    const demo = new ProvedorPixDemo({ aprovaEmMs: 5000, agora: () => agora });
    const cobranca = await demo.criarCobranca({
      valorCentavos: 490,
      email: "a@b.com",
      descricao: "d",
      referencia: "r",
    });
    expect(cobranca.demo).toBe(true);
    expect(await demo.consultarStatus(cobranca.id)).toBe("pendente");
    agora += 5000;
    expect(await demo.consultarStatus(cobranca.id)).toBe("pago");
  });

  it("não aceita ids inventados", async () => {
    expect(await new ProvedorPixDemo().consultarStatus("ORD01ABC")).toBe("falhou");
  });
});

describe("criarProvedorPix (factory)", () => {
  it("usa o demo sem token e o Mercado Pago com token", () => {
    expect(criarProvedorPix(lerConfigServidor({} as NodeJS.ProcessEnv))).toBeInstanceOf(ProvedorPixDemo);
    const comToken = { MERCADOPAGO_ACCESS_TOKEN: "APP_USR-x" } as unknown as NodeJS.ProcessEnv;
    expect(criarProvedorPix(lerConfigServidor(comToken))).toBeInstanceOf(ProvedorMercadoPago);
  });

  it("PIX_DEMO=1 força o demo mesmo com token", () => {
    const env = { MERCADOPAGO_ACCESS_TOKEN: "APP_USR-x", PIX_DEMO: "1" } as unknown as NodeJS.ProcessEnv;
    expect(criarProvedorPix(lerConfigServidor(env))).toBeInstanceOf(ProvedorPixDemo);
  });

  it("preço padrão é R$ 4,90 e pode ser trocado pela variável", () => {
    expect(lerConfigServidor({} as NodeJS.ProcessEnv).pagamento.precoPremiumCentavos).toBe(490);
    const env = { PRECO_PREMIUM_CENTAVOS: "990" } as unknown as NodeJS.ProcessEnv;
    expect(lerConfigServidor(env).pagamento.precoPremiumCentavos).toBe(990);
  });
});

describe("criarCobrancaPremium (caso de uso)", () => {
  const provedorOk = (): ProvedorPix => ({
    criarCobranca: vi.fn(async (p) => ({
      id: "ORD1",
      status: "pendente" as const,
      copiaECola: "pix",
      qrCodeBase64: "",
      expiraEm: "2026-10-27T17:00:00.000Z",
      valorCentavos: p.valorCentavos,
    })),
    consultarStatus: vi.fn(async () => "pendente" as const),
  });
  const limitadorLivre = () =>
    new LimitadorDeUso(new ContadorEmMemoria(), { limitePorIp: 2, limiteGlobal: 100 });

  it("cria a cobrança com o preço do servidor (o cliente não escolhe o valor)", async () => {
    const provedor = provedorOk();
    const r = await criarCobrancaPremium({ email: " Pessoa@Exemplo.com ", valorCentavos: 1 }, "ip", {
      provedor,
      limitador: limitadorLivre(),
      precoCentavos: 490,
      gerarReferencia: () => "ref",
    });
    expect(r.status).toBe(200);
    expect(provedor.criarCobranca).toHaveBeenCalledWith(
      expect.objectContaining({ valorCentavos: 490, email: "pessoa@exemplo.com", referencia: "ref" }),
    );
  });

  it("recusa e-mail inválido sem chamar o provedor", async () => {
    const provedor = provedorOk();
    const r = await criarCobrancaPremium({ email: "nao-e-email" }, "ip", {
      provedor,
      limitador: limitadorLivre(),
      precoCentavos: 490,
    });
    expect(r.status).toBe(400);
    expect(provedor.criarCobranca).not.toHaveBeenCalled();
  });

  it("limita tentativas por IP", async () => {
    const deps = { provedor: provedorOk(), limitador: limitadorLivre(), precoCentavos: 490 };
    await criarCobrancaPremium({ email: "a@b.com" }, "ip", deps);
    await criarCobrancaPremium({ email: "a@b.com" }, "ip", deps);
    expect((await criarCobrancaPremium({ email: "a@b.com" }, "ip", deps)).status).toBe(429);
  });

  it("falha do provedor devolve a cota e responde 502", async () => {
    const limitador = limitadorLivre();
    const quebrado: ProvedorPix = {
      criarCobranca: async () => {
        throw new Error("MP fora");
      },
      consultarStatus: async () => "pendente",
    };
    const deps = { provedor: quebrado, limitador, precoCentavos: 490, registrarErro: () => {} };
    expect((await criarCobrancaPremium({ email: "a@b.com" }, "ip", deps)).status).toBe(502);
    expect((await criarCobrancaPremium({ email: "a@b.com" }, "ip", deps)).status).toBe(502);
    // As duas falhas não gastaram cota: ainda há 2 tentativas.
    const ok = { ...deps, provedor: provedorOk() };
    expect((await criarCobrancaPremium({ email: "a@b.com" }, "ip", ok)).status).toBe(200);
    expect((await criarCobrancaPremium({ email: "a@b.com" }, "ip", ok)).status).toBe(200);
  });
});

describe("consultarCobranca (caso de uso)", () => {
  it("recusa ids com caracteres estranhos", async () => {
    const provedor = { criarCobranca: vi.fn(), consultarStatus: vi.fn() } as unknown as ProvedorPix;
    expect((await consultarCobranca("../../etc", { provedor })).status).toBe(400);
    expect(provedor.consultarStatus).not.toHaveBeenCalled();
  });

  it("falha temporária responde 'pendente' para a tela continuar consultando", async () => {
    const provedor: ProvedorPix = {
      criarCobranca: vi.fn(),
      consultarStatus: async () => {
        throw new Error("timeout");
      },
    };
    expect(await consultarCobranca("ORD1", { provedor, registrarErro: () => {} })).toEqual({
      status: 200,
      corpo: { status: "pendente" },
    });
  });
});

describe("utilitários", () => {
  it("centavosParaDecimal", () => {
    expect(centavosParaDecimal(490)).toBe("4.90");
    expect(centavosParaDecimal(1000)).toBe("10.00");
  });

  it("emailValido", () => {
    expect(emailValido("a@b.com")).toBe(true);
    expect(emailValido("a@b")).toBe(false);
    expect(emailValido("a b@c.com")).toBe(false);
    expect(emailValido(123)).toBe(false);
  });

  it("limitador do Pix usa contadores separados dos da análise", async () => {
    const contador = new ContadorEmMemoria();
    const analise = new LimitadorDeUso(contador, { limitePorIp: 1, limiteGlobal: 10 });
    const pix = new LimitadorDeUso(contador, { limitePorIp: 1, limiteGlobal: 10, prefixo: "pix:" });
    expect((await analise.reservar("ip")).permitido).toBe(true);
    expect((await pix.reservar("ip")).permitido).toBe(true);
  });
});
