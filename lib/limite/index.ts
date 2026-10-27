import type { ConfigServidor } from "@/lib/config/servidor";
import { ContadorComReserva, ContadorEmMemoria, ContadorUpstash, type ContadorDiario } from "./contadores";
import { LimitadorDeUso } from "./limitador";

export { LimitadorDeUso } from "./limitador";
export type { Bloqueio, Reserva } from "./limitador";

// Um único contador em memória por instância do servidor (sobrevive entre requisições).
const contadorLocal = new ContadorEmMemoria();

function contadorDe(config: ConfigServidor): ContadorDiario {
  return config.upstash
    ? new ContadorComReserva(new ContadorUpstash(config.upstash.url, config.upstash.token), contadorLocal)
    : contadorLocal;
}

/** Factory: limitador das análises (Upstash se configurado, memória como reserva). */
export function criarLimitador(config: ConfigServidor): LimitadorDeUso {
  return new LimitadorDeUso(contadorDe(config), {
    limitePorIp: config.limites.porIp,
    limiteGlobal: config.limites.global,
  });
}

/** Factory: limitador de cobranças Pix, com contadores separados dos da análise. */
export function criarLimitadorPix(config: ConfigServidor): LimitadorDeUso {
  return new LimitadorDeUso(contadorDe(config), {
    limitePorIp: config.pagamento.limites.porIp,
    limiteGlobal: config.pagamento.limites.global,
    prefixo: "pix:",
  });
}
