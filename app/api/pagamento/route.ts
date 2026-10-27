// POST /api/pagamento — cria a cobrança Pix do pacote premium.
import { NextResponse } from "next/server";
import { obterIp } from "@/lib/analise/validacao";
import { lerConfigServidor } from "@/lib/config/servidor";
import { criarLimitadorPix } from "@/lib/limite";
import { criarProvedorPix } from "@/lib/pagamento";
import { criarCobrancaPremium, ERROS_PIX } from "@/lib/pagamento/servico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    const { status, corpo: erro } = ERROS_PIX.corpoInvalido();
    return NextResponse.json(erro, { status });
  }

  const config = lerConfigServidor();
  const { status, corpo: resposta } = await criarCobrancaPremium(corpo, obterIp(req.headers), {
    provedor: criarProvedorPix(config),
    limitador: criarLimitadorPix(config),
    precoCentavos: config.pagamento.precoPremiumCentavos,
    registrarErro: (erro) => console.error("[pagamento] Falha ao criar Pix:", erro),
  });
  return NextResponse.json(resposta, { status });
}
