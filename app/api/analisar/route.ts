// POST /api/analisar — adaptador HTTP do caso de uso analisarFotos.
// As fotos ficam só na memória durante a requisição: nada é salvo em disco ou banco.
import { NextResponse } from "next/server";
import { criarAnalisador } from "@/lib/analise";
import { analisarFotos, ERROS } from "@/lib/analise/servico";
import { obterIp } from "@/lib/analise/validacao";
import { lerConfigServidor } from "@/lib/config/servidor";
import { temaAtual } from "@/lib/conteudo/temporada";
import { criarLimitador } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A IA (Sonnet) pode levar até ~40 s; folga para não cortar no meio. Ver timeoutMs em lib/config/servidor.ts.
export const maxDuration = 90;

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    const { status, corpo: erro } = ERROS.corpoInvalido();
    return NextResponse.json(erro, { status });
  }

  const config = lerConfigServidor();
  const { status, corpo: resposta } = await analisarFotos(corpo, obterIp(req.headers), {
    analisador: criarAnalisador(config),
    limitador: criarLimitador(config),
    registrarErro: (erro) => console.error("[analisar] Falha na análise:", erro),
    tema: temaAtual(),
  });

  return NextResponse.json(resposta, { status });
}
