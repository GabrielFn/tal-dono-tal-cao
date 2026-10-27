// Casos de uso do premium: criar cobrança Pix e consultar se foi paga.
// Não conhecem Next.js nem o Mercado Pago, só as interfaces, por isso são testados com dublês.
import type { LimitadorDeUso, Reserva } from "@/lib/limite";
import type { CobrancaPublica, RespostaErro, RespostaStatusCobranca } from "@/lib/tipos";
import type { ProvedorPix } from "./tipos";

export type RespostaServico<T> = { status: number; corpo: T | RespostaErro };

const erro = (status: number, codigo: string, mensagem: string): RespostaServico<never> => ({
  status,
  corpo: { erro: mensagem, codigo },
});

export const ERROS_PIX = {
  corpoInvalido: () => erro(400, "corpo_invalido", "Requisição inválida."),
  emailInvalido: () => erro(400, "email_invalido", "Confere o e-mail? Ele é obrigatório para o Pix."),
  idInvalido: () => erro(400, "id_invalido", "Cobrança inválida."),
  limite: () => erro(429, "limite_pix", "Muitas tentativas de pagamento hoje. Tenta de novo amanhã."),
  falha: () => erro(502, "falha_pix", "Não conseguimos gerar o Pix agora. Tenta de novo em instantes."),
} as const;

const PADRAO_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const PADRAO_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function emailValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.length <= 254 && PADRAO_EMAIL.test(valor.trim());
}

export function idCobrancaValido(valor: unknown): valor is string {
  return typeof valor === "string" && PADRAO_ID.test(valor);
}

export type DependenciasCriar = {
  provedor: ProvedorPix;
  limitador: Pick<LimitadorDeUso, "reservar">;
  precoCentavos: number;
  gerarReferencia?: () => string;
  registrarErro?: (erro: unknown) => void;
};

export async function criarCobrancaPremium(
  corpo: unknown,
  ip: string,
  {
    provedor,
    limitador,
    precoCentavos,
    gerarReferencia = () => `tdtc-${crypto.randomUUID()}`,
    registrarErro = console.error,
  }: DependenciasCriar,
): Promise<RespostaServico<CobrancaPublica>> {
  if (typeof corpo !== "object" || corpo === null) return ERROS_PIX.corpoInvalido();
  const { email } = corpo as Record<string, unknown>;
  if (!emailValido(email)) return ERROS_PIX.emailInvalido();

  const reserva = await limitador.reservar(ip);
  if (!reserva.permitido) return ERROS_PIX.limite();

  try {
    const cobranca = await provedor.criarCobranca({
      valorCentavos: precoCentavos,
      email: email.trim().toLowerCase(),
      descricao: "Tal Dono, Tal Pet — Pacote Premium",
      referencia: gerarReferencia(),
    });
    const publica: CobrancaPublica = {
      id: cobranca.id,
      copiaECola: cobranca.copiaECola,
      qrCodeBase64: cobranca.qrCodeBase64,
      expiraEm: cobranca.expiraEm,
      valorCentavos: cobranca.valorCentavos,
      ...(cobranca.demo ? { demo: true } : {}),
    };
    return { status: 200, corpo: publica };
  } catch (falha) {
    await (reserva as Reserva).devolver();
    registrarErro(falha);
    return ERROS_PIX.falha();
  }
}

export async function consultarCobranca(
  id: unknown,
  {
    provedor,
    registrarErro = console.error,
  }: { provedor: ProvedorPix; registrarErro?: (e: unknown) => void },
): Promise<RespostaServico<RespostaStatusCobranca>> {
  if (!idCobrancaValido(id)) return ERROS_PIX.idInvalido();
  try {
    return { status: 200, corpo: { status: await provedor.consultarStatus(id) } };
  } catch (falha) {
    registrarErro(falha);
    // Falha temporária: o cliente continua consultando.
    return { status: 200, corpo: { status: "pendente" } };
  }
}
