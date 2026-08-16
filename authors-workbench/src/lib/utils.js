export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);


export const localId = () => `local-${uid()}`;

export function wordCount(str) {
  if (!str) return 0;
  const trimmed = str.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}


export function capWords(str, max) {
  if (!str) return str;
  const words = str.split(/\s+/);
  if (words.length <= max) return str;
  return words.slice(0, max).join(" ");
}

export function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}


export function rebalance(items) {
  const manual = items.filter((s) => s.manual);
  const auto = items.filter((s) => !s.manual);
  const manualTotal = manual.reduce((sum, s) => sum + s.pct, 0);

  if (auto.length > 0) {
    const remaining = Math.max(0, 100 - manualTotal);
    const each = remaining / auto.length;
    return items.map((s) => (s.manual ? s : { ...s, pct: each }));
  }
  if (manualTotal > 100) {
    const excess = manualTotal - 100;
    const share = excess / manual.length;
    return items.map((s) => ({ ...s, pct: Math.max(0, s.pct - share) }));
  }
  return items;
}

export function setItemPct(items, id, newPct) {
  const clamped = Math.max(0, Math.min(100, newPct));
  const others = items.filter((s) => s.id !== id && s.manual);
  const othersTotal = others.reduce((sum, s) => sum + s.pct, 0);
  const finalPct = clamped + othersTotal > 100 ? 100 - othersTotal : clamped;
  const updated = items.map((s) => (s.id === id ? { ...s, pct: Math.max(0, finalPct), manual: true } : s));
  return rebalance(updated);
}


export function withRanges(items) {
  let cursor = 0;
  return items.map((s) => {
    const start = cursor;
    cursor += s.pct;
    return { ...s, rangeStart: start, rangeEnd: cursor };
  });
}


export function distributeWhole(items, total) {
  if (items.length === 0) return [];
  const raw = items.map((s) => (total * s.pct) / 100);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder && order.length; k++) {
    result[order[k % order.length].i] += 1;
  }
  return result;
}
