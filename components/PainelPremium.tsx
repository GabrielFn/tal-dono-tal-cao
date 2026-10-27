"use client";

import { useEffect, useState } from "react";
import GeradorPremium from "./GeradorPremium";
import { usePremium } from "@/hooks/usePremium";
import { emailPareceValido, formatarPreco, tempoRestante } from "@/lib/cliente/pagamento";
import type { CobrancaPublica, ResultadoValido } from "@/lib/tipos";

type Props = {
  resultado: ResultadoValido;
  fotoPessoa: string;
  fotoBicho: string;
  precoCentavos: number;
};

function Oferta({ preco, onComprar }: { preco: string; onComprar: () => void }) {
  return (
    <>
      <p className="premium-etiqueta">Premium</p>
      <h3>Deixa isso oficial ✨</h3>
      <ul className="premium-lista">
        <li>
          📜 <strong>Certificado Oficial de Sósia</strong> com o seu nome e o do pet, carimbado pelo Júri
          Canino
        </li>
        <li>
          🎬 <strong>Vídeo animado</strong> do resultado, pronto para Reels e TikTok
        </li>
      </ul>
      <button className="botao botao-principal largura-total" onClick={onComprar}>
        Quero por {preco} no Pix
      </button>
      <p className="premium-sub">Pagamento único. Liberação automática em segundos.</p>
    </>
  );
}

function FormularioEmail({
  preco,
  erro,
  gerando,
  onEnviar,
  onVoltar,
}: {
  preco: string;
  erro: string | null;
  gerando: boolean;
  onEnviar: (email: string) => void;
  onVoltar: () => void;
}) {
  const [email, setEmail] = useState("");
  const valido = emailPareceValido(email);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valido && !gerando) onEnviar(email);
      }}
    >
      <h3>Pix de {preco}</h3>
      <label className="campo-email">
        Seu e-mail
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          placeholder="voce@exemplo.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <p className="premium-sub">
        O Mercado Pago pede o e-mail para emitir o comprovante. A gente não guarda.
      </p>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      <button className="botao botao-principal largura-total" type="submit" disabled={!valido || gerando}>
        {gerando ? "Gerando Pix…" : "Gerar Pix"}
      </button>
      <button type="button" className="botao botao-texto" onClick={onVoltar}>
        Agora não
      </button>
    </form>
  );
}

function AguardandoPix({
  cobranca,
  preco,
  onVerificar,
  onCancelar,
}: {
  cobranca: CobrancaPublica;
  preco: string;
  onVerificar: () => void;
  onCancelar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [, setRelogio] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRelogio((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cobranca.copiaECola);
    } catch {
      // Navegadores antigos: seleciona o texto para a pessoa copiar na mão.
      document.getElementById("pix-copia-e-cola")?.focus();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  return (
    <div className="aguardando-pix">
      <h3>Pague {preco} no Pix</h3>
      {cobranca.demo && (
        <p className="selo-demo">
          Modo demonstração: nenhum pagamento real. Libera sozinho em alguns segundos.
        </p>
      )}
      {cobranca.qrCodeBase64 && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem base64 do Mercado Pago
        <img
          className="qr-pix"
          src={`data:image/jpeg;base64,${cobranca.qrCodeBase64}`}
          alt="QR code do Pix"
          width={220}
          height={220}
        />
      )}
      <button className="botao botao-principal largura-total" onClick={copiar}>
        {copiado ? "Código copiado ✓" : "Copiar código Pix"}
      </button>
      <textarea
        id="pix-copia-e-cola"
        className="pix-codigo"
        readOnly
        value={cobranca.copiaECola}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Código Pix copia e cola"
      />
      <ol className="passos-pix">
        <li>Copie o código</li>
        <li>No app do banco, escolha Pix → Copia e cola</li>
        <li>Volte para esta página: a liberação é automática</li>
      </ol>
      <p className="esperando" aria-live="polite">
        <span className="ponto-pulsando" aria-hidden /> Aguardando pagamento · vence em{" "}
        {tempoRestante(cobranca)}
      </p>
      <div className="acoes">
        <button className="botao" onClick={onVerificar}>
          Já paguei
        </button>
        <button className="botao" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function PainelPremium({ resultado, fotoPessoa, fotoBicho, precoCentavos }: Props) {
  const { estado, abrir, voltar, gerarPix, verificarAgora } = usePremium();
  const preco = formatarPreco(precoCentavos);

  return (
    <section className="premium" aria-label="Pacote premium">
      {estado.etapa === "oferta" && <Oferta preco={preco} onComprar={abrir} />}

      {(estado.etapa === "email" || estado.etapa === "gerando") && (
        <FormularioEmail
          preco={preco}
          erro={estado.erro}
          gerando={estado.etapa === "gerando"}
          onEnviar={gerarPix}
          onVoltar={voltar}
        />
      )}

      {estado.etapa === "aguardando" && estado.cobranca && (
        <AguardandoPix
          cobranca={estado.cobranca}
          preco={preco}
          onVerificar={verificarAgora}
          onCancelar={voltar}
        />
      )}

      {estado.etapa === "expirado" && (
        <>
          <h3>O Pix venceu ⏰</h3>
          <p className="premium-sub">Sem problema: gera um novo e é só pagar.</p>
          <button className="botao botao-principal largura-total" onClick={abrir}>
            Gerar novo Pix
          </button>
        </>
      )}

      {estado.etapa === "pago" && estado.cobranca && (
        <GeradorPremium
          resultado={resultado}
          fotoPessoa={fotoPessoa}
          fotoBicho={fotoBicho}
          codigoCompra={estado.cobranca.id}
        />
      )}
    </section>
  );
}
