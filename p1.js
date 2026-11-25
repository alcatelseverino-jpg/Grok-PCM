'use strict';
/* ====================================================================
   CONFIGURAÇÃO — projeto Supabase "GestorPCM"
   A chave abaixo é a chave PÚBLICA (publishable). A segurança real é
   feita pelas políticas RLS do banco; sem login nada é lido/gravado.
   ==================================================================== */
const SUPABASE_URL = 'https://zvaexuejxhjuckllwpqk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_W1xzLOqVqIu2d-vVC4n1kw_RWb97Q6h';
const TZ = 'America/Sao_Paulo';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
const fmtDate = v => v ? new Date(v).toLocaleDateString('pt-BR', {timeZone: TZ}) : '—';
const fmtDT   = v => v ? new Date(v).toLocaleString('pt-BR', {timeZone: TZ, dateStyle: 'short', timeStyle: 'short'}) : '—';
const dayKey  = v => new Date(v).toLocaleDateString('en-CA', {timeZone: TZ});
const iso     = d => d.toLocaleDateString('en-CA');
const nf1     = v => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const firstOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const nz = v => { v = (v ?? '').toString().trim(); return v === '' ? null : v; };
const L = {
  os:   {aberta: 'Aberta', em_execucao: 'Em execução', concluida: 'Concluída'},
  prio: {baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente'},
  tipo: {preventiva: 'Preventiva', corretiva: 'Corretiva', checklist: 'Checklist'},
  eq:   {operando: 'Operando', em_manutencao: 'Em manutenção', parado_com_defeito: 'Parado com defeito', desativado: 'Desativado'},
  crit: {baixa: 'Baixa', media: 'Média', alta: 'Alta'},
  cal:  {atrasado: 'Vencido', proximo: 'Próximo a vencer', ok: 'Em dia'},
  res:  {ok: 'OK', nao_ok: 'Não OK', na: 'N/A'}
};
const S = {
  user: null, perfil: null, admin: false,
  tecnicos: [], tecById: new Map(),
  equips: [], eqById: new Map(), eqByCod: new Map(),
  grupos: [], grpById: new Map(),
  os: [], cal: [], calByEq: new Map(), regs: [], regd: [], regOS: null, planoById: new Map(),
  edGrupos: [], selGrupo: null, edEquips: [],
  f: {
    os:  {q: '', status: 'abertas', grupo: '', mode: 'semana', ref: iso(new Date())},
    cal: {month: firstOfMonth(), st: {atrasado: true, proximo: true, ok: true}, grupo: '', eq: '', de: '', ate: '', sel: null},
    prod:{de: iso(firstOfMonth()), ate: iso(new Date()), tec: '', grupo: ''},
    mm:  {de: '', ate: '', grupo: '', eq: ''}
  }
};
let sb = null;
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 7000 : 3500);
}
function errMsg(e) {
  if (!e) return 'Erro desconhecido.';
  const m = e.message || String(e), d = e.details ? ' (' + e.details + ')' : '';
  switch (e.code) {
    case '42501': return 'Sem permissão para esta operação (regra de segurança do banco). ' + m;
    case '23505': return 'Valor duplicado: já existe um registro com esse valor único.' + d;
    case '23503': return 'Referência inválida ou registro em uso por outra tabela.' + d;
    case '23514': return 'Valor não aceito pelas regras do banco: ' + m + d;
    case '23502': return 'Campo obrigatório vazio: ' + m;
    default: return m + d;
  }
}
function showErr(e) {
  const msg = errMsg(e);
  const box = $('#dlgErr');
  if ($('#dlg').open && box) { box.textContent = msg; box.hidden = false; box.scrollIntoView({block: 'nearest'}); }
  else toast(msg, 'bad');
}
function setBusy(b) { $('#busy').hidden = !b; }
function openModal({title, body, actions = [], wide = false, xl = false, closeLabel = 'Cancelar'}) {
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = title;
  $('#dlgBody').innerHTML = body + '<div class="ask" id="dlgAsk" hidden></div><div class="err" id="dlgErr" hidden></div>';
  dlg.classList.toggle('wide', wide); dlg.classList.toggle('xl', xl);
  const foot = $('#dlgFoot'); foot.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.type = 'button'; cancel.className = 'btn'; cancel.textContent = closeLabel;
  cancel.addEventListener('click', closeModal); foot.appendChild(cancel);
  actions.forEach(a => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ' + (a.cls || ''); b.textContent = a.label;
    let armed = false;
    b.addEventListener('click', async () => {
      const err = $('#dlgErr'); if (err) err.hidden = true;
      if (a.confirm) {
        const ask = $('#dlgAsk');
        if (!armed) {
          let msg = a.confirm;
          if (typeof msg === 'function') { b.disabled = true; try { msg = await msg(); } catch (e) { showErr(e); return; } finally { b.disabled = false; } }
          armed = true; b.textContent = a.confirmLabel || 'Confirmar';
          if (ask) { ask.textContent = msg; ask.hidden = false; }
          setTimeout(() => { if (armed && b.isConnected) { armed = false; b.textContent = a.label; if (ask) ask.hidden = true; } }, 8000);
          return;
        }
        armed = false; if (ask) ask.hidden = true;
      }
      b.disabled = true;
      try { await a.run(); } catch (e) { showErr(e); } finally { b.disabled = false; b.textContent = a.label; }
    });
    foot.appendChild(b);
  });
  if (!dlg.open) dlg.showModal();
}
function closeModal() { const d = $('#dlg'); if (d.open) d.close(); }
const fld = (label, html, opt = {}) =>
  `<div class="${opt.full ? 'full' : ''}"><label>${label}</label>${html}${opt.hint ? `<div class="hint">${opt.hint}</div>` : ''}</div>`;
