// Contadores diários com expiração. Strategy: memória local ou Upstash Redis,
// com um Decorator que cai para a memória se o Redis falhar.

export interface ContadorDiario {
  /** Soma 1 e devolve o novo valor. A chave expira sozinha em `ttlSegundos`. */
  incrementar(chave: string, ttlSegundos: number): Promise<number>;
  /** Subtrai 1 (usado para devolver uma cota). */
  decrementar(chave: string): Promise<void>;
}

type Registro = { contagem: number; expiraEm: number };

export class ContadorEmMemoria implements ContadorDiario {
  private readonly registros = new Map<string, Registro>();

  constructor(private readonly agora: () => number = Date.now) {}

  async incrementar(chave: string, ttlSegundos: number): Promise<number> {
    const registro = this.registroValido(chave);
    if (!registro) {
      this.registros.set(chave, { contagem: 1, expiraEm: this.agora() + ttlSegundos * 1000 });
      return 1;
    }
    registro.contagem += 1;
    return registro.contagem;
  }

  async decrementar(chave: string): Promise<void> {
    const registro = this.registroValido(chave);
    if (registro) registro.contagem = Math.max(0, registro.contagem - 1);
  }

  private registroValido(chave: string): Registro | undefined {
    const registro = this.registros.get(chave);
    if (registro && registro.expiraEm <= this.agora()) {
      this.registros.delete(chave);
      return undefined;
    }
    return registro;
  }
}

type RespostaPipeline = Array<{ result?: unknown; error?: string }>;

export class ContadorUpstash implements ContadorDiario {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetchFn: typeof fetch = globalThis.fetch,
  ) {}

  async incrementar(chave: string, ttlSegundos: number): Promise<number> {
    const [incr] = await this.pipeline([
      ["INCR", chave],
      ["EXPIRE", chave, String(ttlSegundos), "NX"],
    ]);
    return Number(incr.result ?? 0);
  }

  async decrementar(chave: string): Promise<void> {
    await this.pipeline([["DECR", chave]]);
  }

  private async pipeline(comandos: string[][]): Promise<RespostaPipeline> {
    const resposta = await this.fetchFn(`${this.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(comandos),
      cache: "no-store",
    });
    if (!resposta.ok) throw new Error(`Upstash respondeu ${resposta.status}`);
    const dados = (await resposta.json()) as RespostaPipeline;
    const falha = dados.find((d) => d.error);
    if (falha) throw new Error(`Upstash: ${falha.error}`);
    return dados;
  }
}

/** Decorator: usa o contador principal e, se ele falhar, o reserva. O app nunca cai por causa do limite. */
export class ContadorComReserva implements ContadorDiario {
  constructor(
    private readonly principal: ContadorDiario,
    private readonly reserva: ContadorDiario,
    private readonly registrarErro: (erro: unknown) => void = (e) =>
      console.error("[limite] Contador principal falhou, usando reserva:", e),
  ) {}

  async incrementar(chave: string, ttlSegundos: number): Promise<number> {
    try {
      return await this.principal.incrementar(chave, ttlSegundos);
    } catch (erro) {
      this.registrarErro(erro);
      return this.reserva.incrementar(chave, ttlSegundos);
    }
  }

  async decrementar(chave: string): Promise<void> {
    try {
      await this.principal.decrementar(chave);
    } catch (erro) {
      this.registrarErro(erro);
      await this.reserva.decrementar(chave);
    }
  }
}
