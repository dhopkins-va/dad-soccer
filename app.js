import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import * as L from './logic.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById('app');

const S = {
  loading: true,
  session: null,
  team: null,
  players: [], // full roster incl. removed players (needed for old games)
  game: null, // logic.js game state
  gameId: null,
  gameMeta: null, // { opponent, played_on }
  pastGames: [],
  tab: 'game',
  setup: null,
  sel: null, // { slot } or { id } — first tap of a swap
  editId: null,
  draft: null, // unsaved add-player form after an error
  suggestion: null,
  error: null,
  saving: false,
  wasDue: false,
  goalEntry: null, // { step: 'scorer' | 'assist', half, t, scorer }
};

// ---- helpers ---------------------------------------------------------------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clock = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const mins = (secs) => Math.round(secs / 60);
const byId = () => Object.fromEntries(S.players.map((p) => [p.id, p]));
const roster = () => S.players.filter((p) => p.active).sort((a, b) => a.number - b.number);
const nameNum = (p) =>
  p
    ? `<span class="nn"><span class="pname">${esc(p.name)}</span> <span class="pnum">#${p.number}</span></span>`
    : '<span class="muted">—</span>';
const posChip = (pos, on = true) => `<span class="pos pos-${pos}${on ? '' : ' off'}">${pos}</span>`;
const t = () => L.halfElapsed(S.game, Date.now());
const halfName = (h) => ['1st half', '2nd half', '3rd period', '4th period'][h] ?? `Period ${h + 1}`;

function fail(err) {
  console.error(err);
  S.error = err?.message || String(err);
  render();
}

// ---- data ------------------------------------------------------------------

async function loadTeam() {
  S.loading = true;
  render();
  // The database enforces the allow-list; this just explains it nicely. If the
  // check itself fails, carry on — the data policies still apply.
  const allowed = await sb.rpc('is_allowed_user');
  S.denied = allowed.data === false;
  if (S.denied) {
    S.loading = false;
    return render();
  }
  const { data: teams, error } = await sb.from('teams').select('*').order('created_at').limit(1);
  if (error) return fail(error);
  S.team = teams[0] ?? null;
  if (S.team) {
    const [players, games] = await Promise.all([
      sb.from('players').select('*').eq('team_id', S.team.id),
      sb.from('games').select('*').eq('team_id', S.team.id).order('played_on', { ascending: false }).limit(200),
    ]);
    if (players.error) return fail(players.error);
    if (games.error) return fail(games.error);
    S.players = players.data;
    S.pastGames = games.data.filter((g) => g.status === 'done');
    const current = games.data.find((g) => g.status !== 'done');
    if (current) useGame(current);
    if (!roster().length) S.tab = 'roster';
  }
  S.loading = false;
  render();
}

function useGame(row) {
  S.game = row.state;
  S.gameId = row.id;
  S.gameMeta = { opponent: row.opponent, played_on: row.played_on };
}

// Saves are serialised so a slow network can't apply them out of order.
let saveChain = Promise.resolve();
function save() {
  const state = structuredClone(S.game);
  const finished = S.pastGames.find((pg) => pg.id === S.gameId);
  if (finished) finished.state = state; // e.g. a goal added at full time
  S.saving = true;
  saveChain = saveChain.then(async () => {
    const { error } = await sb.from('games').update({ state, status: state.status }).eq('id', S.gameId);
    S.saving = false;
    if (error) fail(new Error(`Not saved — check your signal. (${error.message})`));
    else if (S.error?.startsWith('Not saved')) S.error = null;
    renderStatus();
  });
  renderStatus();
  return saveChain;
}

// Minutes per player across finished games, for season fairness.
function seasonTotals() {
  const totals = {};
  for (const g of S.pastGames) {
    for (const id of g.state.available) {
      totals[id] ??= { games: 0, secs: 0, possible: 0, goals: 0, assists: 0 };
      totals[id].games += 1;
      totals[id].secs += g.state.played[id] || 0;
      totals[id].possible += g.state.settings.halves * g.state.settings.halfMinutes * 60;
    }
    for (const goal of g.state.goals ?? []) {
      if (totals[goal.scorer]) totals[goal.scorer].goals += 1;
      if (totals[goal.assist]) totals[goal.assist].assists += 1;
    }
  }
  return totals;
}

// ---- views -----------------------------------------------------------------

function render() {
  if (S.loading) {
    app.innerHTML = `<div class="center"><div class="spinner"></div></div>`;
    return;
  }
  if (!S.session) {
    app.innerHTML = signInView();
    return;
  }
  if (S.denied) {
    app.innerHTML = deniedView();
    return;
  }
  if (!S.team) {
    app.innerHTML = createTeamView();
    return;
  }
  const body = { roster: rosterView, game: gameView, season: seasonView }[S.tab]();
  app.innerHTML = `
    <header class="top">
      <div><div class="team">${esc(S.team.name)}</div><div class="muted small">${esc(S.session.user.email)}</div></div>
      <div class="top-right"><span id="status" class="status"></span><button class="link" data-action="sign-out">Sign out</button></div>
    </header>
    ${S.error ? `<div class="banner">${esc(S.error)} <button class="link" data-action="dismiss">Dismiss</button></div>` : ''}
    <main>${body}</main>
    <nav class="tabs">
      ${[['roster', 'Roster'], ['game', 'Game'], ['season', 'Season']]
        .map(([k, label]) => `<button class="${S.tab === k ? 'active' : ''}" data-action="tab" data-tab="${k}">${label}</button>`)
        .join('')}
    </nav>`;
  renderStatus();
  syncWakeLock();
}

