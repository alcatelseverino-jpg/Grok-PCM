# Grok-PCM

**Clone completo do pcm-maintenance em tema escuro.**

## O que inclui (igual ao GestorPCM / pcm-maintenance)

- Login e-mail + senha (Supabase Auth)
- **Ordens de serviço** — lista, detalhe, registros, abrir OS, imprimir PDF, exportar Excel
- **Calendário preventivo** — vencidos / próximos / em dia
- **Grupos e equipamentos** — CRUD (admin)
- **Indicadores** — produtividade, MTTR/MTBF, relatório
- **Gestão** — OS fora do prazo, aderência, paradas
- **Equipe e calendário** — regime, feriados, ausências
- **Folhas de papel** — gerar e controlar folhas numeradas
- **Ler folha por foto** — OCR / importação
- **Não conformidades** — checklist Não OK
- **Atualizar** e **Sair**

## Arquivos

| Arquivo | Função |
|---------|--------|
| `index.html` | Interface (HTML) |
| `styles.css` | Tema escuro |
| `app1.js` … `app4.js` | Lógica completa (mesmo JS do pcm-maintenance) |

## Como usar

1. Abra o repositório no GitHub Pages **ou** baixe os arquivos e sirva com um servidor local:
   ```bash
   npx serve .
   ```
2. Entre com o **mesmo e-mail e senha** do GestorPCM.

## Tema

Fundo `#0b1220`, cards escuros, destaque amarelo (`#f59e0b`), badges adaptados ao dark mode.

Base: [pcm-maintenance](https://github.com/alcatelseverino-jpg/pcm-maintenance).
