// Cliente HTTP da rota /api/analisar. Converte todos os erros numa mensagem para o usuário.
import type { RespostaErro, Resultado, ResultadoValido } from "@/lib/tipos";

export type RespostaAnalise = { ok: true; resultado: ResultadoValido } | { ok: false; mensagem: string };

const MENSAGEM_GENERICA = "Algo deu errado. Tenta de novo.";
const MENSAGEM_CONEXAO = "Sem conexão ou o servidor demorou demais. Tenta de novo.";

export async function solicitarAnalise(
  pessoa: string,
  cachorro: string,
  fetchFn: typeof fetch = fetch,
): Promise<RespostaAnalise> {
  let resposta: Response;
  let dados: Resultado | RespostaErro;
  try {
    resposta = await fetchFn("/api/analisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pessoa, cachorro }),
    });
    dados = await resposta.json();
  } catch {
    return { ok: false, mensagem: MENSAGEM_CONEXAO };
  }

  if ("erro" in dados) return { ok: false, mensagem: dados.erro || MENSAGEM_GENERICA };
  if (!resposta.ok) return { ok: false, mensagem: MENSAGEM_GENERICA };
  if (!dados.valido) return { ok: false, mensagem: dados.mensagem };
  return { ok: true, resultado: dados };
}