function renderStatus() {
  const el = document.getElementById('status');
  if (el) el.textContent = S.saving ? 'Saving…' : '';
}

function signInView() {
  return `
    <div class="center signin">
      <div class="ball">⚽</div>
      <h1>Sub Manager</h1>
      <p class="muted">Even play time for every girl, every game.</p>
      ${S.error ? `<div class="banner">${esc(S.error)}</div>` : ''}
      <button class="btn primary big" data-action="sign-in">Sign in with Google</button>
      <a class="deck-link" href="lecture/">📽️ Presentation: Claude as the Next Excel →</a>
    </div>`;
}

function deniedView() {
  return `
    <div class="center signin">
      <div class="ball">🔒</div>
      <h1>This app is private</h1>
      <p class="muted">${esc(S.session.user.email)} doesn't have access.</p>
      <button class="btn primary big" data-action="sign-out">Sign out</button>
    </div>`;
}

function createTeamView() {
  return `
    <div class="center signin">
      <h1>Name your team</h1>
      <form data-form="create-team" class="stack">
        <input name="name" required maxlength="80" placeholder="e.g. U11 Girls Thunder" autocomplete="off" />
        <button class="btn primary big">Create team</button>
      </form>
      <button class="link" data-action="sign-out">Sign out</button>
    </div>`;
}

// ---- roster ----------------------------------------------------------------

function rosterView() {
  const list = roster();
  const rows = list
    .map((p) =>
      S.editId === p.id
        ? `<form class="card row-edit" data-form="edit-player" data-id="${p.id}">
            <input name="name" value="${esc(p.name)}" required maxlength="40" />
            <input name="number" type="number" inputmode="numeric" min="0" max="99" value="${p.number}" required class="num-input" />
            <button class="btn primary">Save</button>
            <button type="button" class="btn" data-action="cancel-edit">Cancel</button>
            <button type="button" class="btn danger" data-action="remove-player" data-id="${p.id}">Remove</button>
          </form>`
        : `<div class="card player-row">
            <button class="link player-name" data-action="edit-player" data-id="${p.id}">${nameNum(p)}</button>
            <div class="pos-toggles">
              ${L.ALL_POSITIONS.map(
                (pos) => `<button class="pos pos-${pos}${p.positions.includes(pos) ? '' : ' off'}" data-action="toggle-pos" data-id="${p.id}" data-pos="${pos}" aria-pressed="${p.positions.includes(pos)}">${pos}</button>`,
              ).join('')}
            </div>
          </div>`,
    )
    .join('');
  return `
    <h2>Roster <span class="muted small">${list.length} ${list.length === 1 ? 'player' : 'players'}</span></h2>
    <p class="muted small">Tap the positions each girl is happy to play. GK = can keep goal.</p>
    ${rows || '<p class="muted">No players yet — add your team below.</p>'}
    <form class="card add-player" data-form="add-player">
      <input name="name" required maxlength="40" placeholder="Name" autocomplete="off" value="${esc(S.draft?.name)}" />
      <input name="number" type="number" inputmode="numeric" min="0" max="99" required placeholder="#" class="num-input" value="${esc(S.draft?.number)}" />
      <button class="btn primary">Add</button>
    </form>
    <div class="row roster-io">
      <button class="btn" data-action="export-roster" ${list.length ? '' : 'disabled'}>Export JSON</button>
      <label class="btn file-btn">Import JSON<input type="file" accept="application/json,.json" data-import-roster hidden /></label>
    </div>
    <p class="muted small">Import matches girls by jersey number: existing numbers are updated, new numbers are added, and nobody is removed.</p>`;
}

// ---- roster import / export --------------------------------------------------

const ROSTER_FORMAT = 'sub-manager-roster';

