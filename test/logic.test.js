import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS, newGame, buildLineup, suggestSubs, applySubs, startHalf, endHalf,
  project, makeSlots, canPlay, undo, playedSeconds, targetSeconds,
  addGoal, removeGoal, score, goalMinute,
} from '../logic.js';

function squad(spec) {
  // spec: { name: 'DM' } -> positions
  const players = {};
  for (const [name, pos] of Object.entries(spec)) {
    players[name] = { id: name, name, positions: pos.split(',').filter(Boolean) };
  }
  return players;
}

const twelve = squad({
  Ava: 'GK,D', Mia: 'D', Zoe: 'D,M', Lily: 'D', Ella: 'M', Nora: 'M,S',
  Ruby: 'M', Isla: 'S', Ivy: 'S,M', June: 'D,M,S', Cleo: 'M', Tess: 'GK,S',
});

function setup(players, gk = ['Ava', 'Tess']) {
  const g = newGame(DEFAULT_SETTINGS, Object.keys(players), gk);
  g.lineup = buildLineup(g, players, gk[0]);
  return g;
}

test('lineup fills every slot in position', () => {
  const g = setup(twelve);
  const slots = makeSlots(g.settings.formation);
  assert.equal(slots.length, 6, '7v7 default: 6 field players + GK');
  assert.equal(g.lineup.GK, 'Ava');
  for (const s of slots) assert.ok(canPlay(twelve[g.lineup[s.id]], s.pos), `${g.lineup[s.id]} in ${s.pos}`);
});

test('subs swap two at a time, bench players with fewest minutes come on', () => {
  const g = setup(twelve);
  startHalf(g, 0);
  const s = suggestSubs(g, twelve, 240);
  assert.equal(s.ons.length, 2);
  assert.equal(s.offs.length, 2);
  assert.equal(s.outOfPosition, 0);
  applySubs(g, s, 240);
  for (const id of s.ons) assert.equal(g.stintStart[id], 240);
  for (const id of s.offs) assert.equal(g.played[id], 240);
});

test('full-game projection splits minutes evenly within position limits', () => {
  const g = setup(twelve);
  const { minutes } = project(g, twelve, 0);
  const target = targetSeconds(g);
  const field = Object.keys(twelve);
  const vals = field.map((id) => minutes[id]);
  const total = vals.reduce((a, b) => a + b, 0);
  const onField = makeSlots(g.settings.formation).length + 1;
  assert.equal(total, onField * g.settings.halves * g.settings.halfMinutes * 60);
  // Subs come in 4-minute blocks, so a few minutes either side is the best
  // possible — including for both goalkeepers.
  for (const id of field) assert.ok(Math.abs(minutes[id] - target) <= 4 * 60, `${id}: ${minutes[id] / 60} vs ${target / 60}`);
});

test('evenness holds for 10 and 11 players too', () => {
  for (const n of [10, 11]) {
    const ids = Object.keys(twelve).filter((id) => id !== 'Cleo').slice(0, n - 1).concat('Tess');
    const players = Object.fromEntries(ids.map((id) => [id, twelve[id]]));
    const g = setup(players);
    const { minutes } = project(g, players, 0);
    const target = targetSeconds(g);
    for (const id of ids) assert.ok(Math.abs(minutes[id] - target) <= 4 * 60, `${n}: ${id} ${minutes[id] / 60} vs ${target / 60}`);
  }
});

test('staying players are never shuffled within their own position', () => {
  const g = setup(twelve);
  const { plan } = project(g, twelve, 0);
  for (const step of plan) for (const m of step.moves) assert.notEqual(m.from, m.to);
  for (const step of plan) for (const sw of step.swaps) assert.ok(step.offs.includes(sw.replacing));
});

test('position-restricted bench player only replaces someone in her position', () => {
  const players = squad({
    G: 'GK', D1: 'D', D2: 'D', M1: 'M', M2: 'M', M3: 'M', S1: 'S', Donly: 'D', Monly: 'M',
  });
  const g = setup(players, ['G', 'G']);
  startHalf(g, 0);
  const s = suggestSubs(g, players, 240);
  for (const sw of s.swaps) assert.ok(canPlay(players[sw.on], sw.pos));
});

test('undo restores lineup and minutes', () => {
  const g = setup(twelve);
  startHalf(g, 0);
  const before = structuredClone(g.lineup);
  const s = suggestSubs(g, twelve, 240);
  applySubs(g, s, 240);
  assert.ok(undo(g));
  assert.deepEqual(g.lineup, before);
  for (const id of s.offs) assert.equal(playedSeconds(g, id, 300), 300);
});

test('half time closes stints and builds a new lineup with the 2nd-half GK', () => {
  const g = setup(twelve);
  startHalf(g, 0);
  endHalf(g, twelve, 30 * 60 * 1000);
  assert.equal(g.status, 'halftime');
  assert.equal(g.lineup.GK, 'Tess');
  assert.deepEqual(g.stintStart, {});
  assert.equal(g.played.Ava, 1800);
});

test('no bench means no subs', () => {
  // Exactly enough for 7v7 (6 field + GK), nobody spare.
  const players = squad({ A: 'GK', B: '', C: '', D: '', E: '', F: '', G: '' });
  const g = setup(players, ['A', 'A']);
  startHalf(g, 0);
  assert.equal(suggestSubs(g, players, 240), null);
});

test('goals: score, optional scorer/assist, minutes across halves, removal', () => {
  const g = setup(twelve);
  startHalf(g, 0);
  const a = addGoal(g, { team: 'us', scorer: 'Isla', assist: 'Nora', t: 754 });
  addGoal(g, { team: 'us', t: 100 }); // scorer unknown
  addGoal(g, { team: 'them', scorer: 'Isla', t: 300 }); // their goals never carry our players
  addGoal(g, { team: 'us', scorer: 'Ivy', assist: 'Ivy', half: 1, t: 60 }); // can't assist yourself
  assert.deepEqual(score(g), { us: 3, them: 1 });
  assert.equal(goalMinute(g, a), 13);
  assert.deepEqual(g.goals.map((x) => [x.half, x.t]), [[0, 100], [0, 300], [0, 754], [1, 60]]);
  assert.equal(g.goals[1].scorer, null);
  assert.equal(g.goals[3].assist, null);
  assert.equal(goalMinute(g, g.goals[3]), 32);
  removeGoal(g, a.id);
  assert.deepEqual(score(g), { us: 2, them: 1 });
});

test('undoing a sub leaves goals alone', () => {
  const g = setup(twelve);
  startHalf(g, 0);
  applySubs(g, suggestSubs(g, twelve, 240), 240);
  addGoal(g, { team: 'us', scorer: 'Isla', t: 250 });
  undo(g);
  assert.equal(score(g).us, 1);
});
