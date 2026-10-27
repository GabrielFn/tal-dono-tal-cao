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

/** Baixa um Blob com o nome dado (cria e libera a URL temporária). */
export function baixarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  baixarArquivo(url, nome);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ResultadoCompartilhar = "compartilhado" | "cancelado" | "baixado";

/**
 * Abre o menu de compartilhar do celular com o arquivo. Se o aparelho não suportar,
 * baixa o arquivo. Devolve o que aconteceu.
 */
export async function compartilharArquivo(
  blob: Blob,
  nome: string,
  texto: string,
): Promise<ResultadoCompartilhar> {
  const arquivo = new File([blob], nome, { type: blob.type || "application/octet-stream" });

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: texto });
      return "compartilhado";
    } catch (erro) {
      if ((erro as Error).name === "AbortError") return "cancelado";
      // Qualquer outra falha: cai para o download.
    }
  }

  baixarBlob(blob, nome);
  return "baixado";
}

/** Atalho para o card (mantém o nome de arquivo padrão). */
export function compartilharImagem(blob: Blob, texto: string): Promise<ResultadoCompartilhar> {
  return compartilharArquivo(blob, NOME_ARQUIVO_CARD, texto);
}
