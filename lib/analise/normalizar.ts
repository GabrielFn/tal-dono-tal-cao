// Camada anticorrupção: transforma a resposta "crua" da IA num Resultado confiável.
import type { Categoria, MotivoInvalido, Resultado } from "@/lib/tipos";

export const NOMES_CATEGORIAS = ["Olhar", "Cabelo x pelo", "Expressão", "Pose e postura", "Vibe"] as const;

const MOTIVOS_VALIDOS: readonly MotivoInvalido[] = ["sem_pessoa", "sem_cachorro", "foto_ruim", "outro"];

export const MENSAGENS_PADRAO: Record<MotivoInvalido, string> = {
  sem_pessoa: "Não encontramos um rosto humano. Manda uma selfie com o rosto bem visível!",
  sem_cachorro: "Cadê o au-au? Precisamos de uma foto do seu cachorro.",
  foto_ruim: "A foto ficou escura ou borrada. Tenta outra com mais luz e o rosto de frente.",
  outro: "Não conseguimos analisar essas fotos. Tenta com outras.",
};

const TAMANHO_MAXIMO = {
  mensagem: 200,
  titulo: 50,
  veredito: 320,
  fraseCard: 90,
  raca: 50,
  comentario: 120,
} as const;

function porcentagem(valor: unknown): number {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

function textoLimpo(valor: unknown, maximo: number): string {
  return String(valor ?? "")
    .trim()
    .slice(0, maximo);
}

function lerMotivo(valor: unknown): MotivoInvalido {
  return MOTIVOS_VALIDOS.includes(valor as MotivoInvalido) ? (valor as MotivoInvalido) : "outro";
}

function lerCategorias(valor: unknown): Categoria[] {
  const recebidas = Array.isArray(valor) ? (valor as Record<string, unknown>[]) : [];
  return NOMES_CATEGORIAS.map((nome, indice) => {
    const porNome = recebidas.find((c) => String(c?.nome ?? "").toLowerCase() === nome.toLowerCase());
    const categoria = porNome ?? recebidas[indice] ?? {};
    return {
      nome,
      nota: porcentagem(categoria.nota),
      comentario: textoLimpo(categoria.comentario, TAMANHO_MAXIMO.comentario),
    };
  });
}

function media(categorias: Categoria[]): number {
  return Math.round(categorias.reduce((soma, c) => soma + c.nota, 0) / categorias.length);
}

export function normalizarResultado(bruto: Record<string, unknown>): Resultado {
  if (!bruto.valido) {
    const motivo = lerMotivo(bruto.motivo);
    return {
      valido: false,
      motivo,
      mensagem: textoLimpo(bruto.mensagem, TAMANHO_MAXIMO.mensagem) || MENSAGENS_PADRAO[motivo],
    };
  }

  const categorias = lerCategorias(bruto.categorias);
  return {
    valido: true,
    nota: bruto.nota === undefined ? media(categorias) : porcentagem(bruto.nota),
    titulo: textoLimpo(bruto.titulo, TAMANHO_MAXIMO.titulo) || "Dupla dinâmica",
    veredito: textoLimpo(bruto.veredito, TAMANHO_MAXIMO.veredito),
    fraseCard: textoLimpo(bruto.fraseCard, TAMANHO_MAXIMO.fraseCard),
    racaProvavel: textoLimpo(bruto.racaProvavel, TAMANHO_MAXIMO.raca) || "Cachorro de respeito",
    categorias,
  };
}
