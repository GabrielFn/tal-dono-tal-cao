import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import { configPublica } from "@/lib/config/publico";

export const metadata: Metadata = { title: "Termos de Uso — Tal Dono, Tal Pet" };

const EMAIL = configPublica.contatoEmail;

export default function Termos() {
  return (
    <main className="pagina">
      <Link href="/" className="voltar">
        ← Voltar
      </Link>
      <article className="texto-legal">
        <h1>Termos de Uso</h1>
        <p>Última atualização: 27 de outubro de 2026.</p>

        <h2>1. O que é</h2>
        <p>
          O Tal Dono, Tal Pet é um site de entretenimento. Uma inteligência artificial compara uma foto sua
          com uma foto do seu pet e gera uma nota e comentários bem-humorados.
        </p>

        <h2>2. É só diversão</h2>
        <p>
          Os resultados não têm valor científico, veterinário ou de qualquer outro tipo. A IA pode errar,
          inclusive na raça do pet. Não use o resultado para decisões sérias.
        </p>

        <h2>3. O que você pode enviar</h2>
        <ul>
          <li>Fotos suas, ou de pessoas que autorizaram o uso.</li>
          <li>Para usar o site, você precisa ter 18 anos ou autorização do seu responsável.</li>
          <li>Fotos de crianças apenas com autorização do responsável.</li>
          <li>Nada de conteúdo ofensivo, violento, sexual ou ilegal.</li>
        </ul>

        <h2>4. Uso justo</h2>
        <p>
          Existe um limite diário de análises gratuitas por pessoa. É proibido tentar burlar esse limite, usar
          robôs ou sobrecarregar o serviço.
        </p>

        <h2>5. Responsabilidade</h2>
        <p>
          O serviço é oferecido como está, sem garantia de disponibilidade contínua. Você é responsável pelas
          fotos que envia e pelo que compartilha.
        </p>

        <h2>6. Pacote Premium (compras)</h2>
        <ul>
          <li>
            O Pacote Premium é um conteúdo digital: o Certificado Oficial de Sósia e o vídeo animado do seu
            resultado. O preço aparece antes da compra e o pagamento é único, por Pix, processado pelo Mercado
            Pago.
          </li>
          <li>
            A liberação é automática assim que o Pix é confirmado. Os itens são gerados no seu aparelho e o
            acesso vale para a aba do navegador em que você comprou. Baixe os arquivos antes de fechar a aba.
          </li>
          <li>
            Se o pagamento foi feito e os itens não foram liberados, ou se você se arrependeu, peça o
            reembolso em até 7 dias pelo e-mail de contato, informando o e-mail usado na compra. Devolvemos o
            valor pelo próprio Pix.
          </li>
          <li>Assim como o resultado gratuito, o conteúdo premium é só diversão e não tem valor oficial.</li>
        </ul>

        <h2>7. Privacidade</h2>
        <p>
          Veja como tratamos seus dados na <Link href="/privacidade">Política de Privacidade</Link>.
        </p>

        <h2>8. Contato</h2>
        <p>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </article>
      <Rodape />
    </main>
  );
}
