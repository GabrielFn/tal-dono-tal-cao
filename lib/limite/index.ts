import type { ConfigServidor } from "@/lib/config/servidor";
import { ContadorComReserva, ContadorEmMemoria, ContadorUpstash, type ContadorDiario } from "./contadores";
import { LimitadorDeUso } from "./limitador";

export { LimitadorDeUso } from "./limitador";
export type { Bloqueio, Reserva } from "./limitador";

// Um único contador em memória por instância do servidor (sobrevive entre requisições).
const contadorLocal = new ContadorEmMemoria();

/** Factory: monta o limitador com Upstash (se configurado) e memória como reserva. */
export function criarLimitador(config: ConfigServidor): LimitadorDeUso {
  const contador: ContadorDiario = config.upstash
    ? new ContadorComReserva(new ContadorUpstash(config.upstash.url, config.upstash.token), contadorLocal)
    : contadorLocal;

  return new LimitadorDeUso(contador, {
    limitePorIp: config.limites.porIp,
    limiteGlobal: config.limites.global,
  });
}
