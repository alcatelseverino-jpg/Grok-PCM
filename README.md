# Grok-PCM

**Gestor de Registros de Manutenção** — aplicativo mobile-first para técnicos lançarem a folha do dia de forma rápida, segura e inteligente.

## Visão

Substituir o registro em papel e planilhas por um fluxo moderno:

- Folha do Dia com linha do tempo visual
- Detecção de conflitos de horário
- Rascunhos automáticos + modo offline
- (Futuro) Leitura de folha por foto + IA
- (Futuro) Agente de IA para ajudar o técnico

## Etapas de desenvolvimento

| Etapa | Status | Foco principal |
|-------|--------|----------------|
| **MVP** | Em desenvolvimento | Folha do Dia confiável + offline + Meus Registros |
| **Versão 1** | Planejada | Foto + OCR, arrastar na timeline, agente IA básico |
| **Versão 2** | Planejada | IA avançada + painéis de gestão |

## MVP — O que está incluído

- Tema escuro mobile-first (inspirado no RG Manutenção)
- Seleção de técnico e data
- Intervalo opcional com desconto automático
- Linhas de manutenção (equipamento + horário + descrição)
- Linha do tempo visual 00h–24h
- Detecção de sobreposição de horários
- Rascunhos salvos automaticamente (localStorage)
- Funcionamento offline básico
- Tela **Meus Registros** (últimos 30 dias)
- Interface 100% em português do Brasil

## Como rodar

Abra o arquivo `index.html` diretamente no navegador ou sirva com qualquer servidor estático.

```bash
# Exemplo simples
npx serve .
```

## Stack

- HTML + CSS + JavaScript vanilla
- LocalStorage / IndexedDB (offline)
- Preparado para integração futura com Supabase

## Roadmap resumido

1. **MVP** ← estamos aqui
2. Versão 1 — OCR por foto + IA + voz
3. Versão 2 — Gestão avançada + inteligência proativa

---

Desenvolvido para o ecossistema **GestorPCM**.
