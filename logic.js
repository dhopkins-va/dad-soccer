// Pure game logic (no DOM) — shared by the app and the tests.
//
// Time model: every clock value is "seconds into the current half". Stints are
// always closed at the end of a half, so minutes never straddle halves.

export const FIELD_POSITIONS = ['D', 'M', 'S'];
export const ALL_POSITIONS = ['GK', ...FIELD_POSITIONS];
export const POSITION_LABELS = { GK: 'Goalkeeper', D: 'Defense', M: 'Midfield', S: 'Striker' };

export const DEFAULT_SETTINGS = {
  halves: 2,
  halfMinutes: 30,
  subEveryMinutes: 4,
  subsPerChange: 2,
  formation: { D: 2, M: 3, S: 1 }, // 7v7: 6 field players + GK
};

// Don't schedule a rotation with less than this left in the half.
const MIN_SECONDS_LEFT_FOR_SUB = 60;

export function makeSlots(formation) {
  const slots = [];
  for (const pos of FIELD_POSITIONS) {
    for (let i = 1; i <= (formation[pos] || 0); i++) slots.push({ id: `${pos}${i}`, pos });
  }
  return slots;
}

export function canPlay(player, pos) {
  if (!player) return false;
  if (pos === 'GK') return player.positions.includes('GK');
  // A girl with no field preferences ticked is treated as happy anywhere.
  if (!player.positions.some((p) => p !== 'GK')) return true;
  return player.positions.includes(pos);
}

export function newGame(settings, availableIds, gkByHalf) {
  return {
    settings: structuredClone(settings),
    available: [...availableIds],
    gk: [...gkByHalf],
    half: 0,
    status: 'setup', // setup | ready | live | halftime | done
    clock: { elapsed: 0, runningSince: null },
    lineup: {},
    played: Object.fromEntries(availableIds.map((id) => [id, 0])),
    stintStart: {},
    lastSubAt: 0,
    history: [],
    log: [],
    goals: [],
  };
}

// ---- clock & minutes -------------------------------------------------------

export function halfElapsed(game, nowMs) {
  const c = game.clock;
  return c.elapsed + (c.runningSince != null ? (nowMs - c.runningSince) / 1000 : 0);
}

export function playedSeconds(game, id, t) {
  const start = game.stintStart[id];
  return (game.played[id] || 0) + (start != null ? Math.max(0, t - start) : 0);
}

// Minutes a player is already booked for: full halves in goal still to come.
export function committedSeconds(game, id) {
  let secs = 0;
  for (let h = game.half + 1; h < game.settings.halves; h++) {
    if (game.gk[h] === id) secs += game.settings.halfMinutes * 60;
  }
  return secs;
}

// How urgently a girl needs field time: minutes still owed to reach her fair
// share, divided by the field time left that she's available for. Halves she
// is booked in goal don't count as available, so a girl keeping goal in the
// 2nd half gets her field minutes in the 1st. Higher = put her on.
export function urgency(game, id, t) {
  const halfLen = game.settings.halfMinutes * 60;
  let window = game.gk[game.half] === id && game.lineup.GK === id ? 0 : Math.max(halfLen - t, 0);
  for (let h = game.half + 1; h < game.settings.halves; h++) {
    if (game.gk[h] !== id) window += halfLen;
  }
  const owed = targetSeconds(game) - playedSeconds(game, id, t) - committedSeconds(game, id);
  return owed / Math.max(window, 30);
}

export function onFieldIds(game) {
  return Object.values(game.lineup).filter(Boolean);
}

export function benchIds(game) {
  const on = new Set(onFieldIds(game));
  return game.available.filter((id) => !on.has(id));
}

// Fair share of minutes if time were split perfectly evenly.
export function targetSeconds(game) {
  const s = game.settings;
  const slots = makeSlots(s.formation).length + 1; // + GK
  const n = game.available.length;
  if (!n) return 0;
  return (s.halves * s.halfMinutes * 60 * Math.min(slots, n)) / n;
}

export function nextSubDueAt(game) {
  const s = game.settings;
  const due = game.lastSubAt + s.subEveryMinutes * 60;
  return due <= s.halfMinutes * 60 - MIN_SECONDS_LEFT_FOR_SUB ? due : null;
}

// ---- slot assignment -------------------------------------------------------