const optList = (pairs, cur, blank) =>
  (blank != null ? `<option value="">${esc(blank)}</option>` : '') +
  pairs.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(cur ?? '') ? ' selected' : ''}>${esc(t)}</option>`).join('');
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
function showApp()   { $('#login').hidden = true; $('#app').hidden = false; }
async function boot() {
  if (!window.supabase) {
    $('#lErr').textContent = 'Não foi possível carregar a biblioteca do Supabase.';
    $('#lErr').hidden = false; $('#lBtn').disabled = true; return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth: {persistSession: true, autoRefreshToken: true}});
  sb.auth.onAuthStateChange((ev, session) => {
    setTimeout(() => {
      if (session?.user) {
        if (!S.user || S.user.id !== session.user.id) { S.user = session.user; startApp(); }
      } else { S.user = null; showLogin(); }
    }, 0);
  });
}
$('#loginForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = $('#lBtn'), err = $('#lErr');
  btn.disabled = true; err.hidden = true;
  const {error} = await sb.auth.signInWithPassword({email: $('#lEmail').value.trim(), password: $('#lPass').value});
  btn.disabled = false;
  if (error) { err.textContent = error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message; err.hidden = false; }
});
$('#btnOut').addEventListener('click', async () => { await sb.auth.signOut(); });
$('#btnReload').addEventListener('click', () => loadAll().catch(showErr));
async function startApp() {
  showApp();
  try {
    const {data: p} = await sb.from('perfil').select('nome,papel').eq('id', S.user.id).maybeSingle();
    S.perfil = p; S.admin = p?.papel === 'admin';
  } catch (_) { S.admin = false; }
  $('#userChip').textContent = (S.perfil?.nome || S.user.email) + ' · ' + (S.admin ? 'administrador' : 'técnico');
  $('#admNote').hidden = S.admin;
  $('#btnNewG').hidden = !S.admin; $('#btnNewE').hidden = !S.admin;
  try { await loadAll(); } catch (e) { toast(errMsg(e), 'bad'); }
}
async function fetchAll(table, select, orderCol) {
  const out = [], size = 1000;
  for (let from = 0; ; from += size) {
    let q = sb.from(table).select(select).range(from, from + size - 1);
    [].concat(orderCol || []).forEach(c => { q = q.order(c, {ascending: false}); });
    const {data, error} = await q;
    if (error) throw error;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}
async function loadAll() {
  setBusy(true);
  try {
    const [tec, eq, gr, os, cal, regs, regd, planos, edg, ncs, fers, auss] = await Promise.all([
      fetchAll('tecnico', 'id,nome,matricula,ativo,regime', 'id'),
      fetchAll('equipamento', 'id,codigo,nome,descricao,grupo_id,localizacao_id,fabricante,modelo,numero_serie,status,criticidade,geral', 'id'),
      fetchAll('grupo_equipamento', 'id,nome,descricao,codigo_base,ativo', 'id'),
      fetchAll('ordem_servico', 'id,numero,equipamento_id,plano_id,tecnico_id,tipo,status,prioridade,titulo,descricao,sla_horas,data_abertura,data_limite,data_conclusao,tempo_gasto_minutos,servico_executado,confirmada_em', ['data_abertura', 'id']),
      fetchAll('vw_proxima_manutencao_equipamento', '*', 'equipamento_id'),
      fetchAll('registro_manutencao', 'id,equipamento_id,tecnico_id,ordem_servico_id,tipo_manutencao,data_servico,hora_inicio,hora_fim,descricao,folha_papel_id,linha_folha', 'id'),
      fetchAll('vw_registro_manutencao_detalhado', 'data,inicio,fim,tempo,tecnico,equipamento_codigo,equipamento,grupo,ordem_servico,tipo,descricao', ['data', 'inicio', 'equipamento_codigo', 'tecnico']),
      fetchAll('plano_manutencao', 'id,codigo,nome,grupo_id,periodicidade_dias,ativo', 'id'),
      S.admin ? sb.rpc('editor_listar_grupos') : Promise.resolve({data: null, error: null}),
      fetchAll('nao_conformidade', 'id,ordem_servico_id,equipamento_id,descricao,status,os_corretiva_id,criado_em,decidido_em', 'id').catch(() => []),
      fetchAll('feriado', 'id,data,descricao', 'data').catch(() => []),
      fetchAll('ausencia', 'id,tecnico_id,data_inicio,data_fim,tipo,observacao', 'id').catch(() => [])
    ]);
    if (edg.error) throw edg.error;
    S.tecnicos = tec.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    S.tecById = new Map(tec.map(t => [t.id, t]));
    S.equips = eq.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '', 'pt-BR', {numeric: true}));
    S.eqById = new Map(eq.map(e => [e.id, e]));
    S.eqByCod = new Map(eq.filter(e => e.codigo).map(e => [e.codigo.trim().toUpperCase(), e]));
    S.grupos = gr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    S.grpById = new Map(gr.map(g => [g.id, g]));
    S.os = os;
    S.cal = cal.filter(e => e.proxima_manutencao);
    S.calByEq = new Map(cal.map(e => [e.equipamento_id, e]));
    S.regs = regs;
    S.regd = regd;
    S.ncs = ncs;
    S.feriados = fers; S.ausencias = auss;
    S.planoById = new Map(planos.map(p => [p.id, p]));
    S.edGrupos = S.admin
      ? (edg.data || [])
      : S.grupos.filter(g => g.ativo).map(g => ({
          grupo_id: g.id, grupo_nome: g.nome, codigo_base: g.codigo_base, plano_id: null, periodicidade_dias: null, qtd_itens_checklist: null,
          qtd_equipamentos: eq.filter(e => e.grupo_id === g.id && e.status !== 'desativado').length
        })).filter(g => g.qtd_equipamentos > 0);
    S.edGrupos.sort((a, b) => a.grupo_nome.localeCompare(b.grupo_nome, 'pt-BR'));
    fillSelects();
    renderAll();
    renderNC();
    refreshDialogs();
    if (S.selGrupo) await loadEquips(S.selGrupo, false);
  } finally { setBusy(false); }
}