function exportRoster() {
  const file = {
    format: ROSTER_FORMAT,
    version: 1,
    team: S.team.name,
    exportedAt: new Date().toISOString(),
    players: roster().map((p) => ({ number: p.number, name: p.name, positions: p.positions })),
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${S.team.name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'team'}-roster.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Accepts this app's export, or a bare array of { number, name, positions }.
function parseRoster(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const list = Array.isArray(data) ? data : data?.players;
  if (!Array.isArray(list) || !list.length) throw new Error('No players found in that file.');
  const seen = new Set();
  return list.map((raw, i) => {
    const where = `Player ${i + 1}`;
    const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
    const number = Number(raw?.number);
    if (!name || name.length > 40) throw new Error(`${where}: name must be 1–40 characters.`);
    if (!Number.isInteger(number) || number < 0 || number > 99) throw new Error(`${where} (${name}): number must be 0–99.`);
    if (seen.has(number)) throw new Error(`Number ${number} appears twice in the file.`);
    seen.add(number);
    const positions = Array.isArray(raw.positions) ? raw.positions.map((x) => String(x).toUpperCase()) : ['D', 'M', 'S'];
    const bad = positions.find((x) => !L.ALL_POSITIONS.includes(x));
    if (bad) throw new Error(`${name} #${number}: unknown position "${bad}" (use GK, D, M, S).`);
    return { name, number, positions: L.ALL_POSITIONS.filter((x) => positions.includes(x)) };
  });
}

async function importRoster(file) {
  const incoming = parseRoster(await file.text());
  const current = new Map(roster().map((p) => [p.number, p]));
  const adds = incoming.filter((p) => !current.has(p.number));
  const updates = incoming.filter((p) => {
    const old = current.get(p.number);
    const oldPositions = L.ALL_POSITIONS.filter((x) => old?.positions.includes(x)).join();
    return old && (old.name !== p.name || oldPositions !== p.positions.join());
  });
  if (!adds.length && !updates.length) {
    alert('Roster is already up to date — nothing to import.');
    return;
  }
  const lines = [
    adds.length && `Add ${adds.length}: ${adds.map((p) => `${p.name} #${p.number}`).join(', ')}`,
    updates.length && `Update ${updates.length}: ${updates.map((p) => `${p.name} #${p.number}`).join(', ')}`,
  ].filter(Boolean);
  if (!confirm(`Import roster?\n\n${lines.join('\n')}`)) return;

  for (const p of updates) {
    const old = current.get(p.number);
    const { error } = await sb.from('players').update({ name: p.name, positions: p.positions }).eq('id', old.id);
    if (error) throw error;
    Object.assign(old, { name: p.name, positions: p.positions });
  }
  if (adds.length) {
    const { data, error } = await sb
      .from('players')
      .insert(adds.map((p) => ({ ...p, team_id: S.team.id })))
      .select();
    if (error) throw error;
    S.players.push(...data);
  }
  S.setup = null;
  S.error = null;
  render();
}

// ---- game ------------------------------------------------------------------

function gameView() {
  const g = S.game;
  if (!g) return setupView();
  if (g.status === 'ready' || g.status === 'halftime') return lineupView();
  if (g.status === 'live') return liveView();
  return summaryView();
}

function defaultSetup() {
  const settings = { ...L.DEFAULT_SETTINGS, ...S.team.settings, formation: { ...L.DEFAULT_SETTINGS.formation, ...S.team.settings?.formation } };
  const attending = roster().map((p) => p.id);
  const keepers = roster().filter((p) => p.positions.includes('GK'));
  return {
    opponent: '',
    played_on: new Date().toLocaleDateString('en-CA'),
    settings,
    attending,
    gk: [keepers[0]?.id ?? '', keepers[1]?.id ?? keepers[0]?.id ?? ''],
  };
}

function setupView() {
  if (!roster().length) return `<h2>New game</h2><p class="muted">Add your players on the Roster tab first.</p>`;
  S.setup ??= defaultSetup();
  const su = S.setup;
  const s = su.settings;
  const attending = roster().filter((p) => su.attending.includes(p.id));
  const fieldCount = s.formation.D + s.formation.M + s.formation.S;
  const keeperOptions = (half) => {
    const sorted = [...attending].sort((a, b) => b.positions.includes('GK') - a.positions.includes('GK') || a.number - b.number);
    return `<option value="">— pick —</option>${sorted
      .map((p) => `<option value="${p.id}" ${su.gk[half] === p.id ? 'selected' : ''}>${esc(p.name)} #${p.number}${p.positions.includes('GK') ? ' (GK)' : ''}</option>`)
      .join('')}`;
  };
  const num = (path, val, min, max) =>
    `<input type="number" inputmode="numeric" data-setup="${path}" value="${val}" min="${min}" max="${max}" class="num-input" />`;

  return `
    <h2>New game</h2>
    <div class="card stack">
      <label>Opponent <input data-setup="opponent" value="${esc(su.opponent)}" maxlength="80" placeholder="optional" /></label>
      <label>Date <input type="date" data-setup="played_on" value="${su.played_on}" /></label>
    </div>

    <h3>Attendance <span class="muted small">${attending.length} of ${roster().length} here</span></h3>
    <div class="card attendance">
      ${roster()
        .map(
          (p) => `<label class="attend ${su.attending.includes(p.id) ? 'here' : ''}">
            <input type="checkbox" data-attend="${p.id}" ${su.attending.includes(p.id) ? 'checked' : ''} />
            ${nameNum(p)}
          </label>`,
        )
        .join('')}
    </div>

    <h3>Goalkeepers</h3>
    <div class="card stack">
      ${Array.from({ length: s.halves }, (_, h) => `<label>${halfName(h)} <select data-gk="${h}">${keeperOptions(h)}</select></label>`).join('')}
    </div>

    <h3>Game settings</h3>
    <div class="card settings">
      <label>Half length (min) ${num('halfMinutes', s.halfMinutes, 5, 45)}</label>
      <label>Sub every (min) ${num('subEveryMinutes', s.subEveryMinutes, 1, 15)}</label>
      <label>Players per sub ${num('subsPerChange', s.subsPerChange, 1, 4)}</label>
      <label>Defense ${num('formation.D', s.formation.D, 0, 6)}</label>
      <label>Midfield ${num('formation.M', s.formation.M, 0, 6)}</label>
      <label>Strikers ${num('formation.S', s.formation.S, 0, 6)}</label>
      <div class="muted small span2">${fieldCount} field players + GK = ${fieldCount + 1}v${fieldCount + 1}</div>
    </div>

    <div class="card target"><span data-bind="target">${targetLine()}</span></div>
    <button class="btn primary big" data-action="create-game">Pick starting lineup</button>`;
}

function targetLine() {
  const su = S.setup;
  const g = L.newGame(su.settings, su.attending, su.gk);
  const field = L.makeSlots(su.settings.formation).length + 1;
  if (su.attending.length <= field) return `${su.attending.length} players here — everyone plays the whole game.`;
  return `Fair share: about <b>${mins(L.targetSeconds(g))} min</b> each (${su.attending.length - field} on the bench at a time).`;
}

function seasonOrder(ids) {
  // Girls with the fewest minutes per game this season get first pick to start.
  const totals = seasonTotals();
  const rate = (id) => (totals[id] ? totals[id].secs / totals[id].possible : 0);
  return [...ids].sort(() => Math.random() - 0.5).sort((a, b) => rate(a) - rate(b));
}

function lineupView() {
  const g = S.game;
  const title = g.status === 'ready' ? 'Starting lineup' : `Half time — ${halfName(g.half)} lineup`;
  return `
    <h2>${title}</h2>
    ${g.status === 'halftime' ? scoreView() : ''}
    <p class="muted small">Tap two players to swap them. Bench is sorted by fewest minutes.</p>
    ${pitch(0)}
    ${benchView(0)}
    <div class="actions">
      <button class="btn primary big" data-action="kickoff">${g.status === 'ready' ? 'Kick off' : `Start ${halfName(g.half)}`}</button>
      ${g.status === 'ready' ? '<button class="btn" data-action="cancel-game">Cancel game</button>' : ''}
    </div>
    ${projectionView(0)}`;
}

function liveView() {
  const g = S.game;
  const now = t();
  const halfLen = g.settings.halfMinutes * 60;
  const due = L.nextSubDueAt(g);
  const isDue = due != null && now >= due;
  const running = g.clock.runningSince != null;
  const over = now >= halfLen;
  // Preview the next scheduled rotation as it will look when it falls due.
  S.suggestion = L.suggestSubs(g, byId(), due != null ? Math.max(now, due) : now);
  S.wasDue = isDue;

  return `
    <section class="clockbar ${over ? 'over' : ''}">
      <div>
        <div class="muted small">${halfName(g.half)}${S.gameMeta?.opponent ? ` vs ${esc(S.gameMeta.opponent)}` : ''}</div>
        <div class="clock" data-bind="clock">${clock(now)}</div>
      </div>
      <button class="btn ${running ? '' : 'primary'}" data-action="toggle-clock">${running ? 'Pause' : 'Resume'}</button>
    </section>

    ${scoreView()}

    <section class="subcard ${isDue ? 'due' : ''}">
      <div class="subhead">
        <b>${isDue ? 'SUB NOW' : 'Next sub'}</b>
        <span data-bind="next">${nextLabel(now)}</span>
      </div>
      ${suggestionView(S.suggestion)}
    </section>

    ${pitch(now)}
    ${benchView(now)}

    <div class="actions">
      <button class="btn" data-action="undo" ${g.history.length ? '' : 'disabled'}>Undo last sub</button>
      <button class="btn ${over ? 'primary' : ''}" data-action="end-half">End ${halfName(g.half)}</button>
    </div>
    ${projectionView(now)}`;
}

function scoreView() {
  const g = S.game;
  const P = byId();
  const sc = L.score(g);
  const opp = S.gameMeta?.opponent || 'Them';
  const line = (x) => {
    const who =
      x.team === 'us'
        ? `⚽ ${x.scorer ? nameNum(P[x.scorer]) : '<span class="muted">Goal</span>'}${x.assist ? ` <span class="muted small">assist</span> ${nameNum(P[x.assist])}` : ''}`
        : `<span class="muted">${esc(opp)} goal</span>`;
    return `<li class="goal-${x.team}"><span class="gmin">${L.goalMinute(g, x)}′</span><span class="gwho">${who}</span>
      <button class="link gdel" data-action="remove-goal" data-goal="${x.id}" aria-label="Remove goal">✕</button></li>`;
  };
  return `
    <section class="scoreboard">
      <div class="side"><div class="side-name">${esc(S.team.name)}</div><button class="btn goal-btn" data-action="goal" data-team="us">+ Goal</button></div>
      <div class="score">${sc.us}<span>–</span>${sc.them}</div>
      <div class="side"><div class="side-name">${esc(opp)}</div><button class="btn goal-btn" data-action="goal" data-team="them">+ Goal</button></div>
    </section>
    ${S.goalEntry ? goalPicker() : ''}
    ${g.goals?.length ? `<ul class="card goals">${g.goals.map(line).join('')}</ul>` : ''}`;
}

function goalPicker() {
  const e = S.goalEntry;
  const g = S.game;
  const P = byId();
  const byNum = (a, b) => P[a].number - P[b].number;
  const on = g.status === 'live' ? L.onFieldIds(g).sort(byNum) : [];
  const rest = g.available.filter((id) => !on.includes(id)).sort(byNum);
  const btn = (id) =>
    id === e.scorer ? '' : `<button class="pick" data-action="goal-pick" data-id="${id}">${nameNum(P[id])}</button>`;
  return `
    <section class="card goal-picker">
      <div class="subhead">
        <b>${e.step === 'scorer' ? 'Who scored?' : `Assist for ${esc(P[e.scorer].name)} #${P[e.scorer].number}?`}</b>
        <button class="link" data-action="goal-cancel">Cancel</button>
      </div>
      ${on.length ? `<div class="pick-grid">${on.map(btn).join('')}</div>` : ''}
      ${rest.length ? `${on.length ? '<div class="muted small pick-label">Bench</div>' : ''}<div class="pick-grid">${rest.map(btn).join('')}</div>` : ''}
      <button class="btn pick-skip" data-action="goal-pick" data-id="">${e.step === 'scorer' ? 'Not sure — skip' : 'No assist'}</button>
    </section>`;
}

function nextLabel(now) {
  const due = L.nextSubDueAt(S.game);
  if (due == null) return 'no more subs this half';
  return now >= due ? `due ${clock(now - due)} ago` : `in ${clock(due - now)}`;
}

function suggestionView(s) {
  if (!s) return `<p class="muted">No sub needed — nobody on the bench is behind on minutes.</p>`;
  const early = S.game && L.nextSubDueAt(S.game) != null && t() < L.nextSubDueAt(S.game);
  const P = byId();
  const lines = s.swaps
    .map(
      (sw) => `<li><span class="on">▲ ${nameNum(P[sw.on])}</span> ${posChip(sw.pos)}
        <span class="off">▼ ${nameNum(P[sw.replacing])}</span></li>`,
    )
    .join('');
  const moves = s.moves.map((m) => `<li class="muted small">↔ ${nameNum(P[m.id])} moves ${m.from} → ${m.to}</li>`).join('');
  return `
    <ul class="swaps">${lines}${moves}</ul>
    ${s.outOfPosition ? `<p class="warn small">⚠ ${s.outOfPosition} player(s) out of their preferred position</p>` : ''}
    <div class="row">
      <button class="btn ${early ? '' : 'primary'}" data-action="make-subs">${early ? 'Sub early' : 'Make subs'}</button>
      <button class="btn" data-action="skip-sub">Skip</button>
    </div>`;
}

function pitch(now) {
  const g = S.game;
  const P = byId();
  const slots = L.makeSlots(g.settings.formation);
  const live = g.status === 'live';
  const card = (slotId, pos) => {
    const id = g.lineup[slotId];
    const p = P[id];
    const sel = S.sel?.slot === slotId ? 'sel' : '';
    const bad = p && !L.canPlay(p, pos) ? 'bad' : '';
    return `<button class="slot pos-bg-${pos} ${sel} ${bad}" data-action="pick" data-slot="${slotId}">
      <span class="slot-pos">${pos}${bad ? ' ⚠' : ''}</span>
      ${nameNum(p)}
      ${p ? `<span class="slot-min"><span data-played="${id}">${mins(L.playedSeconds(g, id, now))}</span>′</span>` : ''}
      ${live && p && g.stintStart[id] != null ? `<span class="slot-stint muted">on <span data-stint="${id}">${clock(now - g.stintStart[id])}</span></span>` : ''}
    </button>`;
  };
  const row = (pos) =>
    `<div class="pitch-row">${slots.filter((s) => s.pos === pos).map((s) => card(s.id, s.pos)).join('')}</div>`;
  return `<section class="pitch">${row('S')}${row('M')}${row('D')}<div class="pitch-row">${card('GK', 'GK')}</div></section>`;
}

function benchView(now) {
  const g = S.game;
  const P = byId();
  const bench = L.benchIds(g).sort((a, b) => L.playedSeconds(g, a, now) - L.playedSeconds(g, b, now));
  if (!bench.length) return '';
  return `
    <h3>Bench</h3>
    <div class="bench">
      ${bench
        .map(
          (id) => `<button class="benchp ${S.sel?.id === id ? 'sel' : ''}" data-action="pick" data-id="${id}">
            ${nameNum(P[id])}
            <span class="pos-mini">${P[id].positions.map((x) => posChip(x)).join('')}</span>
            <span class="slot-min"><span data-played="${id}">${mins(L.playedSeconds(g, id, now))}</span>′</span>
          </button>`,
        )
        .join('')}
    </div>`;
}

function projectionView(now) {
  const g = S.game;
  const P = byId();
  const { minutes, plan } = L.project(g, P, now);
  const target = L.targetSeconds(g);
  const max = Math.max(target, ...Object.values(minutes), 1);
  const rows = g.available
    .map((id) => ({ id, played: L.playedSeconds(g, id, now), proj: minutes[id] || 0 }))
    .sort((a, b) => a.proj - b.proj);
  const P2 = (sw) => `${esc(P[sw.on]?.name)} #${P[sw.on]?.number} for ${esc(P[sw.replacing]?.name)} #${P[sw.replacing]?.number}`;
  return `
    <h3>Minutes <span class="muted small">now → projected · target ${mins(target)}′</span></h3>
    <div class="card bars">
      ${rows
        .map(
          (r) => `<div class="bar-row">
            <div class="bar-name">${nameNum(P[r.id])}</div>
            <div class="bar"><div class="bar-proj" style="width:${(r.proj / max) * 100}%"></div><div class="bar-now" style="width:${(r.played / max) * 100}%"></div><div class="bar-target" style="left:${(target / max) * 100}%"></div></div>
            <div class="bar-val"><span data-played="${r.id}">${mins(r.played)}</span> → ${mins(r.proj)}′</div>
          </div>`,
        )
        .join('')}
    </div>
    ${
      plan.length
        ? `<details class="card plan"><summary>Planned rotation (${plan.length} subs)</summary><ol>${plan
            .map((p) => `<li><b>${halfName(p.half)} ${clock(p.t)}</b> — ${p.swaps.map(P2).join('; ')}</li>`)
            .join('')}</ol></details>`
        : ''
    }`;
}

function summaryView() {
  const g = S.game;
  const P = byId();
  const target = L.targetSeconds(g);
  const rows = [...g.available].sort((a, b) => (g.played[b] || 0) - (g.played[a] || 0));
  const goals = g.goals ?? [];
  const count = (id, key) => goals.filter((x) => x[key] === id).length || '';
  return `
    <h2>Full time${S.gameMeta?.opponent ? ` vs ${esc(S.gameMeta.opponent)}` : ''}</h2>
    ${scoreView()}
    <div class="card">
      <table class="table">
        <thead><tr><th>Player</th><th>Min</th><th>vs fair</th><th>G</th><th>A</th></tr></thead>
        <tbody>${rows
          .map((id) => {
            const diff = mins((g.played[id] || 0) - target);
            return `<tr><td>${nameNum(P[id])}</td><td>${mins(g.played[id] || 0)}′</td><td class="${Math.abs(diff) > 5 ? 'warn' : 'muted'}">${diff > 0 ? '+' : ''}${diff}</td><td>${count(id, 'scorer')}</td><td>${count(id, 'assist')}</td></tr>`;
          })
          .join('')}</tbody>
      </table>
    </div>
    <button class="btn primary big" data-action="new-game">New game</button>`;
}

// ---- season ----------------------------------------------------------------

function seasonView() {
  const totals = seasonTotals();
  const rows = roster()
    .map((p) => ({ p, ...(totals[p.id] ?? { games: 0, secs: 0, possible: 0, goals: 0, assists: 0 }) }))
    .sort((a, b) => a.secs / (a.games || 1) - b.secs / (b.games || 1));
  return `
    <h2>Season <span class="muted small">${S.pastGames.length} games</span></h2>
    <div class="card">
      <table class="table">
        <thead><tr><th>Player</th><th>Games</th><th>Avg min</th><th>G</th><th>A</th></tr></thead>
        <tbody>${rows
          .map(
            (r) => `<tr><td>${nameNum(r.p)}</td><td>${r.games}</td><td>${r.games ? mins(r.secs / r.games) + '′' : '—'}</td><td>${r.goals || ''}</td><td>${r.assists || ''}</td></tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>
    <h3>Past games</h3>
    ${
      S.pastGames
        .map((g) => {
          const sc = L.score(g.state);
          const res = sc.us > sc.them ? 'W' : sc.us < sc.them ? 'L' : 'D';
          return `<div class="card small past"><span>${esc(g.played_on)}${g.opponent ? ` vs ${esc(g.opponent)}` : ''}</span><b class="res res-${res}">${res} ${sc.us}–${sc.them}</b></div>`;
        })
        .join('') || '<p class="muted">Finished games show up here.</p>'
    }`;
}

// ---- actions ---------------------------------------------------------------

const actions = {
  async 'sign-in'() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname },
    });
    if (error) fail(error);
  },
  async 'sign-out'() {
    await sb.auth.signOut();
    Object.assign(S, { team: null, players: [], game: null, gameId: null, pastGames: [], setup: null, denied: false });
  },
  dismiss() {
    S.error = null;
    render();
  },
  tab(el) {
    S.tab = el.dataset.tab;
    S.sel = null;
    render();
  },
  'export-roster'() {
    exportRoster();
  },
  'edit-player'(el) {
    S.editId = el.dataset.id;
    render();
  },
  'cancel-edit'() {
    S.editId = null;
    render();
  },
  async 'toggle-pos'(el) {
    const p = S.players.find((x) => x.id === el.dataset.id);
    const pos = el.dataset.pos;
    const positions = p.positions.includes(pos) ? p.positions.filter((x) => x !== pos) : [...p.positions, pos];
    const { error } = await sb.from('players').update({ positions }).eq('id', p.id);
    if (error) return fail(error);
    p.positions = L.ALL_POSITIONS.filter((x) => positions.includes(x));
    render();
  },
  async 'remove-player'(el) {
    const p = S.players.find((x) => x.id === el.dataset.id);
    if (!confirm(`Remove ${p.name} #${p.number} from the roster? Past game minutes are kept.`)) return;
    const { error } = await sb.from('players').update({ active: false }).eq('id', p.id);
    if (error) return fail(error);
    p.active = false;
    S.editId = null;
    S.setup = null;
    render();
  },
  async 'create-game'() {
    const su = S.setup;
    const slots = L.makeSlots(su.settings.formation);
    if (!slots.length) return fail(new Error('Set at least one field position.'));
    if (su.attending.length < 2) return fail(new Error('Mark who is here first.'));
    if (su.gk.slice(0, su.settings.halves).some((id) => !id || !su.attending.includes(id)))
      return fail(new Error('Pick a goalkeeper (who is here) for each half.'));
    const game = L.newGame(su.settings, su.attending, su.gk);
    game.lineup = L.buildLineup(game, byId(), su.gk[0], seasonOrder(su.attending));
    game.status = 'ready';
    const { data, error } = await sb
      .from('games')
      .insert({ team_id: S.team.id, opponent: su.opponent || null, played_on: su.played_on, status: game.status, state: game })
      .select()
      .single();
    if (error) return fail(error);
    // Remember these settings for next time.
    sb.from('teams').update({ settings: su.settings }).eq('id', S.team.id).then(({ error: e }) => e && console.warn(e));
    S.team.settings = su.settings;
    useGame(data);
    S.error = null;
    render();
  },
  async 'cancel-game'() {
    if (!confirm('Cancel this game? The lineup will be discarded.')) return;
    const { error } = await sb.from('games').delete().eq('id', S.gameId);
    if (error) return fail(error);
    S.game = S.gameId = null;
    render();
  },
  kickoff() {
    L.startHalf(S.game, Date.now());
    S.sel = null;
    save();
    render();
  },
  goal(el) {
    const g = S.game;
    // Stamp the goal when the button is tapped, not after names are picked.
    const when = g.status === 'live' ? { half: g.half, t: t() } : { half: Math.max(0, g.half - 1), t: g.settings.halfMinutes * 60 };
    if (el.dataset.team === 'them') {
      L.addGoal(g, { team: 'them', ...when });
      save();
    } else {
      S.goalEntry = { step: 'scorer', ...when };
    }
    render();
  },
  'goal-pick'(el) {
    const e = S.goalEntry;
    const id = el.dataset.id || null;
    if (e.step === 'scorer' && id) {
      S.goalEntry = { ...e, step: 'assist', scorer: id };
      return render();
    }
    L.addGoal(S.game, { team: 'us', scorer: e.scorer ?? null, assist: e.step === 'assist' ? id : null, half: e.half, t: e.t });
    S.goalEntry = null;
    save();
    render();
  },
  'goal-cancel'() {
    S.goalEntry = null;
    render();
  },
  'remove-goal'(el) {
    if (!confirm('Remove this goal?')) return;
    L.removeGoal(S.game, el.dataset.goal);
    save();
    render();
  },
  'toggle-clock'() {
    const c = S.game.clock;
    if (c.runningSince != null) S.game.clock = { elapsed: t(), runningSince: null };
    else c.runningSince = Date.now();
    save();
    render();
  },
  'make-subs'() {
    if (!S.suggestion) return;
    L.applySubs(S.game, S.suggestion, t());
    S.sel = null;
    save();
    render();
  },
  'skip-sub'() {
    S.game.lastSubAt = t();
    save();
    render();
  },
  undo() {
    if (L.undo(S.game)) {
      save();
      render();
    }
  },
  'end-half'() {
    const g = S.game;
    const last = g.half + 1 >= g.settings.halves;
    if (!confirm(last ? 'End the game?' : `End the ${halfName(g.half)}?`)) return;
    L.endHalf(g, byId(), Date.now(), seasonOrder(g.available));
    S.sel = null;
    save().then(() => {
      if (g.status === 'done' && !S.error) {
        S.pastGames.unshift({ id: S.gameId, played_on: S.gameMeta.played_on, opponent: S.gameMeta.opponent, status: 'done', state: structuredClone(g) });
      }
      render();
    });
    render();
  },
  'new-game'() {
    S.game = S.gameId = S.gameMeta = null;
    S.setup = null;
    S.goalEntry = null;
    render();
  },
  pick(el) {
    const g = S.game;
    const tap = el.dataset.slot ? { slot: el.dataset.slot } : { id: el.dataset.id };
    const prev = S.sel;
    if (!prev || (prev.id && tap.id) || (prev.slot && prev.slot === tap.slot)) {
      S.sel = prev && (prev.slot === tap.slot && prev.id === tap.id) ? null : tap;
      return render();
    }
    // Two taps: at least one is a field slot → swap them.
    const lineup = { ...g.lineup };
    const slot = tap.slot ?? prev.slot;
    const other = tap.slot ? prev : tap;
    if (other.slot) [lineup[slot], lineup[other.slot]] = [lineup[other.slot], lineup[slot]];
    else lineup[slot] = other.id;
    S.sel = null;
    L.setLineup(g, lineup, g.status === 'live' ? t() : 0, { record: g.status === 'live' });
    save();
    render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  e.preventDefault();
  Promise.resolve(actions[el.dataset.action]?.(el)).catch(fail);
});

const forms = {
  async 'create-team'(f) {
    const { data, error } = await sb.from('teams').insert({ name: f.name.value.trim() }).select().single();
    if (error) return fail(error);
    S.team = data;
    S.tab = 'roster';
    render();
  },
  async 'add-player'(f) {
    const { data, error } = await sb
      .from('players')
      .insert({ team_id: S.team.id, name: f.name.value.trim(), number: Number(f.number.value), positions: ['D', 'M', 'S'] })
      .select()
      .single();
    if (error) {
      S.draft = { name: f.name.value, number: f.number.value };
      return fail(friendly(error, f.number.value));
    }
    S.draft = null;
    S.players.push(data);
    S.setup = null;
    S.error = null;
    render();
    document.querySelector('[data-form="add-player"] [name="name"]')?.focus();
  },
  async 'edit-player'(f) {
    const id = f.dataset.id;
    const patch = { name: f.name.value.trim(), number: Number(f.number.value) };
    const { error } = await sb.from('players').update(patch).eq('id', id);
    if (error) return fail(friendly(error, patch.number));
    Object.assign(S.players.find((p) => p.id === id), patch);
    S.editId = null;
    S.error = null;
    render();
  },
};

function friendly(error, number) {
  return error.code === '23505' ? new Error(`Number ${number} is already taken.`) : error;
}

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  Promise.resolve(forms[f.dataset.form]?.(f)).catch(fail);
});

