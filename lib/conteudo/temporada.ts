// Temas sazonais: ligam e desligam sozinhos pela data, sem precisar de deploy.
// Para testar fora da data: variável TEMA_FORCADO=halloween (ou "nenhum" para desligar).

export type Tema = "halloween";

type Periodo = { tema: Tema; inicio: string; fim: string }; // "MM-DD", inclusivo

const PERIODOS: Periodo[] = [{ tema: "halloween", inicio: "10-29", fim: "11-02" }];

/** Data "MM-DD" no horário de Brasília (o público do app). */
function mesDiaEmBrasilia(agora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${pegar("month")}-${pegar("day")}`;
}

export function temaDoDia(agora: Date = new Date(), forcado?: string): Tema | null {
  const f = forcado?.trim().toLowerCase();
  if (f === "nenhum") return null;
  if (f && PERIODOS.some((p) => p.tema === f)) return f as Tema;
  const hoje = mesDiaEmBrasilia(agora);
  return PERIODOS.find((p) => hoje >= p.inicio && hoje <= p.fim)?.tema ?? null;
}

/** Tema atual, respeitando a variável de ambiente TEMA_FORCADO (só no servidor). */
export function temaAtual(agora: Date = new Date()): Tema | null {
  return temaDoDia(agora, process.env.TEMA_FORCADO);
}
