// In-memory stand-in for supabase-js, used by dev/demo.html to try the app
// without a Supabase project. Data lives in localStorage on this device only.

const KEY = 'sub-manager-demo';
const db = JSON.parse(localStorage.getItem(KEY) || 'null') ?? { teams: [], players: [], games: [] };
const persist = () => localStorage.setItem(KEY, JSON.stringify(db));
const user = { id: 'demo-user', email: 'demo@example.com' };
let session = { user };

class Query {
  constructor(table) {
    Object.assign(this, { table, op: 'select', filters: [], payload: null, one: false, sort: null, max: null });
  }
  select() { if (this.op === 'select') this.op = 'select'; this.returning = true; return this; }
  insert(row) { this.op = 'insert'; this.payload = row; return this; }
  update(patch) { this.op = 'update'; this.payload = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col, val) { this.filters.push((r) => r[col] === val); return this; }
  order(col, { ascending = true } = {}) { this.sort = { col, ascending }; return this; }
  limit(n) { this.max = n; return this; }
  single() { this.one = true; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
  run() {
    const rows = db[this.table];
    const match = (r) => this.filters.every((f) => f(r));
    let data;
    if (this.op === 'insert') {
      // Like Postgres, a multi-row insert is all-or-nothing.
      const batch = [this.payload].flat().map((p) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...structuredClone(p) }));
      for (const row of batch) {
        if (this.table === 'players') {
          row.active ??= true;
          if ([...rows, ...batch].some((p) => p !== row && p.active && p.team_id === row.team_id && p.number === row.number))
            return { data: null, error: { code: '23505', message: 'duplicate key' } };
        }
        if (this.table === 'teams') row.settings ??= {};
      }
      rows.push(...batch);
      data = batch;
    } else if (this.op === 'update') {
      data = rows.filter(match);
      if (this.table === 'players' && 'number' in this.payload) {
        const p = data[0];
        if (rows.some((o) => o !== p && o.active && o.team_id === p.team_id && o.number === this.payload.number))
          return { data: null, error: { code: '23505', message: 'duplicate key' } };
      }
      data.forEach((r) => Object.assign(r, structuredClone(this.payload)));
    } else if (this.op === 'delete') {
      db[this.table] = rows.filter((r) => !match(r));
      data = [];
    } else {
      data = rows.filter(match);
      if (this.sort) {
        const { col, ascending } = this.sort;
        data = [...data].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (ascending ? 1 : -1));
      }
      if (this.max != null) data = data.slice(0, this.max);
    }
    if (this.op !== 'select') persist();
    data = structuredClone(data);
    return { data: this.one ? data[0] ?? null : data, error: null };
  }
}

export function createClient() {
  const listeners = [];
  const emit = (e) => listeners.forEach((cb) => cb(e, session));
  return {
    from: (table) => new Query(table),
    // Demo: allowed unless ?denied is in the URL.
    rpc: async (fn) => ({ data: fn === 'is_allowed_user' ? !location.search.includes('denied') : null, error: null }),
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange(cb) {
        listeners.push(cb);
        setTimeout(() => cb('INITIAL_SESSION', session), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithOAuth() { session = { user }; emit('SIGNED_IN'); return { error: null }; },
      async signOut() { session = null; emit('SIGNED_OUT'); return { error: null }; },
    },
  };
}
