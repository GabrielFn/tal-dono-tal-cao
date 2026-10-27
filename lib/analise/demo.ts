// Resultados de exemplo para o MODO DEMO (sem chave de API ou com DEMO_MODE=1).
import type { ResultadoValido } from "@/lib/tipos";
import type { AnalisadorDeFotos } from "./tipos";

const EXEMPLOS: Omit<ResultadoValido, "valido" | "demo">[] = [
  {
    nota: 87,
    titulo: "Almas gêmeas de focinho",
    veredito:
      "Mesma cabeça inclinada, mesmo olhar de 'já volto, só vou pegar um petisco'. Se trocar de lugar, ninguém percebe.",
    fraseCard: "Juntos desde sempre, iguais desde o primeiro olhar.",
    racaProvavel: "Golden Retriever",
    categorias: [
      {
        nome: "Olhar",
        nota: 92,
        comentario: "Os dois olham para a câmera como quem pede desculpa sem ter culpa.",
      },
      {
        nome: "Cabelo x pelo",
        nota: 84,
        comentario: "Volume ondulado e dourado nos dois. O shampoo é o mesmo?",
      },
      {
        nome: "Expressão",
        nota: 90,
        comentario: "Sorriso de canto idêntico, nível propaganda de margarina.",
      },
      {
        nome: "Pose e postura",
        nota: 78,
        comentario: "Cabeça levemente de lado, a pose oficial da família.",
      },
      { nome: "Vibe", nota: 91, comentario: "Energia de domingo à tarde no parque." },
    ],
  },
  {
    nota: 54,
    titulo: "Primos de segundo grau",
    veredito:
      "O olhar desconfiado é de família, mas o cabelo arrumado do humano o cachorro definitivamente não puxou.",
    fraseCard: "Parentes? Talvez. Cúmplices? Com certeza.",
    racaProvavel: "SRD caramelo",
    categorias: [
      { nome: "Olhar", nota: 71, comentario: "Os dois parecem estar julgando o fotógrafo em silêncio." },
      { nome: "Cabelo x pelo", nota: 32, comentario: "Um foi ao salão, o outro rolou na grama. Clássico." },
      { nome: "Expressão", nota: 60, comentario: "Boca fechada, cara de quem sabe de alguma fofoca." },
      { nome: "Pose e postura", nota: 48, comentario: "Um posou, o outro foi pego de surpresa." },
      { nome: "Vibe", nota: 63, comentario: "Dupla de quem se entende sem precisar falar." },
    ],
  },
  {
    nota: 29,
    titulo: "Opostos que se atraem",
    veredito:
      "Ele é pura elegância serena, o cachorro é caos com quatro patas. Ainda assim, a dupla funciona demais.",
    fraseCard: "Zero parecidos, 100% inseparáveis.",
    racaProvavel: "Vira-lata de respeito",
    categorias: [
      {
        nome: "Olhar",
        nota: 35,
        comentario: "Um olha com calma, o outro olha para três lugares ao mesmo tempo.",
      },
      { nome: "Cabelo x pelo", nota: 22, comentario: "Nem a textura, nem a cor, nem o penteado combinam." },
      {
        nome: "Expressão",
        nota: 30,
        comentario: "Sorriso discreto contra língua para fora. Placar desigual.",
      },
      { nome: "Pose e postura", nota: 25, comentario: "Postura de foto 3x4 contra pose de quem ia correr." },
      { nome: "Vibe", nota: 38, comentario: "O equilíbrio perfeito: um acalma, o outro anima." },
    ],
  },
];

export type OpcoesDemo = {
  /** Atraso simulado, para a interface mostrar o carregamento. */
  atrasoMs?: number;
  /** Gerador de números entre 0 e 1 (injetável para testes determinísticos). */
  aleatorio?: () => number;
};

/** Strategy usada sem chave de API ou com DEMO_MODE=1: devolve resultados de exemplo. */
export class AnalisadorDemo implements AnalisadorDeFotos {
  readonly consomeCota = false;
  private readonly atrasoMs: number;
  private readonly aleatorio: () => number;

  constructor(opcoes: OpcoesDemo = {}) {
    this.atrasoMs = opcoes.atrasoMs ?? 1800;
    this.aleatorio = opcoes.aleatorio ?? Math.random;
  }

  async analisar(): Promise<ResultadoValido> {
    if (this.atrasoMs > 0) await new Promise((ok) => setTimeout(ok, this.atrasoMs));
    const indice = Math.floor(this.aleatorio() * EXEMPLOS.length) % EXEMPLOS.length;
    return { valido: true, demo: true, ...EXEMPLOS[indice] };
  }
}
