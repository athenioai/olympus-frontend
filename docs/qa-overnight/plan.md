# QA Overnight — Olympus

Roteiro modular de QA regressivo + security. Cada módulo é autocontido, executado em um turno de Claude Code, gera um arquivo `.md` em `/Users/lucas-couto/Downloads/`.

## Premissas confirmadas (2026-04-22)

- Ambiente de teste, sem usuários reais
- Backend em `localhost:8000` (prod smoke PASS recente)
- Frontend Next.js 16 em `/Users/lucas-couto/www/athenio/olympus/olympus-frontend`
- Credencial admin: `admin@athenio.ai` (senha a descobrir no setup — `.env.local` / seed / `e2e/msw/state.ts`)
- **Liberação pra destruir dados**: criar/deletar em massa, seeds podem ficar sujos
- Playwright já instalado, dois configs: `playwright.config.ts` (real) e `playwright.msw.config.ts`

## Ferramentas dentro do Claude Code

- Playwright via `npx playwright test` (controla Chromium real — equivale ao Claude Chrome)
- Bash para curl (headers), jq (RSC payload parse), fetch em loop (rate limit)
- Read/Write para salvar specs em `/tmp/qa-olympus/` e .md finais em `~/Downloads/`

## Numeração

Bugs começam em **46** (último registrado foi 45). Security findings usam prefixo `SEC-NN` independente.

## Módulos (executar em ordem, um por turno)

| # | Módulo | Escopo | Output | Estimativa |
|---|--------|--------|--------|------------|
| M0 | Setup + baseline | descobrir senha, validar backend up, criar fixture de login, testar happy path mínimo | `docs/qa-overnight/setup-notes.md` | 10-15 min |
| M1 | Auth | login, signup, forgot, reset + bruteforce + token leak + session fixation | `modulo1-auth.md` | 15-20 min |
| M2 | Dashboard + nav global | dashboard, sidebar, command palette ⌘K + RSC leak + cache headers | `modulo2-dashboard.md` | 10-15 min |
| M3 | CRM | kanban, leads list, leads detail + IDOR cross-owner + XSS em nomes | `modulo3-crm.md` | 20-25 min |
| M4 | Conversations | chat, handoff + XSS em mensagens + ownership | `modulo4-conversations.md` | 15-20 min |
| M5 | Calendar | agenda, appointments + timezone + validações | `modulo5-calendar.md` | 10-15 min |
| M6 | Services + Products | CRUD + upload maligno (SVG-as-PNG, executável, 100MB) + magic bytes | `modulo6-catalog.md` | 20-25 min |
| M7 | Settings | 6 abas + social URL validation + RSC loop recorrência + cache | `modulo7-settings.md` | 20-25 min |
| M8 | Admin | users/plans/subs/invoices/avatars + auth vertical bypass + IDOR | `modulo8-admin.md` | 25-30 min |
| M9 | Logout + proteção de rotas | logout em todas rotas + token invalidation + session cleanup | `modulo9-logout.md` | 10-15 min |
| SEC | Security cross-módulo | bundle grep, headers, CSP, rate limit global, CSRF, injection em todos os forms | `security-cross.md` | 20-30 min |
| STRESS | Stress + i18n + a11y + network | 500 leads, Lighthouse a11y, slow 3G, offline | `stress-a11y.md` | 20-30 min |
| SUMMARY | Consolidação | somar bugs por severidade, top 10, cleanup /tmp | `summary-2026-04-22.md` | 10 min |

Total: ~13 turnos, estimativa 3-5h total.

## Critérios de bug

- Reproduzível **2×** via Playwright (rodar o test 2 vezes, ambas falham).
- Evidência anexada: screenshot (`/tmp/qa-olympus/shots/m{N}-bug{NN}.png`), trace (`trace.zip` do Playwright), trecho de console/network.
- Severidade: `crítico` (feature inacessível) | `alto` (quebra fluxo) | `médio` (UX/validação) | `baixo` (cosmético/i18n).

## Quando retomar

Este arquivo fica versionado. O arquivo `state.json` na mesma pasta mantém:
- Último módulo completo
- Próximo a executar
- Contagem corrente de bugs
- Senha descoberta no M0 (se persistente)

Em conversa nova, leia `state.json` e execute o `next_module`.

## Regras de execução

1. **NÃO modificar código de aplicação** — só criar specs em `/tmp/qa-olympus/`.
2. **NÃO commitar nada** — exceto o próprio roteiro (plan.md + state.json), se o usuário pedir.
3. **Cleanup** no final (SUMMARY): apagar `/tmp/qa-olympus/specs/*.spec.ts` mas manter screenshots + traces.
4. Ao terminar cada módulo: atualizar `state.json`, responder ao usuário em ≤5 linhas (módulo + contagem de bugs + próximo).
5. Se Playwright falhar por infra (porta ocupada, backend down), documentar em `state.json.blocker` e parar aquele módulo — não bloquear o QA inteiro.

## Como falar comigo

Respostas do usuário esperadas:
- `ok` / `próximo` / `continua` → executa próximo módulo do state
- `skip M{N}` → pula um módulo específico
- `refaz M{N}` → re-executa um módulo (sobrescreve .md)
- `status` → só reporto estado sem executar nada
