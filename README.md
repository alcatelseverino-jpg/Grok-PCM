# Grok-PCM

**Gestor de Registros de Manutenção** — app mobile-first para técnicos lançarem a folha do dia.

## Status atual: **Versão 1**

| Etapa | Status |
|-------|--------|
| MVP | ✅ Concluído |
| **Versão 1** | ✅ Concluído |
| Versão 2 | Planejada |

## O que tem na Versão 1

### Já no MVP
- Tema escuro mobile-first
- Folha do Dia (técnico, data, intervalo)
- Linha do tempo visual 00h–24h
- Detecção de conflitos de horário
- Rascunhos + localStorage
- Meus Registros com busca e filtro

### Novo na Versão 1
- **📷 Ler folha por foto** — abre câmera/galeria, processa com IA (simulada) e importa linhas com confirmação
- **✦ Agente de IA** — botão flutuante com chat (horas, conflitos, equipamentos, sugestões de descrição)
- **Exportar PDF** da folha do dia
- Remover linhas com um toque
- Clique na barra da timeline para editar

## Como testar

1. Abra: https://github.com/alcatelseverino-jpg/Grok-PCM/blob/main/index.html  
2. Ou baixe o `index.html` e abra no navegador (melhor no celular).
3. Entre com um nome (ex: Douglas).
4. Teste: + Linha, foto, agente IA (botão ✦), Gravar dia, Meus Registros.

## Próximo: Versão 2

- OCR real com modelo de visão
- Arrastar blocos na linha do tempo
- Painéis de gestão (aderência, padrões)
- Sincronização com Supabase
- Modo offline mais robusto

---

Desenvolvido para o ecossistema **GestorPCM**.
