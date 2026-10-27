// GET /api/pagamento/:id — informa se a cobrança Pix já foi paga (a tela consulta a cada poucos segundos).
import { NextResponse } from "next/server";
import { lerConfigServidor } from "@/lib/config/servidor";
import { criarProvedorPix } from "@/lib/pagamento";
import { consultarCobranca } from "@/lib/pagamento/servico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, corpo } = await consultarCobranca(id, {
    provedor: criarProvedorPix(lerConfigServidor()),
    registrarErro: (erro) => console.error("[pagamento] Falha ao consultar Pix:", erro),
  });
  return NextResponse.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}
