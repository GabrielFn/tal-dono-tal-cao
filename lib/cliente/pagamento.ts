// Cliente HTTP das rotas de pagamento e regras puras do fluxo de compra (testáveis sem React).
import type { CobrancaPublica, RespostaErro, RespostaStatusCobranca, StatusCobranca } from "@/lib/tipos";

// ---------- HTTP ----------

export type RespostaCriarPix = { ok: true; cobranca: CobrancaPublica } | { ok: false; mensagem: string };

export async function criarPix(email: string, fetchFn: typeof fetch = fetch): Promise<RespostaCriarPix> {
  try {
    const resposta = await fetchFn("/api/pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const dados = (await resposta.json()) as CobrancaPublica | RespostaErro;
    if ("erro" in dados) return { ok: false, mensagem: dados.erro };
    if (!resposta.ok || !dados.id)
      return { ok: false, mensagem: "Não conseguimos gerar o Pix. Tenta de novo." };
    return { ok: true, cobranca: dados };
  } catch {
    return { ok: false, mensagem: "Sem conexão. Confere a internet e tenta de novo." };
  }
}

/** Devolve o status, ou null se não deu para consultar agora (tenta de novo depois). */
export async function consultarPix(
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<StatusCobranca | null> {
  try {
    const resposta = await fetchFn(`/api/pagamento/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!resposta.ok) return null;
    return ((await resposta.json()) as RespostaStatusCobranca).status ?? null;
  } catch {
    return null;
  }
}

// ---------- Máquina de estados da compra ----------

export type EtapaPremium = "oferta" | "email" | "gerando" | "aguardando" | "pago" | "expirado";

export type EstadoPremium = {
  etapa: EtapaPremium;
  cobranca: CobrancaPublica | null;
  erro: string | null;
};

export type AcaoPremium =
  | { tipo: "abrir" }
  | { tipo: "voltar" }
  | { tipo: "gerando" }
  | { tipo: "pix_criado"; cobranca: CobrancaPublica }
  | { tipo: "pix_falhou"; mensagem: string }
  | { tipo: "status"; status: StatusCobranca }
  | { tipo: "restaurar"; estado: EstadoPremium };

export const PREMIUM_INICIAL: EstadoPremium = { etapa: "oferta", cobranca: null, erro: null };

export function reducerPremium(estado: EstadoPremium, acao: AcaoPremium): EstadoPremium {
  switch (acao.tipo) {
    case "abrir":
      return estado.etapa === "pago" ? estado : { ...estado, etapa: "email", erro: null };
    case "voltar":
      return estado.etapa === "pago" ? estado : PREMIUM_INICIAL;
    case "gerando":
      return { ...estado, etapa: "gerando", erro: null };
    case "pix_criado":
      return { etapa: "aguardando", cobranca: acao.cobranca, erro: null };
    case "pix_falhou":
      return { ...estado, etapa: "email", erro: acao.mensagem };
    case "status":
      if (estado.etapa !== "aguardando") return estado;
      if (acao.status === "pago") return { ...estado, etapa: "pago", erro: null };
      if (acao.status === "expirado") return { ...estado, etapa: "expirado" };
      if (acao.status === "cancelado" || acao.status === "falhou") {
        return {
          ...PREMIUM_INICIAL,
          etapa: "email",
          erro: "O pagamento não foi concluído. Gera um Pix novo.",
        };
      }
      return estado;
    case "restaurar":
      // "gerando" não sobrevive a um recarregamento: volta para o e-mail.
      return acao.estado.etapa === "gerando" ? { ...acao.estado, etapa: "email" } : acao.estado;
  }
}

export function pixVencido(cobranca: CobrancaPublica, agora = Date.now()): boolean {
  return new Date(cobranca.expiraEm).getTime() <= agora;
}

/** "29:41" — tempo restante até o Pix vencer. */
export function tempoRestante(cobranca: CobrancaPublica, agora = Date.now()): string {
  const segundos = Math.max(0, Math.floor((new Date(cobranca.expiraEm).getTime() - agora) / 1000));
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

export function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PADRAO_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
export const emailPareceValido = (email: string) => PADRAO_EMAIL.test(email.trim());