// Assign players to field slots, keeping them in their current slot where
// possible. In-position placements are maximised (bipartite matching); anyone
// who can't be placed in position fills a leftover slot and counts as
// out-of-position.
export function assignSlots(playerIds, slots, players, current = {}) {
  const owner = {}; // slotId -> playerId
  const order = (pid) => {
    const ok = slots.filter((s) => canPlay(players[pid], s.pos));
    const cur = ok.findIndex((s) => s.id === current[pid]);
    if (cur > 0) ok.unshift(...ok.splice(cur, 1));
    return ok;
  };
  const tryAssign = (pid, seen) => {
    for (const s of order(pid)) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      if (!owner[s.id] || tryAssign(owner[s.id], seen)) {
        owner[s.id] = pid;
        return true;
      }
    }
    return false;
  };
  // Players who already hold a slot go first so they keep it.
  const sorted = [...playerIds].sort((a, b) => (current[b] ? 1 : 0) - (current[a] ? 1 : 0));
  const unplaced = sorted.filter((pid) => !tryAssign(pid, new Set()));
  const free = slots.filter((s) => !owner[s.id]);
  unplaced.forEach((pid, i) => {
    if (free[i]) owner[free[i].id] = pid;
  });
  // Swapping two slots of the same position never breaks eligibility, so put
  // anyone who was shuffled within her position back in her own slot.
  const posOf = Object.fromEntries(slots.map((s) => [s.id, s.pos]));
  for (const pid of sorted) {
    const home = current[pid];
    const now = Object.keys(owner).find((sid) => owner[sid] === pid);
    if (home && now && home !== now && posOf[home] === posOf[now]) {
      [owner[home], owner[now]] = [pid, owner[home]];
      if (!owner[now]) delete owner[now];
    }
  }
  return { assign: owner, outOfPosition: unplaced.length };
}

function inverse(lineup) {
  return Object.fromEntries(Object.entries(lineup).map(([slot, pid]) => [pid, slot]));
}

// Pick the field players for the start of a half: least minutes first, while
// keeping everyone in a position they're happy to play.
export function buildLineup(game, players, gkId, tiebreakOrder = game.available) {
  const slots = makeSlots(game.settings.formation);
  const due = (id) => -urgency(game, id, 0);
  const rank = new Map(tiebreakOrder.map((id, i) => [id, i]));
  const candidates = game.available
    .filter((id) => id !== gkId)
    .sort((a, b) => due(a) - due(b) || rank.get(a) - rank.get(b));

  const chosen = [];
  for (const pid of candidates) {
    if (chosen.length === slots.length) break;
    if (assignSlots([...chosen, pid], slots, players).outOfPosition === 0) chosen.push(pid);
  }
  for (const pid of candidates) {
    if (chosen.length === slots.length) break;
    if (!chosen.includes(pid)) chosen.push(pid);
  }
  const { assign } = assignSlots(chosen, slots, players);
  return gkId ? { GK: gkId, ...assign } : assign;
}

// Match each player coming on with one coming off, same position first.
function pairUp(ons, offs, newPos, oldPos) {
  const left = [...offs];
  return ons.map((on) => {
    const i = Math.max(0, left.findIndex((off) => oldPos(off) === newPos(on)));
    return { on, pos: newPos(on), replacing: left.splice(i, 1)[0] };
  });
}

function combinations(arr, k) {
  const out = [];
  const rec = (start, combo) => {
    if (combo.length === k) return out.push([...combo]);
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  };
  rec(0, []);
  return out;
}

// Choose who comes off and on: maximise (minutes of those coming off) minus
// (minutes of those coming on), never putting anyone out of position if it can
// be avoided, and moving as few staying players as possible. GK is not rotated.
export function suggestSubs(game, players, t) {
  const slots = makeSlots(game.settings.formation);
  const field = slots.map((s) => game.lineup[s.id]).filter(Boolean);
  const bench = benchIds(game);
  const k = Math.min(game.settings.subsPerChange, bench.length, field.length);
  if (k <= 0) return null;

  const need = Object.fromEntries(game.available.map((id) => [id, urgency(game, id, t)]));
  const current = inverse(game.lineup);
  let best = null;

  for (const ons of combinations(bench, k)) {
    for (const offs of combinations(field, k)) {
      const fairness = ons.reduce((a, id) => a + need[id], 0) - offs.reduce((a, id) => a + need[id], 0);
      if (best && fairness <= best.fairness - 1e-6 && best.outOfPosition === 0) continue;
      const staying = field.filter((id) => !offs.includes(id));
      const { assign, outOfPosition } = assignSlots([...staying, ...ons], slots, players, current);
      const moves = staying.filter((id) => assign[current[id]] !== id).length;
      // Moving a girl to a different position costs a little, so the app only
      // shuffles positions when it clearly helps even out minutes.
      const score = fairness - outOfPosition * 1e6 - moves * 0.15;
      if (!best || score > best.score) {
        best = { score, fairness, outOfPosition, ons, offs, assign };
      }
    }
  }
  if (!best || best.fairness <= 1e-9) return null;

  const lineup = { ...best.assign };
  if (game.lineup.GK) lineup.GK = game.lineup.GK;
  const slotPos = Object.fromEntries(slots.map((s) => [s.id, s.pos]));
  const after = inverse(lineup);
  return {
    ons: best.ons,
    offs: best.offs,
    lineup,
    outOfPosition: best.outOfPosition,
    // Human-readable pairing: who comes on, where, and who she replaces.
    swaps: pairUp(best.ons, best.offs, (id) => slotPos[after[id]], (id) => slotPos[current[id]]),
    moves: field
      .filter((id) => !best.offs.includes(id) && slotPos[after[id]] !== slotPos[current[id]])
      .map((id) => ({ id, from: slotPos[current[id]], to: slotPos[after[id]] })),
  };
}

