"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  consultarPix,
  criarPix,
  pixVencido,
  PREMIUM_INICIAL,
  reducerPremium,
  type EstadoPremium,
} from "@/lib/cliente/pagamento";
import { CHAVES_SESSAO, lerSessao, salvarSessao } from "@/lib/cliente/sessao";

const INTERVALO_CONSULTA_MS = 4_000;

/**
 * Fluxo de compra do premium: gera o Pix, consulta o pagamento a cada poucos segundos
 * e na hora em que a pessoa volta do app do banco. O estado fica salvo na sessão da aba.
 */
export function usePremium() {
  const [estado, despachar] = useReducer(reducerPremium, PREMIUM_INICIAL);
  const [restaurado, setRestaurado] = useState(false);
  const consultando = useRef(false);

  // Restaura a compra em andamento (ex.: a aba recarregou ao voltar do app do banco).
  useEffect(() => {
    const salvo = lerSessao<EstadoPremium>(CHAVES_SESSAO.premium);
    if (salvo) despachar({ tipo: "restaurar", estado: salvo });
    setRestaurado(true);
  }, []);

  useEffect(() => {
    if (restaurado) salvarSessao(CHAVES_SESSAO.premium, estado);
  }, [estado, restaurado]);

  const verificar = useCallback(async () => {
    const cobranca = estado.cobranca;
    if (estado.etapa !== "aguardando" || !cobranca || consultando.current) return;
    consultando.current = true;
    try {
      const status = await consultarPix(cobranca.id);
      if (status) despachar({ tipo: "status", status });
      else if (pixVencido(cobranca)) despachar({ tipo: "status", status: "expirado" });
    } finally {
      consultando.current = false;
    }
  }, [estado.etapa, estado.cobranca]);

  useEffect(() => {
    if (estado.etapa !== "aguardando") return;
    verificar();
    const id = setInterval(verificar, INTERVALO_CONSULTA_MS);
    const aoVoltar = () => document.visibilityState === "visible" && verificar();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [estado.etapa, verificar]);

  const gerarPix = useCallback(async (email: string) => {
    despachar({ tipo: "gerando" });
    const resposta = await criarPix(email.trim());
    despachar(
      resposta.ok
        ? { tipo: "pix_criado", cobranca: resposta.cobranca }
        : { tipo: "pix_falhou", mensagem: resposta.mensagem },
    );
  }, []);

  return {
    estado,
    abrir: useCallback(() => despachar({ tipo: "abrir" }), []),
    voltar: useCallback(() => despachar({ tipo: "voltar" }), []),
    gerarPix,
    verificarAgora: verificar,
  };
}
