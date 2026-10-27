// Limite de uso diário, para ninguém esvaziar o seu orçamento de API.
// Com Upstash configurado, o limite vale para todas as instâncias da Vercel.
// Sem Upstash, usa memória local (bom para testar; em produção cada instância conta separado).

const memoria = new Map<string, { contagem: number; expiraEm: number }>();
const UM_DIA_SEGUNDOS = 60 * 60 * 24;

function chaveDoDia(prefixo: string) {
  // Dia no fuso de Brasília, para o limite "virar" à meia-noite daqui.
  const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `tdtc:${prefixo}:${hoje}`;
}

async function incrementarUpstash(chave: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const resp = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", chave],
      ["EXPIRE", chave, String(UM_DIA_SEGUNDOS + 3600), "NX"],
    ]),
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`Upstash respondeu ${resp.status}`);
  const dados = (await resp.json()) as Array<{ result?: number; error?: string }>;
  if (dados[0]?.error) throw new Error(dados[0].error);
  return Number(dados[0]?.result ?? 0);
}

function incrementarMemoria(chave: string): number {
  const agora = Date.now();
  const atual = memoria.get(chave);
  if (!atual || atual.expiraEm < agora) {
    memoria.set(chave, { contagem: 1, expiraEm: agora + UM_DIA_SEGUNDOS * 1000 });
    return 1;
  }
  atual.contagem += 1;
  return atual.contagem;
}

async function incrementar(chave: string): Promise<number> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await incrementarUpstash(chave);
    } catch (e) {
      console.error("[limite] Falha no Upstash, usando memória local:", e);
    }
  }
  return incrementarMemoria(chave);
}

export type ResultadoLimite = { permitido: true } | { permitido: false; motivo: "ip" | "global" };

export async function verificarLimite(ip: string): Promise<ResultadoLimite> {
  const limiteIp = Number(process.env.LIMITE_DIARIO_POR_IP ?? 5);
  const limiteGlobal = Number(process.env.LIMITE_DIARIO_GLOBAL ?? 500);

  const usoIp = await incrementar(chaveDoDia(`ip:${ip}`));
  if (usoIp > limiteIp) return { permitido: false, motivo: "ip" };

  const usoGlobal = await incrementar(chaveDoDia("global"));
  if (usoGlobal > limiteGlobal) return { permitido: false, motivo: "global" };

  return { permitido: true };
}
