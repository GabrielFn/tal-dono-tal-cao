// Configuração que pode ir para o navegador.
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next.js embuti-las no build.

const SITE_PADRAO = "https://tal-dono-tal-pet.vercel.app";
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
 * Endereço público do site: NEXT_PUBLIC_SITE_URL (quando houver domínio próprio) ou o padrão.
 * Não usamos o domínio que a Vercel informa automaticamente: com mais de um domínio no projeto,
 * ela pode apontar para o antigo (aconteceu na troca de tal-dono-tal-cao para tal-dono-tal-pet).
 */
export function resolverSiteUrl(siteUrl: string | undefined, padrao = SITE_PADRAO): string {
  return urlSemBarraFinal(comProtocolo(siteUrl), padrao);
}

export const configPublica = {
  siteUrl: resolverSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  contatoEmail: process.env.NEXT_PUBLIC_CONTATO_EMAIL?.trim() || EMAIL_PADRAO,
} as const;

/** Domínio sem protocolo, ex.: "tal-dono-tal-pet.vercel.app". */
export const dominioDoSite = configPublica.siteUrl.replace(/^https?:\/\//, "");
