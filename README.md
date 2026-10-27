# Tal Dono, Tal Cão 🐾

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
   | Variável | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | sua chave de https://console.anthropic.com |
   | `ANTHROPIC_MODEL` | `claude-haiku-5-5` |
   | `NEXT_PUBLIC_SITE_URL` | o endereço final, ex.: `https://taldonotalcao.com.br` |
   | `NEXT_PUBLIC_CONTATO_EMAIL` | seu e-mail de contato |
   | `LIMITE_DIARIO_POR_IP` | `5` |
   | `LIMITE_DIARIO_GLOBAL` | `500` |
   | `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` | veja o passo 4 |
4. **Limite de uso (recomendado):** crie um banco Redis grátis em https://upstash.com (Redis → Create → copie *REST URL* e *REST TOKEN*). Sem isso o limite funciona, mas cada servidor da Vercel conta separado.
5. Clique em **Deploy**. Pronto.
6. **Domínio:** em **Settings → Domains**, adicione seu domínio (ex.: comprado no Registro.br) e siga as instruções de DNS.
7. **Na Anthropic:** em *Billing*, coloque créditos e defina um **limite de gasto mensal**, para nunca ter surpresa.

## Onde mexer

| O que | Arquivo |
|---|---|
| Tom do humor, regras e categorias da IA | `lib/prompt.ts` |
| Visual do card compartilhado | `lib/card.ts` |
| Tela principal e resultado | `components/App.tsx` |
| Cores e estilo | `app/globals.css` |
| Limite de uso | `lib/limite.ts` + variáveis de ambiente |
| Textos legais | `app/privacidade/page.tsx`, `app/termos/page.tsx` |
| Resultados do modo demo | `lib/demo.ts` |

## Proteções já incluídas

- Limite diário por IP e limite global (protege seu orçamento de API).
- Fotos reduzidas no navegador (máx. 896 px) antes do envio: mais rápido e mais barato.
- Validação de tipo e tamanho das imagens no servidor.
- Prompt com regras de respeito: a IA nunca comenta cor de pele, etnia, peso, idade, corpo ou beleza.
- Fotos inválidas (sem rosto, sem cachorro, borradas) recebem uma mensagem amigável.
- Cabeçalhos de segurança, preview para WhatsApp/Instagram (Open Graph), sitemap e robots.
- Vercel Analytics (visitas, sem cookies): ative em **Analytics** no painel da Vercel.
