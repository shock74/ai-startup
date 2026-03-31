# InboxZero AI — SaaS global para e-mail overload

## 1) Ideia da startup
**InboxZero AI** é um Web App/SaaS que conecta com Gmail/Outlook e usa IA para:
- priorizar mensagens relevantes,
- resumir e-mails em linguagem natural,
- sugerir respostas curtas,
- eliminar ruído automaticamente.

É um produto simples de entender, com dor global, recorrente e alta disposição de pagamento para profissionais e equipes.

## 2) Problema que resolve
A maioria das pessoas perde tempo em excesso processando e-mails (ruído, spam comercial e mensagens de baixa prioridade). Isso causa:
- queda de produtividade,
- ansiedade por inbox sempre cheia,
- perda de e-mails críticos.

## 3) Público-alvo global
- **Profissionais de conhecimento** (freelancers, founders, marketing, vendas, produto)
- **Pequenas e médias empresas** com equipe remota
- **Times de suporte/comercial** que dependem de resposta rápida por e-mail

## 4) Modelo de monetização (assinatura)
- **Plano Free Trial (14 dias)**
- **Plano Pro**: USD 19/mês por usuário
- **Plano Team**: USD 49/mês por equipe + assentos extras
- **Add-ons**: automações avançadas, integrações premium, limites maiores de IA

Economia de tempo mensal + automação justifica ticket e reduz churn.

## 5) Principais funcionalidades (MVP)
- Cadastro e login com JWT
- Dashboard com status de assinatura
- Endpoint de checkout Stripe (assinatura)
- Base para conectar provedores de e-mail
- Regras de classificação (prioridade alta/média/baixa)
- Sugestão de resposta com IA (próximo passo do MVP)

## 6) Código inicial do MVP
Este repositório agora inclui:
- `frontend/` (React + Vite)
- `backend/` (Node + Express + Prisma + SQLite)
- autenticação,
- persistência de usuários,
- criação de checkout de assinatura com Stripe.

## 7) Tecnologias sugeridas
- **Frontend:** React + Vite + CSS (depois pode evoluir para Next.js)
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite no MVP, migrando para PostgreSQL em produção
- **Auth:** JWT (evoluir para OAuth Google/Microsoft)
- **Pagamentos:** Stripe Billing (Checkout + Webhooks)
- **IA:** OpenAI API para sumarização/classificação/respostas

## 8) Layout básico da interface
Layout inicial já implementado:
- **Hero section** com proposta de valor
- **Card de autenticação** (Criar conta / Entrar)
- **Dashboard card** com plano atual e botão de upgrade
- visual minimalista focado em conversão e clareza

## 9) Login + banco + pagamentos
✅ Implementado no código inicial:
- Login e registro (`/auth/register`, `/auth/login`)
- Banco com Prisma (`User` com `subscriptionState` e `stripeCustomerId`)
- Pagamento recorrente via Stripe Checkout (`/billing/create-checkout-session`)

---

## Como rodar localmente

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Próximos passos para escalar para 1M usuários
1. OAuth Gmail/Outlook + permissões granulares
2. Fila assíncrona (Redis + workers) para processar e-mails em lote
3. Webhooks Stripe para ativar/cancelar assinatura automaticamente
4. Observabilidade (OpenTelemetry + métricas de custo por usuário)
5. Infra multi-região + CDN + cache
6. Plano Enterprise com SSO e políticas de compliance
