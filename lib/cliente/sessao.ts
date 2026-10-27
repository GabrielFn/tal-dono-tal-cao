// sessionStorage com tratamento de erro: some ao fechar a aba e nunca derruba o app
// (aba anônima, armazenamento cheio ou bloqueado simplesmente não salva).
// Serve para não perder o resultado quando a pessoa vai ao app do banco pagar o Pix e volta.

export const CHAVES_SESSAO = {
  resultado: "tdtc:resultado:v1",
  premium: "tdtc:premium:v1",
} as const;

export function lerSessao<T>(chave: string): T | null {
  try {
    const bruto = window.sessionStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(chave: string, valor: unknown): void {
  try {
    window.sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou bloqueado: segue sem persistir.
  }
}

export function removerSessao(chave: string): void {
  try {
    window.sessionStorage.removeItem(chave);
  } catch {
    // ignora
  }
}
