// HTML for each page, built from the deal data. Every value is escaped before it goes
// into the page. The verdict is computed from the two prices, never typed in:
// 50%+ off is a true low, 40-49% strong, 25-39% good, 15-24% fair, under 15% routine.

const escape = (s) => String(s).replace(/[&<>\"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const day = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

export function verdict(d) {
  const p = percentOff(d);
  if (p >= 50) return { label: 'TRUE LOW', cls: 'v-low' };
  if (p >= 40) return { label: 'STRONG DEAL', cls: 'v-strong' };
  if (p >= 25) return { label: 'GOOD DEAL', cls: 'v-good' };
  if (p >= 15) return { label: 'FAIR DEAL', cls: 'v-fair' };
  return { label: 'ROUTINE SALE', cls: 'v-routine' };
}

export function card(d) {
  const v = verdict(d);
  return `<article class="card">
  <div class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span></div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="price"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s> <span class="pct">−${percentOff(d)}%</span></p>
  <p class="save">You save ${usd(saved(d))}</p>
  <p class="verdict ${v.cls}">${v.label}</p>
  <p class="why">${escape(d.why)}</p>
  <p class="meta">Checked ${day(d.checked)} · ${escape(d.source)}</p>
  <p class="cta"><a class="btn" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a>
  <a class="details" href="#/deal/${encodeURIComponent(d.id)}">Details</a></p>
</article>`;
}

export function rows(list) {
  if (list.length === 0) return '<p class="empty">No deal matches those filters. Clear the search or pick another category.</p>';
  return `<div class="grid">${list.map(card).join('')}</div>`;
}

export function listPage(state, counts) {
  const total = state.all.length;
  const shown = state.shown.length;
  const best = state.all.reduce((m, d) => Math.max(m, percentOff(d)), 0);
  const totalSaved = state.all.reduce((s, d) => s + saved(d), 0);
  const cats = ['All', ...new Set(state.all.map((d) => d.category))];
  const stores = ['All stores', ...new Set(state.all.map((d) => d.store))];
  return `<section class="hero">
  <p class="kicker">BLACK FRIDAY · NOV 27 — CYBER MONDAY · NOV 30</p>
  <h1>TrueFriday</h1>
  <p class="tag">Real Black Friday deals, checked today — every price read at its store, every discount worked out from the two prices, and an honest verdict on whether it is really a deal.</p>
  <p class="stats"><strong>${total} deals</strong> · up to <strong>${best}% off</strong> · <strong>${usd(totalSaved)}</strong> total savings if you bought one of each</p>
</section>
<section class="controls">
  <label class="search">Search <input id="q" type="search" placeholder="Try “AirPods”, “Dyson”, “TV”…" value="${escape(state.q)}"></label>
  <div class="chips" id="cats">${cats.map((c) => `<button type="button" data-cat="${escape(c)}" class="${state.cat === c ? 'on' : ''}">${escape(c)}</button>`).join('')}</div>
  <div class="row2">
    <label>Store <select id="store">${stores.map((s) => `<option ${state.store === s ? 'selected' : ''}>${escape(s)}</option>`).join('')}</select></label>
    <label>At least <select id="minoff">
      ${[0, 25, 40, 50].map((n) => `<option value="${n}" ${state.minOff === n ? 'selected' : ''}>${n === 0 ? 'any discount' : n + '% off'}</option>`).join('')}
    </select></label>
    <label>Sort <select id="sort">
      <option value="off" ${state.sort === 'off' ? 'selected' : ''}>Biggest discount first</option>
      <option value="save" ${state.sort === 'save' ? 'selected' : ''}>Most dollars saved</option>
      <option value="low" ${state.sort === 'low' ? 'selected' : ''}>Lowest price first</option>
      <option value="high" ${state.sort === 'high' ? 'selected' : ''}>Highest price first</option>
    </select></label>
  </div>
  <p class="count">Showing <strong>${shown}</strong> of ${total} deals${state.cat !== 'All' ? ` · ${escape(state.cat)}` : ''}${state.store !== 'All stores' ? ` · ${escape(state.store)}` : ''}${state.minOff > 0 ? ` · ${state.minOff}% off or more` : ''}</p>
</section>
${rows(state.shown)}
<p class="note">Prices were read on Nov 27, 2026 from the store or deal report named on each card; they can change or sell out. Discounts are computed from the sale price and the usual price — never typed in.</p>`;
}

export function dealPage(d, all) {
  const v = verdict(d);
  const same = all.filter((x) => x.title === d.title && x.id !== d.id);
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span></div>
  <h1>${escape(d.title)}</h1>
  <p class="price big"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s> <span class="pct">−${percentOff(d)}%</span></p>
  <p class="save big">You save ${usd(saved(d))}</p>
  <p class="verdict ${v.cls} big">${v.label}</p>
  <p class="why big">${escape(d.why)}</p>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Price checked</dt><dd>${day(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  ${same.length ? `<p class="compare">Same product elsewhere: ${same.map((x) => `<a href="#/deal/${encodeURIComponent(x.id)}">${escape(x.store)} ${usd(x.price)}</a>`).join(' · ')}</p>` : ''}
  <p class="cta"><a class="btn big" href="${escape(d.url)}" target="_blank" rel="noopener">View it at ${escape(d.store)} ↗</a></p>
</article>`;
}

export function missingPage() {
  return `<h1>Not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
