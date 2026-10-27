"use client";

import { useCallback, useEffect, useReducer } from "react";
import { solicitarAnalise } from "@/lib/cliente/api";
import {
  ESTADO_INICIAL,
  podeAnalisar,
  reducer,
  resultadoSalvoValido,
  type ResultadoSalvo,
  type TipoFoto,
} from "@/lib/cliente/estado";
import { CHAVES_SESSAO, lerSessao, removerSessao, salvarSessao } from "@/lib/cliente/sessao";
import { comprimirFoto } from "@/lib/cliente/imagem";

/** Conecta a máquina de estados (reducer puro) às ações assíncronas: comprimir foto e chamar a API. */
export function useAnalise() {
  const [estado, despachar] = useReducer(reducer, ESTADO_INICIAL);

  // Volta para o resultado se a aba recarregar (ex.: ao voltar do app do banco depois do Pix).
  useEffect(() => {
    const salvo = lerSessao<unknown>(CHAVES_SESSAO.resultado);
    if (resultadoSalvoValido(salvo)) despachar({ tipo: "restaurar", ...salvo });
  }, []);

  const escolherFoto = useCallback(async (arquivo: File, foto: TipoFoto) => {
    despachar({ tipo: "foto_carregando", foto });
    try {
      despachar({ tipo: "foto_escolhida", foto, dataUrl: await comprimirFoto(arquivo) });
    } catch (erro) {
      despachar({ tipo: "foto_falhou", foto, mensagem: (erro as Error).message });
    }
  }, []);

  const analisar = useCallback(async () => {
    const { pessoa, cachorro } = estado.fotos;
    if (!podeAnalisar(estado) || !pessoa || !cachorro) return;

    despachar({ tipo: "analise_iniciada" });
    const resposta = await solicitarAnalise(pessoa, cachorro);
    if (resposta.ok) {
      despachar({ tipo: "analise_concluida", resultado: resposta.resultado });
      const salvo: ResultadoSalvo = { resultado: resposta.resultado, fotos: { pessoa, cachorro } };
      salvarSessao(CHAVES_SESSAO.resultado, salvo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      despachar({ tipo: "analise_falhou", mensagem: resposta.mensagem });
    }
  }, [estado]);

  const recomecar = useCallback(() => {
    removerSessao(CHAVES_SESSAO.resultado);
    despachar({ tipo: "recomecar" });
  }, []);

  return { estado, prontoParaAnalisar: podeAnalisar(estado), escolherFoto, analisar, recomecar };
}
