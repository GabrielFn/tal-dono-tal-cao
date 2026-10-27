// Configuração que pode ir para o navegador.
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next.js embuti-las no build.

const SITE_PADRAO = "https://tal-dono-tal-cao.vercel.app";
const EMAIL_PADRAO = "contato@taldonotalcao.com.br";

function comProtocolo(valor: string | undefined): string | undefined {
  const t = valor?.trim();
  if (!t) return undefined;
  return /^https?:\/\//.test(t) ? t : `https://${t}`;
}

function urlSemBarraFinal(valor: string | undefined, padrao: string): string {
  const url = (valor || padrao).trim().replace(/\/+$/, "");
  try {
    new URL(url);
    return url;
  } catch {
    return padrao;
  }
}

/**
 * Ordem de prioridade do endereço do site:
 * 1. NEXT_PUBLIC_SITE_URL (defina quando tiver domínio próprio);
 * 2. domínio de produção que a própria Vercel informa no build;
 * 3. o endereço atual na Vercel.
 */
export function resolverSiteUrl(
  siteUrl: string | undefined,
  dominioProducaoVercel: string | undefined,
  padrao = SITE_PADRAO,
): string {
  return urlSemBarraFinal(comProtocolo(siteUrl) ?? comProtocolo(dominioProducaoVercel), padrao);
}

export const configPublica = {
  siteUrl: resolverSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  ),
  contatoEmail: process.env.NEXT_PUBLIC_CONTATO_EMAIL?.trim() || EMAIL_PADRAO,
} as const;

/** Domínio sem protocolo, ex.: "tal-dono-tal-cao.vercel.app". */
export const dominioDoSite = configPublica.siteUrl.replace(/^https?:\/\//, "");
