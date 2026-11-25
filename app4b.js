
function openEquip(id) {
  const e = id ? S.eqById.get(id) : null, row = id ? S.edEquips.find(x => x.equipamento_id === id) : null;
  const gid = e?.grupo_id ?? S.selGrupo ?? '';
  const body =
    fld('Código', `<input id="e_cod" value="${esc(e?.codigo || '')}" class="mono">`, {hint: 'Único no banco.'}) +
    fld('Nome *', `<input id="e_nome" value="${esc(e?.nome || '')}">`) +
    fld('Grupo', `<select id="e_grp">${optList(S.grupos.filter(g => g.ativo || g.id === gid).map(g => [g.id, g.nome]), gid, '— sem grupo —')}</select>`) +
    fld('Status', `<select id="e_st">${optList(Object.entries(L.eq), e?.status || 'operando')}</select>`) +
    fld('Criticidade', `<select id="e_cr">${optList(Object.entries(L.crit), e?.criticidade || 'media', '—')}</select>`) +
    fld('Fabricante', `<input id="e_fab" value="${esc(e?.fabricante || '')}">`) +
    fld('Modelo', `<input id="e_mod" value="${esc(e?.modelo || '')}">`) +
    fld('Nº de série', `<input id="e_ser" value="${esc(e?.numero_serie || '')}">`) +
    fld('Descrição', `<textarea id="e_desc">${esc(e?.descricao || '')}</textarea>`, {full: true}) +
    `<div class="full chk"><input type="checkbox" id="e_geral"${e?.geral ? ' checked' : ''}><label for="e_geral">Código geral (mão de obra do grupo/serviço)</label></div>` +
    (id ? fld('Periodicidade própria (dias, 1–365)', `<input id="e_dias" type="number" min="1" max="365" value="${row?.periodicidade_propria_dias ?? ''}">`, {hint: `Vazio = usa a do grupo.`}) +
      fld('Observação da periodicidade', `<input id="e_obs" value="${esc(row?.observacao_periodicidade || '')}">`) +
      '<div class="full"><button type="button" class="btn" id="e_sim">Simular periodicidade</button><div class="hint" id="simOut"></div></div>' +
      '<div class="full"><button type="button" class="btn" id="e_ck">☑ Editar checklist deste equipamento</button></div>' : '');
  openModal({title: id ? `Editar equipamento — ${e?.codigo || e?.nome}` : 'Novo equipamento', wide: true, body, actions: [{label: 'Salvar', cls: 'pri', run: async () => {
    const nome = nz($('#e_nome').value); if (!nome) throw new Error('Informe o nome do equipamento.');
    const f = {codigo: nz($('#e_cod').value), nome, grupo_id: $('#e_grp').value || null, status: $('#e_st').value, criticidade: $('#e_cr').value || null,
      fabricante: nz($('#e_fab').value), modelo: nz($('#e_mod').value), numero_serie: nz($('#e_ser').value), descricao: nz($('#e_desc').value), geral: $('#e_geral').checked};
    let aviso = '';
    if (id) {
      const {data, error} = await sb.from('equipamento').update(f).eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Nenhuma linha alterada: somente administradores editam equipamentos.');
      const d = $('#e_dias').value === '' ? null : parseInt($('#e_dias').value, 10), ob = nz($('#e_obs').value);
      if (d !== (row?.periodicidade_propria_dias ?? null) || (d !== null && ob !== (row?.observacao_periodicidade ?? null))) {
        const {data: r, error: e2} = await sb.rpc('editor_salvar_periodicidade_equipamento', {p_equipamento_id: id, p_dias: d, p_observacao: ob, p_aplicar: true});
        if (e2) throw e2; if (!r?.ok) aviso = ' Periodicidade não aplicada: ' + (r?.motivo || '');
      }
    } else {
      const {error} = await sb.from('equipamento').insert(f); if (error) throw error;
    }
    closeModal(); toast('Equipamento salvo.' + aviso, aviso ? '' : 'good'); await loadAll();
  }}]});
  const eck = $('#e_ck');
  if (eck) eck.addEventListener('click', () => { closeModal(); openChecklist(e?.grupo_id ?? S.selGrupo, id); });
  const sim = $('#e_sim');
  if (sim) sim.addEventListener('click', async () => {
    const d = $('#e_dias').value === '' ? null : parseInt($('#e_dias').value, 10);
    const {data, error} = await sb.rpc('editor_salvar_periodicidade_equipamento', {p_equipamento_id: id, p_dias: d, p_observacao: nz($('#e_obs').value), p_aplicar: false});
    $('#simOut').textContent = error ? errMsg(error) : simText(data);
  });
}
const inRange = (v, de, ate) => { if (!v) return false; const k = dayKey(v); return (!de || k >= de) && (!ate || k <= ate); };
const minutesBetween = (a, b) => { if (!a || !b) return 0; const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number); return Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1)); };
function renderProd() {
  const p = S.f.prod;
  const okEq = id => !p.grupo || S.eqById.get(id)?.grupo_id === p.grupo;
  const okTec = id => !p.tec || id === p.tec;
  const done = S.os.filter(o => o.status === 'concluida' && inRange(o.data_conclusao, p.de, p.ate) && okEq(o.equipamento_id) && okTec(o.tecnico_id));
  const opened = S.os.filter(o => inRange(o.data_abertura, p.de, p.ate) && okEq(o.equipamento_id) && okTec(o.tecnico_id));
  const backlog = S.os.filter(o => o.status !== 'concluida' && okEq(o.equipamento_id) && okTec(o.tecnico_id));
  const regs = S.regs.filter(r => r.data_servico && (!p.de || r.data_servico >= p.de) && (!p.ate || r.data_servico <= p.ate) && okEq(r.equipamento_id) && okTec(r.tecnico_id));
  const mins = r => minutesBetween(r.hora_inicio, r.hora_fim);
  const sum = list => list.reduce((s, r) => s + mins(r), 0);
  const prevRegs = regs.filter(r => r.tipo_manutencao === 'preventiva'), corrRegs = regs.filter(r => r.tipo_manutencao === 'corretiva');
  $('#pKpis').innerHTML = [
    [done.length, 'OS concluídas'], [regs.length, 'Registros de manutenção'], [nf1(sum(regs) / 60), 'Horas registradas'],
    [nf1(sum(prevRegs) / 60), 'Horas preventivas'], [nf1(sum(corrRegs) / 60), 'Horas corretivas'],
    [opened.length, 'OS abertas no período'], [backlog.length, 'Em aberto agora']
  ].map(([v, t]) => `<div class="kpi"><b>${v}</b><span>${t}</span></div>`).join('');
  const by = new Map();
  const get = id => { if (!by.has(id)) by.set(id, {n: 0, regs: 0, min: 0, prev: 0, corr: 0}); return by.get(id); };
  done.forEach(o => { get(o.tecnico_id).n++; });
  const hoje = iso(new Date());
  const isMei = id => S.tecById.get(id)?.regime === 'mei';
  const inPer = d => d && (!p.de || d >= p.de) && (!p.ate || d <= p.ate) && d <= hoje;
  const minDia = d => { const w = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)).getDay(); return w === 0 ? 0 : w === 6 ? 240 : 480; };
  const diasClt = new Set(), diasMei = new Map();
  S.regs.forEach(r => {
    if (!inPer(r.data_servico)) return;
    if (!isMei(r.tecnico_id)) diasClt.add(r.data_servico);
    else { if (!diasMei.has(r.tecnico_id)) diasMei.set(r.tecnico_id, new Set()); diasMei.get(r.tecnico_id).add(r.data_servico); }
  });
  const feriados = new Set((S.feriados || []).map(f => f.data));
  const emAus = (id, d) => (S.ausencias || []).some(a => a.tecnico_id === id && d >= a.data_inicio && d <= a.data_fim);
  const dispMin = id => {
    let dias, ini = '';
    const fim = p.ate && p.ate < hoje ? p.ate : hoje;
    if (isMei(id)) { const meus = diasMei.get(id); if (!meus || !meus.size) return 0; ini = [...meus].sort()[0]; dias = new Set([...diasClt, ...meus]); }
    else dias = diasClt;
    let m = 0;
    dias.forEach(d => { if (d >= ini && d <= fim && !feriados.has(d) && !emAus(id, d)) m += minDia(d); });
    return m;
  };
  regs.forEach(r => { const g = get(r.tecnico_id), m = mins(r); g.regs++; g.min += m; if (r.tipo_manutencao === 'preventiva') g.prev += m; else if (r.tipo_manutencao === 'corretiva') g.corr += m; });
  const rows = [...by.entries()].sort((a, b) => b[1].min - a[1].min || b[1].n - a[1].n);
  $('#pBody').innerHTML = rows.map(([id, r]) => `<tr style="cursor:default"><td>${esc(S.tecById.get(id)?.nome || '—')}</td><td class="num">${r.n}</td><td class="num">${r.regs}</td><td class="num">${nf1(r.min / 60)}</td><td class="num">${nf1(r.prev / 60)}</td><td class="num">${nf1(r.corr / 60)}</td>${(() => { const d = dispMin(id), pc = d ? Math.round(100 * r.min / d) : null; return `<td class="num">${nf1(d / 60)}</td><td class="num"><b>${pc == null ? '—' : pc + '%'}</b></td><td style="width:60px"><div class="bar"><i style="width:${Math.min(100, pc || 0)}%"></i></div></td>`; })()}</tr>`).join('')
    || '<tr><td colspan="9" class="empty" style="cursor:default">Sem atividade no período/filtros.</td></tr>';
  if (rows.length) {
    const T = rows.reduce((t, [id, r]) => ({n: t.n + r.n, regs: t.regs + r.regs, min: t.min + r.min, prev: t.prev + r.prev, corr: t.corr + r.corr, disp: t.disp + dispMin(id)}), {n: 0, regs: 0, min: 0, prev: 0, corr: 0, disp: 0});
    const pc = T.disp ? Math.round(100 * T.min / T.disp) : null;
    $('#pBody').insertAdjacentHTML('beforeend', `<tr class="tot" style="cursor:default"><td><b>TOTAL GRANALHA</b></td><td class="num"><b>${T.n}</b></td><td class="num"><b>${T.regs}</b></td><td class="num"><b>${nf1(T.min / 60)}</b></td><td class="num"><b>${nf1(T.prev / 60)}</b></td><td class="num"><b>${nf1(T.corr / 60)}</b></td><td class="num"><b>${nf1(T.disp / 60)}</b></td><td class="num"><b>${pc == null ? '—' : pc + '%'}</b></td><td></td></tr>`);
  }
  const semOs = regs.filter(r => !r.ordem_servico_id).length;
  $('#pNote').textContent = regs.length
    ? `Produtividade = horas registradas ÷ horas disponíveis. ${semOs} de ${regs.length} registros sem OS vinculada.`
    : '';
  $('#pDist').innerHTML = relDistribuicao(p.de, p.ate);
}
function renderMM() {
  const m = S.f.mm, q = m.eq.trim().toLowerCase();
  const rows = S.os.filter(o => {
    if (o.tipo !== 'corretiva' || o.status !== 'concluida' || !inRange(o.data_abertura, m.de, m.ate)) return false;
    const e = S.eqById.get(o.equipamento_id);
    if (m.grupo && e?.grupo_id !== m.grupo) return false;
    return !q || ((e?.codigo || '') + ' ' + (e?.nome || '')).toLowerCase().includes(q);
  });
  const by = new Map();
  rows.forEach(o => { if (!by.has(o.equipamento_id)) by.set(o.equipamento_id, []); by.get(o.equipamento_id).push(o); });
  const dur = o => o.tempo_gasto_minutos ?? (o.data_conclusao ? (new Date(o.data_conclusao) - new Date(o.data_abertura)) / 60000 : null);
  const allDur = [], allGap = [], list = [];
  by.forEach((arr, id) => {
    arr.sort((a, b) => new Date(a.data_abertura) - new Date(b.data_abertura));
    const ds = arr.map(dur).filter(v => v != null);
    const gaps = arr.slice(1).map((o, i) => (new Date(o.data_abertura) - new Date(arr[i].data_abertura)) / 86400000);
    allDur.push(...ds); allGap.push(...gaps);
    const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
    list.push({id, n: arr.length, mttr: avg(ds) == null ? null : avg(ds) / 60, mtbf: avg(gaps)});
  });
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const gm = avg(allDur), gb = avg(allGap);
  $('#mKpis').innerHTML = [
    [rows.length, 'Corretivas concluídas'], [by.size, 'Equipamentos com falha'],
    [gm == null ? '—' : nf1(gm / 60), 'MTTR médio (horas)'], [gb == null ? '—' : nf1(gb), 'MTBF médio (dias)']
  ].map(([v, t]) => `<div class="kpi"><b>${v}</b><span>${t}</span></div>`).join('');
  list.sort((a, b) => b.n - a.n || (S.eqById.get(a.id)?.codigo || '').localeCompare(S.eqById.get(b.id)?.codigo || '', 'pt-BR', {numeric: true}));
  $('#mBody').innerHTML = list.map(r => {
    const e = S.eqById.get(r.id);
    return `<tr style="cursor:default"><td><b class="mono">${esc(e?.codigo || '')}</b> <span class="muted">${esc(e?.nome || '')}</span></td><td class="num">${r.n}</td><td class="num">${nf1(r.mttr)}</td><td class="num">${nf1(r.mtbf)}</td></tr>`;
  }).join('') || '<tr><td colspan="4" class="empty" style="cursor:default">Nenhuma OS corretiva concluída neste filtro.</td></tr>';
}
const bind = (id, obj, key, fn) => { const el = $(id); el.value = obj[key] ?? ''; el.addEventListener('input', e => { obj[key] = e.target.value; fn(); }); };
bind('#pDe', S.f.prod, 'de', renderProd); bind('#pAte', S.f.prod, 'ate', renderProd);
bind('#pTec', S.f.prod, 'tec', renderProd); bind('#pGrp', S.f.prod, 'grupo', renderProd);
bind('#mDe', S.f.mm, 'de', renderMM); bind('#mAte', S.f.mm, 'ate', renderMM);
bind('#mGrp', S.f.mm, 'grupo', renderMM); bind('#mEq', S.f.mm, 'eq', renderMM);
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#tabProd').hidden = b.dataset.tab !== 'prod'; $('#tabMM').hidden = b.dataset.tab !== 'mm';
}));
$('#dlgX').addEventListener('click', closeModal);
boot();
