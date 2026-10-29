// Resultados de exemplo para o MODO DEMO (sem chave de API ou com DEMO_MODE=1).
import type { ResultadoValido } from "@/lib/tipos";
import type { AnalisadorDeFotos } from "./tipos";

const CACHORRO = { inusitado: false, especie: "cachorro", somDoAnimal: "AU-AU", plotTwist: "" } as const;

const EXEMPLOS: Omit<ResultadoValido, "valido" | "demo">[] = [
  {
    nota: 87,
    titulo: "Franja e orelha sincronizadas",
    veredito:
      "Sua franja cai para a esquerda exatamente como a orelha dobrada dele, e os dois foram fotografados de cima, no mesmo sofá cinza. Isso não é coincidência, é decoração.",
    detalheSecreto: "A mecha que cai no seu olho esquerdo e a orelha dobrada dele fazem a mesma curva.",
    fraseCard: "A franja é minha, a orelha é dele, o penteado é nosso.",
    racaProvavel: "Golden Retriever",
    ...CACHORRO,
    categorias: [
      {
        nome: "Olhar",
        nota: 92,
        comentario: "Os dois olham um pouco acima da lente, para a esquerda. Mesmo ponto fixo.",
      },
      {
        nome: "Cabelo x pelo",
        nota: 84,
        comentario: "Volume ondulado e dourado nos dois. O shampoo é o mesmo?",
      },
      {
        nome: "Expressão",
        nota: 90,
        comentario: "Canto direito da boca puxado para cima nos dois. Assimetria de família.",
      },
      {
        nome: "Pose e postura",
        nota: 78,
        comentario: "Cabeça levemente de lado, a pose oficial da família.",
      },
      { nome: "Vibe", nota: 91, comentario: "Moletom mostarda e coleira mostarda. Alguém escolheu isso." },
    ],
  },
  {
    nota: 54,
    titulo: "Primos de segundo grau",
    veredito:
      "A ruguinha entre as suas sobrancelhas está desenhada na testa dele em pelo mais escuro. O cabelo com gel, por outro lado, ele não puxou.",
    detalheSecreto: "Aquele vinco que você faz entre as sobrancelhas, ele tem pintado de fábrica.",
    fraseCard: "A testa franzida é hereditária. O gel, não.",
    racaProvavel: "SRD caramelo",
    ...CACHORRO,
    categorias: [
      { nome: "Olhar", nota: 71, comentario: "Os dois parecem estar julgando o fotógrafo em silêncio." },
      { nome: "Cabelo x pelo", nota: 32, comentario: "Um foi ao salão, o outro rolou na grama. Clássico." },
      {
        nome: "Expressão",
        nota: 60,
        comentario: "Lábio de baixo levemente para fora nos dois. Alguém aí está emburrado.",
      },
      { nome: "Pose e postura", nota: 48, comentario: "Um posou, o outro foi pego de surpresa." },
      {
        nome: "Vibe",
        nota: 63,
        comentario: "Você de camisa social, ele deitado no tapete xadrez. Escritório e home office.",
      },
    ],
  },
  {
    nota: 29,
    titulo: "Opostos que se atraem",
    veredito:
      "Você posou de frente, cabelo preso, gola fechada até o pescoço. Ele está de ponta-cabeça no chão com uma meia na boca. Nada bate, exceto a meia, que é sua.",
    detalheSecreto:
      "A única coisa em comum entre vocês é a meia listrada. Ela está no seu pé e na boca dele.",
    fraseCard: "Nada em comum. Só a meia.",
    racaProvavel: "Vira-lata de respeito",
    ...CACHORRO,
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
        comentario: "Boca fechada e reta contra língua de lado segurando uma meia. Placar desigual.",
      },
      { nome: "Pose e postura", nota: 25, comentario: "Postura de foto 3x4 contra pose de quem ia correr." },
      {
        nome: "Vibe",
        nota: 38,
        comentario: "Parede branca e organizada atrás de você; atrás dele, o caos da lavanderia.",
      },
    ],
  },
  {
    nota: 72,
    titulo: "Realeza felina reconhecida",
    veredito:
      "Os dois estão com o queixo apontado para o canto superior direito e as pálpebras a meio mastro. Até a luz da janela bate do mesmo lado.",
    detalheSecreto: "Vocês estão com o queixo no mesmo ângulo, uns 20 graus para cima. Ensaiado ou genética?",
    fraseCard: "Queixo alto e pálpebra a meio mastro: é de família.",
    racaProvavel: "Siamês de nariz empinado",
    inusitado: false,
    especie: "gato",
    somDoAnimal: "MIAU",
    plotTwist: "",
    categorias: [
      {
        nome: "Olhar",
        nota: 88,
        comentario: "Pálpebras pela metade nos dois, olhando de cima para baixo. Assustador.",
      },
      {
        nome: "Cabelo x pelo",
        nota: 61,
        comentario: "Os dois estão impecáveis, mas só um se lambe para isso.",
      },
      {
        nome: "Expressão",
        nota: 79,
        comentario: "Boca reta, bochechas paradas, testa lisa. Zero esforço facial dos dois.",
      },
      {
        nome: "Pose e postura",
        nota: 66,
        comentario: "Queixo levantado nos dois. Realeza reconhece realeza.",
      },
      {
        nome: "Vibe",
        nota: 70,
        comentario: "Você de cinza-claro, ela cinza-claro com ponta escura. Mesma paleta.",
      },
    ],
  },
  {
    nota: 64,
    titulo: "Calopsita de alta patente",
    veredito:
      "O topete amarelo dela aponta para trás no mesmo ângulo da sua mecha da frente. E as bochechas laranja combinam com a sua caneca ao fundo.",
    detalheSecreto:
      "As bolinhas laranja nas bochechas dela são do mesmo tom da caneca na prateleira atrás de você.",
    fraseCard: "Mesmo topete, mesma cara de 'oi?'.",
    racaProvavel: "Calopsita de alta patente",
    inusitado: true,
    especie: "calopsita",
    somDoAnimal: "PIU-PIU",
    plotTwist:
      "O júri esperava um cachorro ou um gato. Recebeu uma calopsita, e ela claramente manda na casa.",
    categorias: [
      { nome: "Olhar", nota: 58, comentario: "Os dois olham de lado, como quem desconfia do fotógrafo." },
      {
        nome: "Cabelo x pelo",
        nota: 81,
        comentario: "Topete armado nos dois. Ninguém usa pente nessa casa.",
      },
      {
        nome: "Expressão",
        nota: 55,
        comentario: "Bico fechado contra boca entreaberta. Os dois parecem prestes a comentar algo.",
      },
      { nome: "Pose e postura", nota: 66, comentario: "Cabeça inclinada sincronizada. Ensaiaram?" },
      { nome: "Vibe", nota: 60, comentario: "Camiseta amarela, penas amarelas. Uniforme da casa." },
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
