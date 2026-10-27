"use client";

import { useEffect, useState } from "react";
import { gerarCertificado, NOME_PET_PADRAO, NOME_TUTOR_PADRAO } from "@/lib/cliente/certificado";
import { baixarBlob, compartilharArquivo } from "@/lib/cliente/compartilhar";
import { formatoDeVideoSuportado, gerarVideo, type VideoGerado } from "@/lib/cliente/video";
import { configPublica, dominioDoSite } from "@/lib/config/publico";
import type { ResultadoValido } from "@/lib/tipos";

const TAMANHO_MAX_NOME = 30;

type Props = {
  resultado: ResultadoValido;
  fotoPessoa: string;
  fotoBicho: string;
  codigoCompra: string;
};

type Arquivo = { blob: Blob; url: string; nome: string };

function useArquivo() {
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  useEffect(() => {
    return () => {
      if (arquivo) URL.revokeObjectURL(arquivo.url);
    };
  }, [arquivo]);
  const definir = (blob: Blob, nome: string) => setArquivo({ blob, nome, url: URL.createObjectURL(blob) });
  return [arquivo, definir, () => setArquivo(null)] as const;
}

/** Itens liberados depois do pagamento: certificado com os nomes e vídeo animado. */
export default function GeradorPremium({ resultado, fotoPessoa, fotoBicho, codigoCompra }: Props) {
  const [nomeTutor, setNomeTutor] = useState("");
  const [nomePet, setNomePet] = useState("");
  const [certificado, definirCertificado, limparCertificado] = useArquivo();
  const [video, definirVideo] = useArquivo();
  const [gerandoCertificado, setGerandoCertificado] = useState(false);
  const [progressoVideo, setProgressoVideo] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [suportaVideo, setSuportaVideo] = useState(true);

  useEffect(() => setSuportaVideo(Boolean(formatoDeVideoSuportado())), []);

  const textoCompartilhar = `Agora é oficial: somos ${resultado.nota}% parecidos 🐾 Descubra o seu: ${configPublica.siteUrl}`;

  async function criarCertificado() {
    setErro(null);
    setGerandoCertificado(true);
    try {
      const blob = await gerarCertificado(
        {
          ...resultado,
          nomeTutor: nomeTutor.trim() || NOME_TUTOR_PADRAO,
          nomePet: nomePet.trim() || NOME_PET_PADRAO,
          codigo: codigoCompra,
          emitidoEm: new Date(),
        },
        fotoPessoa,
        fotoBicho,
      );
      definirCertificado(blob, "certificado-tal-dono-tal-cao.png");
    } catch {
      setErro("Não deu para gerar o certificado. Tenta de novo.");
    } finally {
      setGerandoCertificado(false);
    }
  }

  async function criarVideo() {
    setErro(null);
    setProgressoVideo(0);
    try {
      const { blob, formato }: VideoGerado = await gerarVideo(
        resultado,
        fotoPessoa,
        fotoBicho,
        dominioDoSite,
        setProgressoVideo,
      );
      definirVideo(blob, `tal-dono-tal-cao.${formato.extensao}`);
    } catch (e) {
      setErro((e as Error).message || "Não deu para gravar o vídeo. Tenta de novo.");
    } finally {
      setProgressoVideo(null);
    }
  }

  return (
    <div className="premium-liberado">
      <h3>Pagamento confirmado! 🎉</h3>
      <p className="premium-sub">Seus itens premium estão liberados nesta aba.</p>

      <section className="premium-item">
        <h4>📜 Certificado Oficial de Sósia</h4>
        <div className="campos">
          <label>
            Seu nome
            <input
              value={nomeTutor}
              maxLength={TAMANHO_MAX_NOME}
              placeholder="Ex.: Gabriel"
              onChange={(e) => {
                setNomeTutor(e.target.value);
                limparCertificado();
              }}
            />
          </label>
          <label>
            Nome do pet
            <input
              value={nomePet}
              maxLength={TAMANHO_MAX_NOME}
              placeholder={resultado.ehCachorro ? "Ex.: Thor" : "Ex.: Mingau"}
              onChange={(e) => {
                setNomePet(e.target.value);
                limparCertificado();
              }}
            />
          </label>
        </div>

        {certificado ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- blob local gerado no navegador */}
            <img src={certificado.url} alt="Certificado Oficial de Sósia" className="certificado-preview" />
            <div className="acoes">
              <button
                className="botao botao-principal"
                onClick={() => compartilharArquivo(certificado.blob, certificado.nome, textoCompartilhar)}
              >
                Compartilhar
              </button>
              <button className="botao" onClick={() => baixarBlob(certificado.blob, certificado.nome)}>
                Baixar
              </button>
            </div>
          </>
        ) : (
          <button
            className="botao botao-principal largura-total"
            onClick={criarCertificado}
            disabled={gerandoCertificado}
          >
            {gerandoCertificado ? "Carimbando…" : "Gerar certificado"}
          </button>
        )}
      </section>

      <section className="premium-item">
        <h4>🎬 Vídeo para Reels e TikTok</h4>
        {!suportaVideo ? (
          <p className="premium-sub">
            Este navegador não grava vídeo. Abra este site no Chrome ou no Safari atualizado. Seu acesso
            continua liberado nesta aba.
          </p>
        ) : video ? (
          <>
            <video src={video.url} className="video-preview" controls playsInline loop muted autoPlay />
            <div className="acoes">
              <button
                className="botao botao-principal"
                onClick={() => compartilharArquivo(video.blob, video.nome, textoCompartilhar)}
              >
                Compartilhar
              </button>
              <button className="botao" onClick={() => baixarBlob(video.blob, video.nome)}>
                Baixar
              </button>
            </div>
          </>
        ) : progressoVideo !== null ? (
          <div className="progresso" role="progressbar" aria-valuenow={Math.round(progressoVideo * 100)}>
            <div className="progresso-barra" style={{ width: `${progressoVideo * 100}%` }} />
            <span>Gravando… mantenha a tela aberta</span>
          </div>
        ) : (
          <button className="botao botao-principal largura-total" onClick={criarVideo}>
            Gerar vídeo (7 segundos)
          </button>
        )}
      </section>

      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
