# Tal Dono, Tal Pet 🐾

Web app que mede, com IA, o quanto uma pessoa se parece com o próprio cachorro e gera um card pronto para Stories e TikTok.

- **Stack:** Next.js 15 (App Router) + TypeScript, sem banco de dados.
- **IA:** API da Anthropic (Claude), modelo configurável (padrão: Haiku, o mais barato).
- **Hospedagem sugerida:** Vercel (plano grátis serve para começar).
- **Privacidade:** as fotos não são salvas. São reduzidas no celular, analisadas e descartadas.

## Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem `ANTHROPIC_API_KEY`, o app roda em **modo demo** (resultados de exemplo) para você testar a interface sem gastar nada.

## Colocar em produção (Vercel)

1. Crie um repositório no GitHub e envie este projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/tal-dono-tal-cao.git
   git push -u origin main
   ```
2. Em https://vercel.com, clique em **Add New → Project** e importe o repositório. A Vercel detecta o Next.js sozinha.
3. Em **Settings → Environment Variables**, cadastre:
   | Variável                                              | Valor                                                 |
   | ----------------------------------------------------- | ----------------------------------------------------- |
   | `ANTHROPIC_API_KEY`                                   | sua chave de https://console.anthropic.com            |
   | `ANTHROPIC_MODEL`                                     | `claude-haiku-5-5`                                    |
   | `NEXT_PUBLIC_SITE_URL`                                | o endereço final, ex.: `https://taldonotalcao.com.br` |
   | `NEXT_PUBLIC_CONTATO_EMAIL`                           | seu e-mail de contato                                 |
   | `LIMITE_DIARIO_POR_IP`                                | `5`                                                   |
   | `LIMITE_DIARIO_GLOBAL`                                | `500`                                                 |
   | `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` | veja o passo 4                                        |
4. **Limite de uso (recomendado):** crie um banco Redis grátis em https://upstash.com (Redis → Create → copie _REST URL_ e _REST TOKEN_). Sem isso o limite funciona, mas cada servidor da Vercel conta separado.
5. Clique em **Deploy**. Pronto.
6. **Domínio:** em **Settings → Domains**, adicione seu domínio (ex.: comprado no Registro.br) e siga as instruções de DNS.
7. **Na Anthropic:** em _Billing_, coloque créditos e defina um **limite de gasto mensal**, para nunca ter surpresa.

## Pacote Premium (Pix)

Depois do resultado, a pessoa pode comprar por **R$ 4,90** (configurável) um **Certificado Oficial de Sósia** com os nomes dela e do pet e um **vídeo animado de 7 s** (MP4, 1080x1920) para Reels e TikTok.

- **Pagamento:** Pix pela API Orders do Mercado Pago. A tela consulta o status a cada 4 s e também na hora em que a pessoa volta do app do banco. Não precisa de webhook nem de banco de dados.
- **Sem token = modo demo:** o Pix libera sozinho em ~8 s e a tela avisa que é demonstração. Bom para testar o fluxo antes de configurar o Mercado Pago.
- **Para cobrar de verdade:** cadastre `MERCADOPAGO_ACCESS_TOKEN` (credencial de **produção**, começa com `APP_USR-`) na Vercel e faça um Redeploy. A conta do Mercado Pago precisa ter uma **chave Pix cadastrada**.
- **Reembolso:** pelo painel do Mercado Pago (Atividade → pagamento → Devolver). A referência `tdtc-...` aparece em cada cobrança.
- **Escolha de projeto:** o certificado e o vídeo são gerados **no aparelho da pessoa**. Assim nenhuma foto é guardada no servidor (melhor para a LGPD e custo zero de processamento). A contrapartida é que um desenvolvedor experiente conseguiria liberar os itens mexendo no JavaScript da página. Para um item de R$ 4,90 comprado por impulso, esse risco é aceitável.
- **Persistência:** resultado e andamento da compra ficam no `sessionStorage` da aba, para sobreviver à ida ao app do banco. Somem ao fechar a aba.

## Onde mexer

| O que                                   | Arquivo                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Tom do humor, regras e categorias da IA | `lib/analise/prompt.ts`                                                        |
| Visual do card compartilhado            | `lib/cliente/card.ts` (posições no objeto `LAYOUT`)                            |
| Tela inicial / tela de resultado        | `components/TelaInicio.tsx`, `TelaResultado.tsx`                               |
| Cores e estilo                          | `app/globals.css`                                                              |
| Limites e variáveis de ambiente         | `lib/config/servidor.ts`, `lib/config/publico.ts`                              |
| Textos legais                           | `app/privacidade/page.tsx`, `app/termos/page.tsx`                              |
| Preço, Pix e limites do premium         | variáveis `PRECO_PREMIUM_CENTAVOS`, `MERCADOPAGO_ACCESS_TOKEN`, `LIMITE_PIX_*` |
| Certificado / vídeo                     | `lib/cliente/certificado.ts`, `lib/cliente/video.ts`                           |
| Resultados do modo demo                 | `lib/analise/demo.ts`                                                          |

## Arquitetura

```
app/api/analisar/route.ts   Adaptador HTTP (fino): lê o corpo, monta dependências, devolve JSON
lib/analise/servico.ts      Caso de uso: valida → reserva cota → chama IA → devolve cota se falhar
lib/analise/                Strategy AnalisadorDeFotos: AnalisadorAnthropic | AnalisadorDemo (+ factory)
lib/analise/normalizar.ts   Camada anticorrupção: resposta da IA → Resultado confiável
lib/pagamento/              Strategy ProvedorPix: ProvedorMercadoPago | ProvedorPixDemo (+ factory e casos de uso)
lib/limite/                 LimitadorDeUso + contadores (Memória | Upstash, com Decorator de fallback)
lib/config/                 Variáveis de ambiente lidas e validadas num só lugar
lib/cliente/                Código do navegador: reducer da tela, cliente HTTP, card, compartilhar
hooks/                      useAnalise (estado + ações) e useCard (gera e libera o card)
components/                 Componentes de apresentação
tests/                      Testes unitários (Vitest)
```

Regras de dependência: `components → hooks → lib/cliente`; `route → lib/analise/servico → interfaces`. O caso de uso não conhece Next.js nem a Anthropic, só as interfaces, por isso é testado com dublês.

## Qualidade

```bash
npm run check    # typecheck + ESLint + Prettier + testes (rode antes de cada commit)
npm test         # só os testes
npm run format   # formata o código
```

## Proteções já incluídas

- Limite diário por IP e limite global (protege seu orçamento de API).
- Fotos reduzidas no navegador (máx. 896 px) antes do envio: mais rápido e mais barato.
- Validação de tipo e tamanho das imagens no servidor.
- Prompt com regras de respeito: a IA nunca comenta cor de pele, etnia, peso, idade, corpo ou beleza.
- Fotos inválidas (sem rosto, sem cachorro, borradas) recebem uma mensagem amigável.
- Cabeçalhos de segurança, preview para WhatsApp/Instagram (Open Graph), sitemap e robots.
- Vercel Analytics (visitas, sem cookies): ative em **Analytics** no painel da Vercel.