// Setup form: text/number inputs update quietly (no re-render, so the phone
// keyboard stays open); checkboxes and selects re-render.
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset.setup || !S.setup) return;
  const path = el.dataset.setup;
  if (path === 'opponent' || path === 'played_on') S.setup[path] = el.value;
  else {
    const v = Math.max(Number(el.min), Math.min(Number(el.max), Math.round(Number(el.value) || 0)));
    if (path.startsWith('formation.')) S.setup.settings.formation[path.slice(10)] = v;
    else S.setup.settings[path] = v;
  }
  const tgt = document.querySelector('[data-bind="target"]');
  if (tgt) tgt.innerHTML = targetLine();
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-import-roster]')) {
    const file = el.files[0];
    el.value = ''; // let the same file be picked again
    if (file) importRoster(file).catch(fail);
    return;
  }
  if (!S.setup) return;
  if (el.dataset.attend) {
    const id = el.dataset.attend;
    S.setup.attending = el.checked ? [...S.setup.attending, id] : S.setup.attending.filter((x) => x !== id);
    S.setup.gk = S.setup.gk.map((g) => (S.setup.attending.includes(g) ? g : ''));
    render();
  } else if (el.dataset.gk) {
    S.setup.gk[Number(el.dataset.gk)] = el.value;
    render();
  } else if (el.dataset.setup?.includes('.') || el.type === 'number') {
    render(); // tidy clamped values once the field is left
  }
});

