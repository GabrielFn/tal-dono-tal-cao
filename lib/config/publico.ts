// Configuração que pode ir para o navegador.
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next.js embuti-las no build.

const SITE_PADRAO = "https://taldonotalcao.com.br";
const EMAIL_PADRAO = "contato@taldonotalcao.com.br";

function urlSemBarraFinal(valor: string | undefined, padrao: string): string {
  const url = (valor || padrao).trim().replace(/\/+$/, "");
  try {
    new URL(url);
    return url;
  } catch {
    return padrao;
  }
}

export const configPublica = {
  siteUrl: urlSemBarraFinal(process.env.NEXT_PUBLIC_SITE_URL, SITE_PADRAO),
  contatoEmail: process.env.NEXT_PUBLIC_CONTATO_EMAIL?.trim() || EMAIL_PADRAO,
} as const;

/** Domínio sem protocolo, ex.: "taldonotalcao.com.br". */
export const dominioDoSite = configPublica.siteUrl.replace(/^https?:\/\//, "");
