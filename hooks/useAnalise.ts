"use client";

import { useCallback, useReducer } from "react";
import { solicitarAnalise } from "@/lib/cliente/api";
import { ESTADO_INICIAL, podeAnalisar, reducer, type TipoFoto } from "@/lib/cliente/estado";
import { comprimirFoto } from "@/lib/cliente/imagem";

/** Conecta a máquina de estados (reducer puro) às ações assíncronas: comprimir foto e chamar a API. */
export function useAnalise() {
  const [estado, despachar] = useReducer(reducer, ESTADO_INICIAL);

  const escolherFoto = useCallback(async (arquivo: File, foto: TipoFoto) => {
    try {
      despachar({ tipo: "foto_escolhida", foto, dataUrl: await comprimirFoto(arquivo) });
    } catch (erro) {
      despachar({ tipo: "aviso", mensagem: (erro as Error).message });
    }
  }, []);

  const analisar = useCallback(async () => {
    const { pessoa, cachorro } = estado.fotos;
    if (!podeAnalisar(estado) || !pessoa || !cachorro) return;

    despachar({ tipo: "analise_iniciada" });
    const resposta = await solicitarAnalise(pessoa, cachorro);
    if (resposta.ok) {
      despachar({ tipo: "analise_concluida", resultado: resposta.resultado });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      despachar({ tipo: "analise_falhou", mensagem: resposta.mensagem });
    }
  }, [estado]);

  const recomecar = useCallback(() => despachar({ tipo: "recomecar" }), []);

  return { estado, prontoParaAnalisar: podeAnalisar(estado), escolherFoto, analisar, recomecar };
}
