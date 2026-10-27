// Utilitários compartilhados pelos testes.

/** Data URL JPEG falso, com tamanho decodificado aproximado de `bytes`. */
export function dataUrlFalso(bytes = 5_000, tipo = "image/jpeg"): string {
  const base64 = Buffer.alloc(bytes, 1).toString("base64");
  return `data:${tipo};base64,${base64}`;
}

/** fetch falso que devolve sempre a mesma resposta e registra as chamadas. */
export function fetchFalso(status: number, corpo: unknown) {
  const chamadas: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    chamadas.push({ url: String(url), init });
    return new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { fn, chamadas };
}
