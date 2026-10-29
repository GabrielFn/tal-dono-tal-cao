// Camada anticorrupção: transforma a resposta "crua" da IA num Resultado confiável.
import type { Categoria, MotivoInvalido, Resultado, ResultadoValido } from "@/lib/tipos";

export const NOMES_CATEGORIAS = ["Olhar", "Cabelo x pelo", "Expressão", "Pose e postura", "Vibe"] as const;

const MOTIVOS_VALIDOS: readonly MotivoInvalido[] = ["sem_pessoa", "sem_animal", "foto_ruim", "outro"];
/** Nome antigo do motivo, aceito para não quebrar se a IA ainda usar. */
const MOTIVOS_LEGADOS: Record<string, MotivoInvalido> = { sem_cachorro: "sem_animal" };

export const MENSAGENS_PADRAO: Record<MotivoInvalido, string> = {
  sem_pessoa: "Não encontramos um rosto humano. Manda uma selfie com o rosto bem visível!",
  sem_animal: "Cadê o pet? Precisamos de uma foto do seu bicho (cachorro, gato, o que for).",
  foto_ruim: "A foto ficou escura ou borrada. Tenta outra com mais luz e o rosto de frente.",
  outro: "Não conseguimos analisar essas fotos. Tenta com outras.",
};

const TAMANHO_MAXIMO = {
  mensagem: 200,
  titulo: 50,
  veredito: 320,
  detalheSecreto: 160,
  fraseCard: 90,
  raca: 50,
  comentario: 120,
  especie: 30,
  plotTwist: 180,
  som: 10,
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
  if (MOTIVOS_VALIDOS.includes(valor as MotivoInvalido)) return valor as MotivoInvalido;
  return MOTIVOS_LEGADOS[String(valor)] ?? "outro";
}

/** Bichos "de casa": não ganham plot twist e têm som fixo. Chave = espécie normalizada. */
const BICHOS_COMUNS: Record<string, { especie: string; som: string }> = {
  cachorro: { especie: "cachorro", som: "AU-AU" },
  cachorra: { especie: "cachorro", som: "AU-AU" },
  cao: { especie: "cachorro", som: "AU-AU" },
  cadela: { especie: "cachorro", som: "AU-AU" },
  dog: { especie: "cachorro", som: "AU-AU" },
  gato: { especie: "gato", som: "MIAU" },
  gata: { especie: "gato", som: "MIAU" },
  gatinho: { especie: "gato", som: "MIAU" },
  felino: { especie: "gato", som: "MIAU" },
};

/** "Cão" → "cao", " GATA " → "gata". */
function chaveDeEspecie(especie: string): string {
  return especie
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

/** Onomatopeia curta e segura para desenhar no card: maiúsculas, letras, hífen, ponto e espaço. */
function lerSom(valor: unknown): string {
  return textoLimpo(valor, 40)
    .toLocaleUpperCase("pt-BR")
    .replace(/[^\p{L}\-. ]/gu, "")
    .trim()
    .slice(0, TAMANHO_MAXIMO.som)
    .trim();
}

/** A tela já mostra o selo "Plot twist!"; tira a repetição se a IA começar a frase com ele. */
function semPrefixoPlotTwist(texto: string): string {
  const semPrefixo = texto.replace(/^plot[\s-]*twist\s*[:!.\-–—]*\s*/i, "");
  return semPrefixo.charAt(0).toLocaleUpperCase("pt-BR") + semPrefixo.slice(1);
}

type DadosDoAnimal = Pick<ResultadoValido, "inusitado" | "especie" | "somDoAnimal" | "plotTwist">;

/**
 * Cachorro e gato são o normal do app. Qualquer outro bicho é "inusitado" e ganha plot twist.
 * A decisão é nossa (pela espécie), não da IA, para ficar sempre consistente.
 */
function lerAnimal(bruto: Record<string, unknown>): DadosDoAnimal {
  // Respostas antigas (sem espécie) eram sempre de cachorro.
  const especieBruta =
    textoLimpo(bruto.especie, TAMANHO_MAXIMO.especie).toLocaleLowerCase("pt-BR") || "cachorro";
  const comum = BICHOS_COMUNS[chaveDeEspecie(especieBruta)];
  if (comum) {
    return { inusitado: false, especie: comum.especie, somDoAnimal: comum.som, plotTwist: "" };
  }
  return {
    inusitado: true,
    especie: especieBruta,
    somDoAnimal: lerSom(bruto.somDoAnimal) || "???",
    plotTwist:
      semPrefixoPlotTwist(textoLimpo(bruto.plotTwist, TAMANHO_MAXIMO.plotTwist)) ||
      `Espécie detectada: ${especieBruta}. O júri não estava preparado, mas avaliou mesmo assim.`,
  };
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
    detalheSecreto: textoLimpo(bruto.detalheSecreto, TAMANHO_MAXIMO.detalheSecreto),
    fraseCard: textoLimpo(bruto.fraseCard, TAMANHO_MAXIMO.fraseCard),
    racaProvavel: textoLimpo(bruto.racaProvavel, TAMANHO_MAXIMO.raca) || "Bicho de respeito",
    categorias,
    ...lerAnimal(bruto),
  };
}
