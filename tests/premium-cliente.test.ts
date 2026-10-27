import { describe, expect, it } from "vitest";
import { dataPorExtenso, numeroCertificado } from "@/lib/cliente/certificado";
import { resultadoSalvoValido } from "@/lib/cliente/estado";
import {
  consultarPix,
  criarPix,
  emailPareceValido,
  formatarPreco,
  pixVencido,
  PREMIUM_INICIAL,
  reducerPremium,
  tempoRestante,
  type EstadoPremium,
} from "@/lib/cliente/pagamento";
import { animacaoNoTempo, DURACAO_VIDEO_S } from "@/lib/cliente/video";
import type { CobrancaPublica } from "@/lib/tipos";
import { fetchFalso } from "./auxiliares";

const COBRANCA: CobrancaPublica = {
  id: "ORD1",
  copiaECola: "pix",
  qrCodeBase64: "",
  expiraEm: "2026-10-27T17:30:00.000Z",
  valorCentavos: 490,
};
const aguardando: EstadoPremium = { etapa: "aguardando", cobranca: COBRANCA, erro: null };

describe("reducerPremium", () => {
  it("oferta → e-mail → gerando → aguardando → pago", () => {
    let e = reducerPremium(PREMIUM_INICIAL, { tipo: "abrir" });
    expect(e.etapa).toBe("email");
    e = reducerPremium(e, { tipo: "gerando" });
    expect(e.etapa).toBe("gerando");
    e = reducerPremium(e, { tipo: "pix_criado", cobranca: COBRANCA });
    expect(e).toEqual(aguardando);
    const antes = e;
    e = reducerPremium(e, { tipo: "status", status: "pendente" });
    expect(e).toBe(antes); // "pendente" não muda nada (mesma referência, sem re-render)
    e = reducerPremium(e, { tipo: "status", status: "pago" });
    expect(e.etapa).toBe("pago");
  });

  it("depois de pago, nada tira o acesso", () => {
    const pago = reducerPremium(aguardando, { tipo: "status", status: "pago" });
    expect(reducerPremium(pago, { tipo: "voltar" })).toBe(pago);
    expect(reducerPremium(pago, { tipo: "abrir" })).toBe(pago);
    expect(reducerPremium(pago, { tipo: "status", status: "expirado" })).toBe(pago);
  });

  it("Pix vencido mostra a tela de vencido", () => {
    expect(reducerPremium(aguardando, { tipo: "status", status: "expirado" }).etapa).toBe("expirado");
  });

  it("cancelado ou falhou volta para o e-mail com aviso", () => {
    const e = reducerPremium(aguardando, { tipo: "status", status: "cancelado" });
    expect(e.etapa).toBe("email");
    expect(e.erro).toMatch(/não foi concluído/);
  });

  it("erro ao gerar Pix volta para o e-mail com a mensagem", () => {
    const e = reducerPremium(
      { ...PREMIUM_INICIAL, etapa: "gerando" },
      { tipo: "pix_falhou", mensagem: "ops" },
    );
    expect(e).toMatchObject({ etapa: "email", erro: "ops" });
  });

  it("restaurar no meio da geração volta para o e-mail (a requisição se perdeu)", () => {
    const e = reducerPremium(PREMIUM_INICIAL, {
      tipo: "restaurar",
      estado: { ...PREMIUM_INICIAL, etapa: "gerando" },
    });
    expect(e.etapa).toBe("email");
  });
});

describe("tempo do Pix", () => {
  const vence = new Date(COBRANCA.expiraEm).getTime();
  it("tempoRestante formata mm:ss e não fica negativo", () => {
    expect(tempoRestante(COBRANCA, vence - 90_500)).toBe("1:30");
    expect(tempoRestante(COBRANCA, vence + 5000)).toBe("0:00");
  });
  it("pixVencido", () => {
    expect(pixVencido(COBRANCA, vence - 1)).toBe(false);
    expect(pixVencido(COBRANCA, vence)).toBe(true);
  });
});

