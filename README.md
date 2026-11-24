# Grok-PCM

Painel de manutenção **tema escuro**, no estilo do GestorPCM / pcm-maintenance.

## Login

- E-mail + senha (mesmo **Supabase Auth** do GestorPCM)
- URL: `https://zvaexuejxhjuckllwpqk.supabase.co`

## Menus no topo

| Menu | Função |
|------|--------|
| **Folha do Dia** | Registro diário, linha do tempo, foto+IA, agente IA |
| **Ordens de serviço** | Lista OS do Supabase |
| **Calendário** | Preventivas (vencidos / próximos) |
| **Equipamentos** | Grupos e equipamentos |
| **Indicadores** | Resumo de OS |
| **Meus Registros** | Histórico local da folha |

Botões **↻ Atualizar** e **Sair** no canto direito do topo.

## Como abrir

Abra o `index.html` do repositório no navegador (ou sirva com `npx serve`).

## Stack

- HTML/CSS/JS + Supabase JS v2
- Folha do Dia com rascunhos em localStorage
- Dados de OS/equipamentos/calendário vindos do Supabase
