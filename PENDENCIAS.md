# O que preciso do Gabriel

## Para publicar (bloqueia o lançamento)

1. **Chave da API da Anthropic** — criar em console.anthropic.com, colocar créditos e um limite de gasto mensal. A chave vai direto na Vercel, não precisa me mandar.
2. **Nome e domínio** — usei "Tal Dono, Tal Pet" e `taldonotalcao.com.br` como provisórios. Confirmar o nome e verificar se o domínio está livre no Registro.br.
3. **Conta no GitHub e na Vercel** — para subir o código e publicar (passo a passo no README).
4. **E-mail de contato** — exigido pela LGPD na política de privacidade.

## Para cobrar o premium de verdade

1. **Conta no Mercado Pago com chave Pix cadastrada.**
2. **Access Token de produção** (começa com `APP_USR-`): developers → Suas integrações → Criar aplicação → Credenciais de produção. Cadastrar `MERCADOPAGO_ACCESS_TOKEN` na Vercel e fazer Redeploy. Enquanto não houver token, o premium roda em modo demo (libera sem cobrar e avisa na tela).
3. **E-mail de contato real** em `NEXT_PUBLIC_CONTATO_EMAIL`: os termos prometem reembolso em até 7 dias por e-mail.
4. **Fiscal:** vender conteúdo digital gera receita. Vale confirmar com um contador se compensa abrir MEI e se precisa emitir nota. (Não sou contador nem advogado.)
5. **Primeira compra real:** fazer um Pix de teste e depois devolver pelo painel, para conferir o fluxo ponta a ponta. Use um e-mail **diferente** do da sua conta do Mercado Pago (o MP recusa quando pagador e recebedor são a mesma conta).

## Decisões (não bloqueiam, mas mudam o produto)

5. **Monetização** — premium por Pix (R$ 4,90) implementado. Próximos candidatos: afiliados de pet shop no resultado e patrocínio de marca quando houver tráfego.
6. **Limite grátis por dia** — deixei 5 análises por pessoa e 500 no total por dia. Ajustar conforme o orçamento.
7. **Modelo da IA** — Haiku (mais barato) está como padrão. Testar com fotos reais e decidir se vale subir para Sonnet.

## O que não consegui fazer daqui

- **Testar com a IA de verdade:** sem a chave, testei a integração até a autenticação (a API respondeu "chave inválida", o que confirma que a chamada está no formato certo) e o restante em modo demo.
- **Publicar e registrar domínio:** precisa das suas contas.
- **Teste em celular real:** o card foi gerado e conferido aqui, mas vale abrir no seu celular (iPhone e Android) e testar o botão Compartilhar.

## Depois do lançamento (sugestões)

- Proteção anti-robô (Cloudflare Turnstile) se aparecer abuso.
- Versão para gatos ("Tal Dono, Tal Gato") reaproveitando 90% do código.
- Vídeos de lançamento no TikTok com reações reais de donos.
