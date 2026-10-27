import { describe, expect, it } from "vitest";
import { solicitarAnalise } from "@/lib/cliente/api";
import { textoDeCompartilhamento } from "@/lib/cliente/compartilhar";
import { ESTADO_INICIAL, mensagensDeAviso, podeAnalisar, reducer, type Estado } from "@/lib/cliente/estado";
import type { ResultadoValido } from "@/lib/tipos";
import { fetchFalso } from "./auxiliares";

const RESULTADO: ResultadoValido = {
  valido: true,
  nota: 80,
  titulo: "t",
  veredito: "v",
  fraseCard: "f",
  racaProvavel: "r",
  categorias: [],
  inusitado: false,
  especie: "cachorro",
  somDoAnimal: "AU-AU",
  plotTwist: "",
};

const comFotos: Estado = { ...ESTADO_INICIAL, fotos: { pessoa: "p", pet: "c" } };

describe("reducer da tela", () => {
  it("só permite analisar com as duas fotos", () => {
    expect(podeAnalisar(ESTADO_INICIAL)).toBe(false);
    const umaFoto = reducer(ESTADO_INICIAL, { tipo: "foto_escolhida", foto: "pessoa", dataUrl: "p" });
    expect(podeAnalisar(umaFoto)).toBe(false);
    expect(reducer(umaFoto, { tipo: "analise_iniciada" })).toBe(umaFoto);
    expect(podeAnalisar(comFotos)).toBe(true);
  });

  it("começar a abrir uma foto limpa o aviso geral e o erro daquela foto", () => {
    const comErros: Estado = {
      ...ESTADO_INICIAL,
      aviso: "erro geral",
      errosFoto: { pessoa: "erro", pet: null },
    };
    const depois = reducer(comErros, { tipo: "foto_carregando", foto: "pessoa" });
    expect(depois.aviso).toBeNull();
    expect(depois.errosFoto.pessoa).toBeNull();
    expect(depois.carregando.pessoa).toBe(true);
  });

  it("REGRESSÃO: o erro de uma foto não some quando a outra carrega", () => {
    let estado = reducer(ESTADO_INICIAL, { tipo: "foto_carregando", foto: "pessoa" });
    estado = reducer(estado, { tipo: "foto_falhou", foto: "pessoa", mensagem: "Não abriu" });
    estado = reducer(estado, { tipo: "foto_carregando", foto: "pet" });
    estado = reducer(estado, { tipo: "foto_escolhida", foto: "pet", dataUrl: "c" });
    expect(mensagensDeAviso(estado)).toEqual(["Selfie: Não abriu"]);
    expect(estado.carregando).toEqual({ pessoa: false, pet: false });
  });

  it("não deixa analisar enquanto uma foto ainda está abrindo", () => {
    const abrindo = reducer(comFotos, { tipo: "foto_carregando", foto: "pet" });
    expect(podeAnalisar(abrindo)).toBe(false);
  });

  it("junta erros das fotos e o erro geral nas mensagens", () => {
    const estado: Estado = {
      ...ESTADO_INICIAL,
      aviso: "Volta amanhã",
      errosFoto: { pessoa: null, pet: "Não abriu" },
    };
    expect(mensagensDeAviso(estado)).toEqual(["Foto do pet: Não abriu", "Volta amanhã"]);
  });

  it("segue o fluxo início → analisando → resultado", () => {
    const analisando = reducer(comFotos, { tipo: "analise_iniciada" });
    expect(analisando.etapa).toBe("analisando");
    expect(podeAnalisar(analisando)).toBe(false); // evita clique duplo
    const fim = reducer(analisando, { tipo: "analise_concluida", resultado: RESULTADO });
    expect(fim).toMatchObject({ etapa: "resultado", resultado: RESULTADO });
  });

  it("falha volta ao início mantendo as fotos", () => {
    const analisando = reducer(comFotos, { tipo: "analise_iniciada" });
    const falhou = reducer(analisando, { tipo: "analise_falhou", mensagem: "ops" });
    expect(falhou).toMatchObject({ etapa: "inicio", aviso: "ops", fotos: comFotos.fotos });
  });

  it("recomeçar zera tudo", () => {
    expect(reducer(comFotos, { tipo: "recomecar" })).toEqual(ESTADO_INICIAL);
  });
});

describe("solicitarAnalise", () => {
  it("devolve o resultado em caso de sucesso", async () => {
    const { fn } = fetchFalso(200, RESULTADO);
    expect(await solicitarAnalise("p", "c", fn)).toEqual({ ok: true, resultado: RESULTADO });
  });

  it("repassa a mensagem de erro da API", async () => {
    const { fn } = fetchFalso(429, { erro: "Volta amanhã!", codigo: "limite_ip" });
    expect(await solicitarAnalise("p", "c", fn)).toEqual({ ok: false, mensagem: "Volta amanhã!" });
  });

  it("repassa a mensagem de foto inválida", async () => {
    const { fn } = fetchFalso(200, { valido: false, motivo: "sem_animal", mensagem: "Cadê o au-au?" });
    expect(await solicitarAnalise("p", "c", fn)).toEqual({ ok: false, mensagem: "Cadê o au-au?" });
  });

  it("trata falha de rede e resposta que não é JSON", async () => {
    const quebrado = (async () => {
      throw new TypeError("offline");
    }) as typeof fetch;
    expect((await solicitarAnalise("p", "c", quebrado)).ok).toBe(false);
    const { fn } = fetchFalso(500, "<html>erro</html>");
    expect((await solicitarAnalise("p", "c", fn)).ok).toBe(false);
  });
});

describe("textoDeCompartilhamento", () => {
  const site = "https://site.com";
  it("cachorro", () => {
    const texto = textoDeCompartilhamento({ nota: 87, inusitado: false, especie: "cachorro" }, site);
    expect(texto).toContain("87%");
    expect(texto).toContain("meu cachorro");
    expect(texto).toContain(site);
  });

  it("gato", () => {
    expect(textoDeCompartilhamento({ nota: 80, inusitado: false, especie: "gato" }, site)).toContain(
      "meu gato",
    );
  });

  it("bicho inusitado entrega o plot twist sem errar o gênero", () => {
    const texto = textoDeCompartilhamento({ nota: 72, inusitado: true, especie: "calopsita" }, site);
    expect(texto).toContain("é calopsita");
    expect(texto).not.toContain("meu calopsita");
  });
});