// ---- score -------------------------------------------------------------------

// team is 'us' or 'them'. Scorer and assist are optional player ids; only our
// goals carry them, and a girl can't assist her own goal.
export function addGoal(game, { team, scorer = null, assist = null, half = game.half, t }) {
  game.goals ??= [];
  const ours = team === 'us';
  const goal = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    team: ours ? 'us' : 'them',
    half,
    t: Math.max(0, Math.round(t)),
    scorer: ours ? scorer || null : null,
    assist: ours && assist && assist !== scorer ? assist : null,
  };
  game.goals.push(goal);
  game.goals.sort((a, b) => a.half - b.half || a.t - b.t);
  return goal;
}

export function removeGoal(game, goalId) {
  game.goals = (game.goals ?? []).filter((g) => g.id !== goalId);
}

export function score(game) {
  const goals = game.goals ?? [];
  return { us: goals.filter((g) => g.team === 'us').length, them: goals.filter((g) => g.team === 'them').length };
}

// The minute shown next to a goal, counted across halves like a match report
// (a goal 12:30 into the 2nd of two 30-minute halves is the 43rd minute).
export function goalMinute(game, goal) {
  return goal.half * game.settings.halfMinutes + Math.floor(goal.t / 60) + 1;
}

// ---- state transitions -----------------------------------------------------

function snapshot(game) {
  return structuredClone({
    lineup: game.lineup,
    played: game.played,
    stintStart: game.stintStart,
    lastSubAt: game.lastSubAt,
    logLength: game.log.length,
  });
}

export function setLineup(game, lineup, t, { record = true } = {}) {
  if (record) game.history.push(snapshot(game));
  const before = new Set(onFieldIds(game));
  const after = new Set(Object.values(lineup).filter(Boolean));
  const off = [...before].filter((id) => !after.has(id));
  const on = [...after].filter((id) => !before.has(id));
  if (game.status === 'live') {
    for (const id of off) {
      game.played[id] = playedSeconds(game, id, t);
      delete game.stintStart[id];
    }
    for (const id of on) game.stintStart[id] = t;
    if (off.length || on.length) game.log.push({ half: game.half, t, on, off });
  }
  game.lineup = lineup;
  return { on, off };
}

export function applySubs(game, suggestion, t) {
  setLineup(game, suggestion.lineup, t);
  game.lastSubAt = t;
}

export function undo(game) {
  const snap = game.history.pop();
  if (!snap) return false;
  game.lineup = snap.lineup;
  game.played = snap.played;
  game.stintStart = snap.stintStart;
  game.lastSubAt = snap.lastSubAt;
  game.log.length = snap.logLength;
  return true;
}

export function startHalf(game, nowMs) {
  game.status = 'live';
  game.clock = { elapsed: 0, runningSince: nowMs };
  game.lastSubAt = 0;
  game.history = [];
  game.stintStart = {};
  for (const id of onFieldIds(game)) game.stintStart[id] = 0;
}

export function endHalf(game, players, nowMs, tiebreakOrder) {
  const t = halfElapsed(game, nowMs);
  for (const id of Object.keys(game.stintStart)) game.played[id] = playedSeconds(game, id, t);
  game.stintStart = {};
  game.clock = { elapsed: 0, runningSince: null };
  game.history = [];
  game.half += 1;
  if (game.half >= game.settings.halves) {
    game.status = 'done';
    return;
  }
  game.status = 'halftime';
  const gk = game.gk[game.half] || game.lineup.GK;
  game.lineup = buildLineup(game, players, gk, tiebreakOrder);
}

// Play the rest of the game forward with the suggested rotations to show where
// everyone's minutes will end up.
export function project(game, players, t) {
  const sim = structuredClone({ ...game, history: [] });
  const halfLen = sim.settings.halfMinutes * 60;
  const plan = [];
  let now = t;

  if (sim.status !== 'live') {
    if (sim.status === 'done') return { minutes: { ...sim.played }, plan };
    startHalf(sim, 0);
    now = 0;
  }
  for (;;) {
    let due;
    while ((due = nextSubDueAt(sim)) != null) {
      const at = Math.max(due, now);
      const s = suggestSubs(sim, players, at);
      if (s) plan.push({ half: sim.half, t: at, ...s });
      sim.lastSubAt = at;
      if (s) setLineup(sim, s.lineup, at, { record: false });
      now = at;
    }
    const end = Math.max(halfLen, now);
    for (const id of Object.keys(sim.stintStart)) sim.played[id] = playedSeconds(sim, id, end);
    sim.stintStart = {};
    sim.half += 1;
    if (sim.half >= sim.settings.halves) break;
    const gk = sim.gk[sim.half] || sim.lineup.GK;
    sim.lineup = buildLineup(sim, players, gk);
    startHalf(sim, 0);
    now = 0;
  }
  return { minutes: sim.played, plan };
}
