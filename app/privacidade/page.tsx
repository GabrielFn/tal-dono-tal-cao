import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import { configPublica } from "@/lib/config/publico";

export const metadata: Metadata = { title: "Política de Privacidade — Tal Dono, Tal Cão" };

const EMAIL = configPublica.contatoEmail;

export default function Privacidade() {
  return (
    <main className="pagina">
      <Link href="/" className="voltar">
        ← Voltar
      </Link>
      <article className="texto-legal">
        <h1>Política de Privacidade</h1>
        <p>Última atualização: 27 de outubro de 2026.</p>

        <h2>Resumo rápido</h2>
        <p>
          Suas fotos são usadas só para gerar o resultado e são descartadas logo em seguida. Não criamos
          conta, não pedimos nome, e-mail ou telefone, e não vendemos dados.
        </p>

        <h2>Quais dados tratamos</h2>
        <ul>
          <li>
            <strong>Fotos enviadas:</strong> a selfie e a foto do cachorro. Elas ficam apenas na memória do
            servidor durante a análise, que leva poucos segundos, e não são gravadas em disco nem em banco de
            dados.
          </li>
          <li>
            <strong>Endereço IP:</strong> usado de forma temporária para limitar a quantidade de análises por
            dia e evitar abusos. O contador é apagado automaticamente em até 25 horas.
          </li>
          <li>
            <strong>Estatísticas de acesso:</strong> número de visitas e páginas vistas, de forma agregada e
            sem cookies de rastreamento, para entender o uso do site.
          </li>
        </ul>

        <h2>Para que usamos</h2>
        <p>
          Exclusivamente para gerar a comparação divertida entre você e seu cachorro, montar o card de
          compartilhamento e manter o serviço funcionando com segurança. Não usamos as fotos para
          reconhecimento facial, identificação de pessoas, publicidade ou treinamento de modelos próprios.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Para fazer a análise, as fotos são enviadas a um provedor de inteligência artificial (Anthropic, nos
          Estados Unidos), que as processa e devolve o resultado, conforme os termos comerciais desse
          provedor. Pagamentos são processados pelo Mercado Pago. O site é hospedado na Vercel. Isso envolve
          transferência internacional de dados, feita apenas na medida necessária para prestar o serviço que
          você pediu.
        </p>

        <h2>Compras (Pacote Premium)</h2>
        <p>
          Para gerar o Pix, pedimos seu e-mail, que é exigido pelo Mercado Pago para emitir o comprovante. O
          e-mail é enviado ao Mercado Pago junto com a cobrança e não é guardado por nós. Dados bancários do
          pagamento ficam apenas com o seu banco e com o Mercado Pago. Os itens premium (certificado e vídeo)
          são gerados no seu próprio aparelho.
        </p>

        <h2>O que fica no seu aparelho</h2>
        <p>
          Para você não perder o resultado ao sair para pagar o Pix no app do banco, o resultado, as fotos
          reduzidas e o andamento da compra ficam guardados temporariamente no armazenamento da aba do seu
          navegador. Tudo é apagado quando você fecha a aba ou toca em &quot;Testar outra dupla&quot;.
        </p>

        <h2>O card gerado</h2>
        <p>
          O card com as fotos e a nota é montado no seu próprio aparelho. Ele só sai dali se você decidir
          compartilhar ou baixar.
        </p>

        <h2>Fotos de outras pessoas</h2>
        <p>
          Envie apenas fotos suas ou de quem autorizou. Não envie fotos de crianças sem a autorização do
          responsável.
        </p>

        <h2>Base legal e seus direitos (LGPD)</h2>
        <p>
          Tratamos os dados com base no seu consentimento ao enviar as fotos (art. 7º, I, da Lei 13.709/2018)
          e no legítimo interesse para segurança e prevenção de abuso (art. 7º, IX). Você pode pedir
          informações, correção ou exclusão de dados, e revogar o consentimento, pelo e-mail abaixo. Como não
          guardamos as fotos, normalmente não há nada armazenado para excluir.
        </p>

        <h2>Contato</h2>
        <p>
          Dúvidas ou pedidos: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </article>
      <Rodape />
    </main>
  );
}
