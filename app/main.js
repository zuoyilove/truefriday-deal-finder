// TrueFriday: a deal finder that runs from its own files, no network.
// Routes: #/ (the list, with search and filters) and #/deal/<id> (one deal).
// ?shot=filter presets the Audio filter so a screenshot can show the filters
// visibly working; ?shot=deal opens the Dyson V9 detail page.
// window.__shotReady is false while a page renders and true once it is on screen,
// so a screenshot script knows when to capture.

import { deals } from './data.js';
import { dealPage, listPage, missingPage, rows } from './views.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const pct = (d) => 1 - d.price / d.was;

const state = {
  all: deals,
  shown: deals,
  q: '',
  cat: params.get('shot') === 'filter' ? 'Audio' : 'All',
  store: 'All stores',
  minOff: 0,
  sort: 'off',
};

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let list = state.all.filter(
    (d) =>
      (state.cat === 'All' || d.category === state.cat) &&
      (state.store === 'All stores' || d.store === state.store) &&
      pct(d) * 100 >= state.minOff &&
      (q === '' || `${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)),
  );
  const by = {
    off: (a, b) => pct(b) - pct(a),
    save: (a, b) => b.was - b.price - (a.was - a.price),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  }[state.sort];
  list = [...list].sort(by);
  state.shown = list;
}

function bindControls() {
  const q = app.querySelector('#q');
  if (q) q.addEventListener('input', () => { state.q = q.value; applyFilters(); renderListOnly(); });
  app.querySelectorAll('#cats button').forEach((b) =>
    b.addEventListener('click', () => { state.cat = b.dataset.cat; applyFilters(); render(); }),
  );
  const store = app.querySelector('#store');
  if (store) store.addEventListener('change', () => { state.store = store.value; applyFilters(); render(); });
  const minOff = app.querySelector('#minoff');
  if (minOff) minOff.addEventListener('change', () => { state.minOff = Number(minOff.value); applyFilters(); render(); });
  const sort = app.querySelector('#sort');
  if (sort) sort.addEventListener('change', () => { state.sort = sort.value; applyFilters(); render(); });
}

function renderListOnly() {
  const grid = app.querySelector('.grid, .empty');
  const count = app.querySelector('.count');
  if (grid) grid.outerHTML = rows(state.shown);
  if (count) count.innerHTML = `Showing <strong>${state.shown.length}</strong> of ${state.all.length} deals`;
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : 'Not found'} | TrueFriday`;
    app.innerHTML = found ? dealPage(found, deals) : missingPage();
  } else {
    document.title = 'TrueFriday — Real Black Friday deals, checked today';
    applyFilters();
    app.innerHTML = listPage(state);
    bindControls();
    const q = app.querySelector('#q');
    if (q && document.activeElement !== q) q.value = state.q;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

if (params.get('shot') === 'deal') location.hash = '#/deal/dyson-v9';
window.addEventListener('hashchange', render);
render();