describe("cliente HTTP do Pix", () => {
  it("criarPix devolve a cobrança", async () => {
    const { fn, chamadas } = fetchFalso(200, COBRANCA);
    expect(await criarPix("a@b.com", fn)).toEqual({ ok: true, cobranca: COBRANCA });
    expect(JSON.parse(String(chamadas[0].init?.body))).toEqual({ email: "a@b.com" });
  });

  it("criarPix repassa a mensagem de erro da API", async () => {
    const { fn } = fetchFalso(429, { erro: "Muitas tentativas", codigo: "limite_pix" });
    expect(await criarPix("a@b.com", fn)).toEqual({ ok: false, mensagem: "Muitas tentativas" });
  });

  it("consultarPix devolve null quando não dá para consultar", async () => {
    const { fn } = fetchFalso(500, "erro");
    expect(await consultarPix("ORD1", fn)).toBeNull();
    const { fn: ok } = fetchFalso(200, { status: "pago" });
    expect(await consultarPix("ORD1", ok)).toBe("pago");
  });
});

describe("formatação", () => {
  it("preço em reais", () => {
    expect(formatarPreco(490).replace(/\s/g, " ")).toBe("R$ 4,90");
  });
  it("e-mail", () => {
    expect(emailPareceValido(" a@b.com ")).toBe(true);
    expect(emailPareceValido("a@b")).toBe(false);
  });
  it("número do certificado é estável e tem 6 dígitos", () => {
    expect(numeroCertificado("ORD1")).toBe(numeroCertificado("ORD1"));
    expect(numeroCertificado("ORD1")).toMatch(/^TDTP-\d{6}$/);
    expect(numeroCertificado("ORD1")).not.toBe(numeroCertificado("ORD2"));
  });
  it("data por extenso", () => {
    expect(dataPorExtenso(new Date(2026, 9, 27))).toBe("27 de outubro de 2026");
  });
});

describe("animação do vídeo", () => {
  it("começa vazio e termina com a cena completa", () => {
    const inicio = animacaoNoTempo(0, false);
    expect(inicio.fotos).toBe(0);
    expect(inicio.nota).toBe(0);
    const fim = animacaoNoTempo(DURACAO_VIDEO_S, true);
    for (const valor of Object.values(fim)) expect(valor).toBeCloseTo(1, 5);
  });

  it("selo do plot twist só aparece para bicho inusitado, e 'carimba' (começa grande)", () => {
    expect(animacaoNoTempo(3.5, false).plotTwist).toBe(0);
    expect(animacaoNoTempo(3.41, true).plotTwist).toBeGreaterThan(2);
    expect(animacaoNoTempo(5, true).plotTwist).toBeCloseTo(1, 5);
  });

  it("a nota sobe sem passar do valor final", () => {
    let anterior = 0;
    for (let t = 1.4; t <= 3.3; t += 0.1) {
      const atual = animacaoNoTempo(t, false).nota;
      expect(atual).toBeGreaterThanOrEqual(anterior);
      expect(atual).toBeLessThanOrEqual(1);
      anterior = atual;
    }
  });
});

describe("resultado salvo na sessão", () => {
  const ok = {
    resultado: { valido: true, nota: 80 },
    fotos: { pessoa: "data:image/jpeg;base64,AA", pet: "data:image/jpeg;base64,BB" },
  };
  it("aceita um resultado completo", () => {
    expect(resultadoSalvoValido(ok)).toBe(true);
  });
  it("recusa lixo ou dados adulterados", () => {
    expect(resultadoSalvoValido(null)).toBe(false);
    expect(resultadoSalvoValido({ ...ok, fotos: { pessoa: "javascript:alert(1)", pet: "x" } })).toBe(false);
    expect(resultadoSalvoValido({ ...ok, resultado: { valido: false } })).toBe(false);
  });
});
