import type { ResultadoValido } from "@/lib/tipos";

// Compartilhamento do card: usa o menu nativo do celular quando existe, senão baixa o arquivo.

export const NOME_ARQUIVO_CARD = "tal-dono-tal-cao.png";

export function baixarArquivo(url: string, nome = NOME_ARQUIVO_CARD): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
}

export function textoDeCompartilhamento(
  resultado: Pick<ResultadoValido, "nota" | "ehCachorro" | "especie">,
  siteUrl: string,
): string {
  // "pet" evita errar o gênero ("meu calopsita").
  const bicho = resultado.ehCachorro
    ? "meu cachorro 🐶"
    : `meu pet 🐾 (detalhe: é ${resultado.especie}, num app de cachorro 🙃)`;
  return `Deu ${resultado.nota}% de semelhança entre eu e ${bicho}. Descubra o seu: ${siteUrl}`;
}

/** Devolve "compartilhado", "cancelado" ou "baixado" (quando o aparelho não suporta compartilhar arquivos). */
export async function compartilharImagem(
  blob: Blob,
  urlObjeto: string,
  texto: string,
): Promise<"compartilhado" | "cancelado" | "baixado"> {
  const arquivo = new File([blob], NOME_ARQUIVO_CARD, { type: blob.type || "image/png" });

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: texto });
      return "compartilhado";
    } catch (erro) {
      if ((erro as Error).name === "AbortError") return "cancelado";
      // Qualquer outra falha: cai para o download.
    }
  }

  baixarArquivo(urlObjeto);
  return "baixado";
}
