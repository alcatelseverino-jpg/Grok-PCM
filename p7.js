function revisaFolha(j, itens, fp) {
  const hoje = todayIso();
  const tecOpts = S.tecnicos.filter(t => t.ativo !== false).map(t => [t.id, t.nome]);
  const eqOpts = [...S.equips].sort((a, b) => String(a.codigo || '').localeCompare(String(b.codigo || ''))).map(e => [e.id, `${e.codigo} — ${e.nome}`]);
  const SIT = {novo: 'Novo', ja_gravado: 'Já gravado', atualizar_os: 'Atualizar a OS do registro já gravado', os_diferente: 'Já gravado com outra OS'};
  const regs = j.registros;
  const dv = (r, c) => r.duvidas.includes(c) ? ' dv' : '';
  const linhas = regs.map((r, i) => {
    const marcado = r.situacao === 'novo' || r.situacao === 'atualizar_os';
    return `<tr class="fr" data-fr="${i}"><td><input type="checkbox" data-f="sel"${marcado ? ' checked' : ''}></td><td><input type="number" data-f="lin" min="1" max="${fp?.linhas || 60}" value="${r.linha}" style="width:48px"></td>
      <td><input type="date" data-f="data" class="${dv(r, 'data')}" value="${esc(r.data || '')}" max="${hoje}"></td>
      <td><select data-f="tec" class="${dv(r, 'tecnico')}">${optList(tecOpts, r.tecnico_id, '—')}</select></td>
      <td><select data-f="eq" class="${dv(r, 'equipamento')}">${optList(eqOpts, r.equipamento_id, '—')}</select></td>
      <td><select data-f="tipo" class="${dv(r, 'tipo')}">${optList([['preventiva', 'Preventiva'], ['corretiva', 'Corretiva']], r.tipo, '—')}</select></td>
      <td><input type="time" data-f="hi" class="${dv(r, 'hora_inicio')}" value="${esc(r.hora_inicio || '')}"></td>
      <td><input type="time" data-f="hf" class="${dv(r, 'hora_fim')}" value="${esc(r.hora_fim || '')}"></td>
      <td><input type="text" data-f="desc" class="${dv(r, 'descricao')}" value="${esc(r.descricao || '')}"></td>
      <td><input type="text" data-f="os" class="${dv(r, 'numero_os')}" value="${esc(r.numero_os || '')}" inputmode="numeric" style="width:70px"></td>
      <td class="fsit"><b>${esc(SIT[r.situacao] || r.situacao)}</b>${r.situacao === 'os_diferente' ? ' (OS ' + esc(r.os_gravada) + ')' : ''}${r.duvida_texto ? `<div class="hint">${esc(r.duvida_texto)}</div>` : ''}</td></tr>`;
  }).join('');
  const body = `<div class="full hint">Confira cada linha. Campos em vermelho são os que a IA não leu com certeza${j.observacoes_leitura ? '. Observação da leitura: ' + esc(j.observacoes_leitura) : ''}. Só as linhas marcadas serão gravadas.</div>
    <div class="full"><label style="display:inline">Técnico de todas as linhas: </label><select id="fr_tec" style="width:auto"><option value="">— manter —</option>${optList(tecOpts, '')}</select></div>
    <div class="full" style="overflow:auto"><table class="t frt"><thead><tr><th></th><th title="Linha na folha de papel">Lin.</th><th>Data</th><th>Técnico</th><th>Equipamento</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Descrição</th><th>OS</th><th>Situação</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  openModal({title: 'Conferir registros lidos da folha', body, wide: true, xl: true, closeLabel: 'Fechar', actions: [{label: 'Gravar linhas marcadas', cls: 'pri',
    confirm: () => {
      const n = $$('#dlgBody tr.fr').filter(tr => !tr.classList.contains('feito') && $('[data-f=sel]', tr).checked).length;
      if (!n) throw new Error('Marque pelo menos uma linha.');
      return `Gravar ${n} linha(s) e guardar a(s) foto(s) da folha?`;
    }, confirmLabel: 'Confirmar gravação', run: async () => {
      const ler = tr => { const g = k => $(`[data-f=${k}]`, tr).value; return {i: +tr.dataset.fr, data: g('data'), tec: g('tec'), eq: g('eq'), tipo: g('tipo'), hi: g('hi'), hf: g('hf'), desc: g('desc').trim(), os: g('os').replace(/\D/g, ''), lin: parseInt(g('lin'), 10) || null}; };
      const sel = $$('#dlgBody tr.fr').filter(tr => !tr.classList.contains('feito') && $('[data-f=sel]', tr).checked);
      const prontos = [], erros = [];
      for (const tr of sel) {
        const x = ler(tr), r = regs[x.i], ex = [];
        if (!x.data) ex.push('data'); else if (x.data > hoje) ex.push('data no futuro');
        if (!x.tec) ex.push('técnico'); if (!x.eq) ex.push('equipamento'); if (!x.tipo) ex.push('tipo');
        if (!!x.hi !== !!x.hf) ex.push('preencha início e fim (ou deixe os dois vazios)'); else if (x.hi && x.hf <= x.hi) ex.push('fim deve ser depois do início');
        if (fp && (!x.lin || x.lin > fp.linhas)) ex.push(`linha da folha entre 1 e ${fp.linhas}`);
        let os = null;
        if (x.os) { os = S.os.find(o => String(o.numero) === x.os); if (!os) ex.push(`OS ${x.os} não existe`); else if (x.eq && os.equipamento_id !== x.eq) ex.push(`a OS ${x.os} é de outro equipamento`); }
        if (ex.length) { erros.push(`Linha ${r.linha}: ${ex.join(', ')}`); $('[data-f=sel]', tr).closest('tr').style.outline = '2px solid var(--red)'; continue; }
        tr.style.outline = '';
        const upd = r.situacao === 'atualizar_os' && r.registro_existente_id;
        prontos.push({tr, linha: r.linha, upd, id: r.registro_existente_id, os_id: os?.id || null,
          row: {equipamento_id: x.eq, tecnico_id: x.tec, tipo_manutencao: x.tipo, data_servico: x.data, hora_inicio: x.hi || null, hora_fim: x.hf || null, descricao: x.desc || null, ordem_servico_id: os?.id || null, folha_papel_id: fp?.id || null, linha_folha: fp ? x.lin : null}, x});
      }
      if (erros.length) throw new Error('Corrija antes de gravar → ' + erros.join(' · '));
      if (!revisaFolha.enviado) {
        const novos = prontos.filter(p => !p.upd);
        const base = prontos.length ? prontos : [];
        const tec = moda(base.map(p => p.x.tec)), dia = moda(base.map(p => p.x.data)), d = new Date();
        revisaFolha.ids = [];
        for (const it of itens) {
          const caminho = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.jpg`;
          const {error: e1} = await sb.storage.from('folhas-registro').upload(caminho, it.blob, {contentType: 'image/jpeg'});
          if (e1) throw e1;
          const {data: f, error: e2} = await sb.from('folha_registro').insert({caminho, tecnico_id: tec, data_folha: dia, qtd_registros: novos.length, folha_papel_id: fp?.id || null}).select('id').single();
          if (e2) throw e2;
          revisaFolha.ids.push(f.id);
        }
        revisaFolha.enviado = true;
      }
      let ok = 0; const falhas = [];
      for (const p of prontos) {
        try {
          if (p.upd) {
            if (!p.os_id) throw new Error('informe o número da OS para atualizar.');
            const {data, error} = await sb.from('registro_manutencao').update({ordem_servico_id: p.os_id}).eq('id', p.id).select('id');
            if (error) throw error; if (!data?.length) throw new Error('sem permissão para alterar este registro.');
          } else {
            const {error} = await sb.from('registro_manutencao').insert({...p.row, folha_id: revisaFolha.ids[0] || null});
            if (error) throw error;
          }
          ok++; p.tr.classList.add('feito'); $('[data-f=sel]', p.tr).checked = false; $$('input,select', p.tr).forEach(el => el.disabled = true);
        } catch (e) { falhas.push(`Linha ${p.linha}: ${errMsg(e)}`); p.tr.style.outline = '2px solid var(--red)'; }
      }
      if (ok) { await loadAll(); }
      if (falhas.length) { toast(`${ok} gravada(s), ${falhas.length} com problema.`, 'bad'); throw new Error(`${ok} gravada(s). Não gravou → ` + falhas.join(' · ')); }
      if (fp) { try { await sb.from('folha_papel').update({status: 'lida', lida_em: new Date().toISOString()}).eq('id', fp.id); } catch (_) {} }
      revisaFolha.enviado = false; closeModal(); toast(`${ok} linha(s) gravada(s) e folha guardada.`, 'good');
    }}]});
  revisaFolha.enviado = false;
  if (fp?.tecnico_id) $$('#dlgBody [data-f=tec]').forEach(s => { if (!s.value) { s.value = fp.tecnico_id; s.classList.remove('dv'); } });
  $('#fr_tec').addEventListener('change', e => { if (e.target.value) $$('#dlgBody [data-f=tec]').forEach(s => { if (!s.disabled) { s.value = e.target.value; s.classList.remove('dv'); } }); });
}
const ACAO_L = {inserir: 'novo', atualizar: 'alterado', remover: 'removido', manter: 'igual', bloqueado: 'bloqueado'};
async function openChecklist(gid, eid) {
  if (!S.admin) { toast('Somente o administrador edita checklists.', 'bad'); return; }
  const g = S.grpById.get(gid), eq = eid ? S.eqById.get(eid) : null;
  const {data, error} = await sb.rpc('editor_obter_checklist', {p_grupo_id: gid, p_equipamento_id: eid});
  if (error) { toast(errMsg(error), 'bad'); return; }
  const propria = eid && data.origem === 'equipamento';
  const st = {itens: (data.itens || []).map(i => ({id: (eid && !propria) ? null : i.id, descricao: i.descricao, usado: (eid && !propria) ? 0 : (i.usado_em_os || 0)}))};
  const grab = () => $$('#dlgBody [data-ckitem]').forEach((inp, i) => { if (st.itens[i]) st.itens[i].descricao = inp.value; });
  const draw = () => {
    $('#ckList').innerHTML = st.itens.map((it, i) => `<div class="cki"><span class="muted">${i + 1}</span>
      <input type="text" data-ckitem maxlength="120" value="${esc(it.descricao)}" placeholder="Descrição do item (3 a 120 caracteres)">
      <button type="button" class="ib" data-ckmv="${i}:-1" title="Subir"${i === 0 ? ' disabled' : ''}>↑</button>
      <button type="button" class="ib" data-ckmv="${i}:1" title="Descer"${i === st.itens.length - 1 ? ' disabled' : ''}>↓</button>
      <button type="button" class="ib" data-ckrm="${i}" title="${it.usado ? 'Item já usado em ' + it.usado + ' OS: não pode ser excluído' : 'Remover'}"${it.usado ? ' disabled' : ''}>✕</button>
      ${it.usado ? `<span class="muted" title="Alterar o texto muda também essas OS">usado em ${it.usado} OS</span>` : ''}</div>`).join('') || '<div class="empty">Lista vazia: adicione itens.</div>';
    $('#ckAdd').disabled = st.itens.length >= 15;
  };
  const origem = !eid ? `Checklist do grupo <b>${esc(g?.nome || '')}</b>. Vale para todos os equipamentos do grupo que não têm lista própria.`
    : propria ? `Lista <b>própria</b> do equipamento <b>${esc(eq?.codigo || '')}</b> (substitui a do grupo).`
    : `O equipamento <b>${esc(eq?.codigo || '')}</b> usa hoje a lista do grupo. Se você salvar, ele passa a ter uma <b>lista própria</b> (a do grupo não muda).`;
  const body = `<div class="full hint">${origem}</div><div class="full"><div id="ckList"></div><button type="button" class="btn" id="ckAdd">＋ Item</button>` +
    (propria ? ' <button type="button" class="btn dan" id="ckReset">Voltar a usar o checklist do grupo</button>' : '') +
    '</div><div class="full hint muted">Até 15 itens, 3 a 120 caracteres, sem repetição.</div>';
  openModal({title: eid ? `Checklist — ${eq?.codigo || eq?.nome}` : `Checklist — ${g?.nome || ''}`, body, wide: true, actions: [{label: 'Salvar checklist', cls: 'pri',
    confirm: async () => {
      grab();
      const {data: plano, error: e1} = await sb.rpc('editor_salvar_checklist', {p_grupo_id: gid, p_equipamento_id: eid, p_itens: st.itens.map(i => ({id: i.id, descricao: i.descricao})), p_aplicar: false});
      if (e1) throw e1;
      const ruim = (plano || []).filter(p => p.acao === 'bloqueado');
      if (ruim.length) throw new Error(ruim.map(p => `“${p.descricao}”: ${p.motivo}`).join(' · '));
      const c = a => (plano || []).filter(p => p.acao === a).length;
      return `Salvar: ${c('inserir')} novo(s), ${c('atualizar')} alterado(s), ${c('remover')} removido(s), ${c('manter')} igual(is).`;
    },
    confirmLabel: 'Confirmar e salvar', run: async () => {
      grab();
      const {error: e2} = await sb.rpc('editor_salvar_checklist', {p_grupo_id: gid, p_equipamento_id: eid, p_itens: st.itens.map(i => ({id: i.id, descricao: i.descricao})), p_aplicar: true});
      if (e2) throw e2;
      closeModal(); toast('Checklist salvo.', 'good'); await loadAll();
    }}]});
  draw();
  $('#ckAdd').addEventListener('click', () => { grab(); st.itens.push({id: null, descricao: '', usado: 0}); draw(); });
  $('#ckList').addEventListener('click', e => {
    const mv = e.target.closest('[data-ckmv]'), rm = e.target.closest('[data-ckrm]');
    if (mv) { grab(); const [i, d] = mv.dataset.ckmv.split(':').map(Number); const j = i + d; if (st.itens[j]) { [st.itens[i], st.itens[j]] = [st.itens[j], st.itens[i]]; draw(); } }
    if (rm) { grab(); st.itens.splice(Number(rm.dataset.ckrm), 1); draw(); }
  });
  const rs = $('#ckReset');
  if (rs) rs.addEventListener('click', async () => {
    if (!twoStep(rs, 'Clique de novo: usar o do grupo')) return;
    try {
      const {data: r1, error: e3} = await sb.rpc('editor_remover_checklist_equipamento', {p_equipamento_id: eid, p_aplicar: true});
      if (e3) throw e3; if (!r1?.ok) throw new Error(r1?.motivo || 'Não foi possível remover a lista própria.');
      closeModal(); toast('O equipamento voltou a usar o checklist do grupo.', 'good'); await loadAll();
    } catch (err) { showErr(err); }
  });
}