// ---- live clock --------------------------------------------------------------

let ticks = 0;
setInterval(() => {
  const g = S.game;
  if (S.tab !== 'game' || g?.status !== 'live') return;
  const now = t();
  const clk = document.querySelector('[data-bind="clock"]');
  if (clk) clk.textContent = clock(now);
  const nxt = document.querySelector('[data-bind="next"]');
  if (nxt) nxt.textContent = nextLabel(now);
  for (const el of document.querySelectorAll('[data-stint]')) {
    el.textContent = clock(now - (g.stintStart[el.dataset.stint] ?? now));
  }
  for (const el of document.querySelectorAll('[data-played]')) {
    el.textContent = mins(L.playedSeconds(g, el.dataset.played, now));
  }
  const due = L.nextSubDueAt(g);
  const isDue = due != null && now >= due;
  if (isDue && !S.wasDue) navigator.vibrate?.([300, 150, 300]);
  // Refresh the full view when a sub falls due, and every 20s so the
  // suggestion reflects current minutes.
  if (isDue !== S.wasDue || ++ticks % 20 === 0) render();
}, 1000);

// Keep the phone screen on while the game clock runs.
let wakeLock = null;
async function syncWakeLock() {
  const want = S.game?.status === 'live' && S.game.clock.runningSince != null && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!want && wakeLock) {
      await wakeLock.release();
    }
  } catch {
    /* not supported or denied — the app still works */
  }
}
document.addEventListener('visibilitychange', () => {
  syncWakeLock();
  if (document.visibilityState === 'visible' && S.game?.status === 'live') render();
});

// ---- boot --------------------------------------------------------------------

if (SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_ANON_KEY.startsWith('YOUR-')) {
  S.loading = false;
  app.innerHTML = `<div class="center signin"><h1>Almost there</h1><p>Add your Supabase URL and anon key to <code>config.js</code>.</p></div>`;
} else {
  render(); // spinner until Supabase reports the session
  sb.auth.onAuthStateChange((event, session) => {
    // INITIAL_SESSION always needs a first render, even when signed out.
    const changed = event === 'INITIAL_SESSION' || session?.user?.id !== S.session?.user?.id;
    S.session = session;
    if (!changed) return;
    // Defer: running Supabase queries inside this callback can deadlock.
    setTimeout(() => (session ? loadTeam() : ((S.loading = false), render())), 0);
  });
}
