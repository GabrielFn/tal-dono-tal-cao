// Caso de uso "analisar fotos": orquestra validação, limite de uso e IA.
// Não conhece Next.js nem HTTP de verdade, por isso é fácil de testar.
import type { LimitadorDeUso, Reserva } from "@/lib/limite";
import type { RespostaErro, Resultado } from "@/lib/tipos";
import type { AnalisadorDeFotos } from "./tipos";
import { lerImagemDataUrl } from "./validacao";

export type Dependencias = {
  analisador: AnalisadorDeFotos;
  limitador: Pick<LimitadorDeUso, "reservar">;
  registrarErro?: (erro: unknown) => void;
};

export type RespostaServico = { status: number; corpo: Resultado | RespostaErro };

function erro(status: number, codigo: string, mensagem: string): RespostaServico {
  return { status, corpo: { erro: mensagem, codigo } };
}

export const ERROS = {
  corpoInvalido: () => erro(400, "corpo_invalido", "Requisição inválida."),
  imagemInvalida: () => erro(400, "imagem_invalida", "Envie duas fotos válidas (JPG, PNG ou WEBP)."),
  limiteIp: () => erro(429, "limite_ip", "Você já usou todas as análises grátis de hoje. Volta amanhã!"),
  limiteGlobal: () => erro(503, "limite_global", "Muita gente testando agora! Tenta de novo daqui a pouco."),
  falhaIa: () => erro(502, "falha_ia", "Nosso juiz canino tropeçou. Tenta de novo em instantes."),
} as const;

export async function analisarFotos(
  corpo: unknown,
  ip: string,
  { analisador, limitador, registrarErro = console.error }: Dependencias,
): Promise<RespostaServico> {
  if (typeof corpo !== "object" || corpo === null) return ERROS.corpoInvalido();

  const { pessoa, cachorro } = corpo as Record<string, unknown>;
  const fotoPessoa = lerImagemDataUrl(pessoa);
  const fotoCachorro = lerImagemDataUrl(cachorro);
  if (!fotoPessoa || !fotoCachorro) return ERROS.imagemInvalida();

  let reserva: Reserva | undefined;
  if (analisador.consomeCota) {
    const resultadoLimite = await limitador.reservar(ip);
    if (!resultadoLimite.permitido) {
      return resultadoLimite.motivo === "ip" ? ERROS.limiteIp() : ERROS.limiteGlobal();
    }
    reserva = resultadoLimite;
  }

  try {
    const resultado = await analisador.analisar(fotoPessoa, fotoCachorro);
    return { status: 200, corpo: resultado };
  } catch (falha) {
    // A falha foi nossa (ou da IA), não do usuário: a tentativa não conta.
    await reserva?.devolver();
    registrarErro(falha);
    return ERROS.falhaIa();
  }
}
