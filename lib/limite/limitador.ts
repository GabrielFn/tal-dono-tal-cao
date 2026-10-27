import type { ContadorDiario } from "./contadores";

const UM_DIA_SEGUNDOS = 60 * 60 * 24;
/** Folga para a chave não expirar antes da virada do dia. */
const TTL_SEGUNDOS = UM_DIA_SEGUNDOS + 60 * 60;
const FUSO_BRASILIA_MS = -3 * 60 * 60 * 1000;

export type Reserva = {
  permitido: true;
  /** Devolve a cota (ex.: quando a IA falha). Chamar mais de uma vez não tem efeito. */
  devolver(): Promise<void>;
};
export type Bloqueio = { permitido: false; motivo: "ip" | "global" };

export type OpcoesLimitador = {
  limitePorIp: number;
  limiteGlobal: number;
  agora?: () => number;
};

/**
 * Controla quantas análises cada IP (e o site inteiro) pode fazer por dia.
 * A cota é reservada antes da análise e devolvida se a análise falhar.
 */
export class LimitadorDeUso {
  private readonly agora: () => number;

  constructor(
    private readonly contador: ContadorDiario,
    private readonly opcoes: OpcoesLimitador,
  ) {
    this.agora = opcoes.agora ?? Date.now;
  }

  async reservar(ip: string): Promise<Reserva | Bloqueio> {
    const chaveIp = this.chaveDoDia(`ip:${ip}`);
    const chaveGlobal = this.chaveDoDia("global");

    const usoIp = await this.contador.incrementar(chaveIp, TTL_SEGUNDOS);
    if (usoIp > this.opcoes.limitePorIp) {
      await this.contador.decrementar(chaveIp);
      return { permitido: false, motivo: "ip" };
    }

    const usoGlobal = await this.contador.incrementar(chaveGlobal, TTL_SEGUNDOS);
    if (usoGlobal > this.opcoes.limiteGlobal) {
      await Promise.all([this.contador.decrementar(chaveIp), this.contador.decrementar(chaveGlobal)]);
      return { permitido: false, motivo: "global" };
    }

    let devolvida = false;
    return {
      permitido: true,
      devolver: async () => {
        if (devolvida) return;
        devolvida = true;
        await Promise.all([this.contador.decrementar(chaveIp), this.contador.decrementar(chaveGlobal)]);
      },
    };
  }

  /** O dia "vira" à meia-noite de Brasília. */
  private chaveDoDia(sufixo: string): string {
    const dia = new Date(this.agora() + FUSO_BRASILIA_MS).toISOString().slice(0, 10);
    return `tdtc:${sufixo}:${dia}`;
  }
}
