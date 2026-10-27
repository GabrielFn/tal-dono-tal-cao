// POST /api/analisar  — recebe as duas fotos (base64) e devolve o resultado.
// As fotos ficam só na memória durante a requisição: nada é salvo em disco ou banco.
import { NextResponse } from "next/server";
import { resultadoDemo } from "@/lib/demo";
import { analisarComIA, ErroIA, type ImagemBase64 } from "@/lib/ia";
import { verificarLimite } from "@/lib/limite";
import type { RespostaErro } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
const TAMANHO_MAX_BYTES = 2.5 * 1024 * 1024; // por imagem, depois de decodificada

function erro(status: number, codigo: string, mensagem: string) {
  return NextResponse.json<RespostaErro>({ erro: mensagem, codigo }, { status });
}

function lerDataUrl(valor: unknown): ImagemBase64 | null {
  if (typeof valor !== "string") return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(valor);
  if (!m) return null;
  const tipo = m[1] as ImagemBase64["tipo"];
  if (!TIPOS_ACEITOS.includes(tipo)) return null;
  const bytes = Math.floor((m[2].length * 3) / 4);
  if (bytes > TAMANHO_MAX_BYTES || bytes < 2000) return null;
  return { tipo, dados: m[2] };
}

function obterIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "desconhecido").trim();
}

export async function POST(req: Request) {
  let corpo: { pessoa?: unknown; cachorro?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "corpo_invalido", "Requisição inválida.");
  }

  const pessoa = lerDataUrl(corpo.pessoa);
  const cachorro = lerDataUrl(corpo.cachorro);
  if (!pessoa || !cachorro) {
    return erro(400, "imagem_invalida", "Envie duas fotos válidas (JPG, PNG ou WEBP).");
  }

  const modoDemo = process.env.DEMO_MODE === "1" || !process.env.ANTHROPIC_API_KEY;
  if (modoDemo) {
    await new Promise((r) => setTimeout(r, 1800)); // simula o tempo da IA
    return NextResponse.json(resultadoDemo());
  }

  const limite = await verificarLimite(obterIp(req));
  if (!limite.permitido) {
    return limite.motivo === "ip"
      ? erro(429, "limite_ip", "Você já usou todas as análises grátis de hoje. Volta amanhã!")
      : erro(503, "limite_global", "Muita gente testando agora! Tenta de novo daqui a pouco.");
  }

  try {
    const resultado = await analisarComIA(pessoa, cachorro);
    return NextResponse.json(resultado);
  } catch (e) {
    console.error("[analisar] Falha na IA:", e instanceof ErroIA ? e.message : e);
    return erro(502, "falha_ia", "Nosso juiz canino tropeçou. Tenta de novo em instantes.");
  }
}
