// Ponto de entrada do módulo de análise.
import type { ConfigServidor } from "@/lib/config/servidor";
import { AnalisadorAnthropic } from "./anthropic";
import { AnalisadorDemo } from "./demo";
import type { AnalisadorDeFotos } from "./tipos";

export { ErroAnalise } from "./tipos";
export type { AnalisadorDeFotos, ImagemBase64, TipoImagem } from "./tipos";

/** Factory: escolhe a Strategy de análise de acordo com a configuração. */
export function criarAnalisador(config: ConfigServidor): AnalisadorDeFotos {
  const { chave, modelo, timeoutMs } = config.anthropic;
  if (config.modoDemo || !chave) return new AnalisadorDemo();
  return new AnalisadorAnthropic({ chave, modelo, timeoutMs });
}
