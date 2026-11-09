// EcoLoop Marketplace View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderMarketplace(container, queryParams = {}) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Circular Materials Marketplace</h1>
          <p class="text-sm text-slate-600 mt-1">Discover, negotiate, and reuse verified secondary resources and surplus business inventory.</p>
        </div>
        <div class="flex items-center gap-3">
          <a href="#list-waste" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2">
            <span>+</span> List Surplus Material
          </a>
        </div>
      </div>

      <!-- Search & Category Filter Bar -->
      <div class="mt-6 space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input type="text" id="market-search" placeholder="Search materials (e.g. Cardboard, HDPE regrind, Aluminum offcuts, Pallets)..."
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm">
          </div>

          <!-- Sort dropdown -->
          <div class="sm:w-56 shrink-0">
            <select id="market-sort" class="w-full py-3 px-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 shadow-sm">
              <option value="match">Sort: AI Best Match</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="distance">Distance: Nearest First</option>
              <option value="newest">Recently Listed</option>
            </select>
          </div>
        </div>

        <!-- Category Horizontal Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs" id="category-pills">
          <button data-cat="all" class="cat-pill px-4 py-2 rounded-xl font-bold bg-[#0F382A] text-white shadow-sm shrink-0">
            All Materials
          </button>
          <button data-cat="cardboard" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            📦 Cardboard
          </button>
          <button data-cat="plastic" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            ♳ Plastics
          </button>
          <button data-cat="metal" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            ⚙️ Metal Scrap
          </button>
          <button data-cat="wood" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            🪵 Wood & Pallets
          </button>
          <button data-cat="food-waste" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            ☕ Food & Coffee Waste
          </button>
          <button data-cat="industrial-scrap" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            🏭 Industrial Scrap
          </button>
          <button data-cat="furniture" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            🪑 Office Furniture
          </button>
          <button data-cat="packaging" class="cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
            ✉️ Packaging Film
          </button>
        </div>
      </div>

      <!-- Quick Toggles Bar -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex flex-wrap items-center gap-4">
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="filter-verified" class="rounded text-emerald-600 focus:ring-emerald-500">
            <span class="font-medium text-slate-700">Verified Sellers Only</span>
          </label>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="filter-logistics" class="rounded text-emerald-600 focus:ring-emerald-500" checked>
            <span class="font-medium text-slate-700">EcoLoop Green Fleet Available</span>
          </label>
        </div>
        <div class="text-slate-500 font-medium" id="results-count">
          Showing materials...
        </div>
      </div>

      <!-- Listing Cards Grid Container -->
      <div id="listings-grid" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Rendered dynamically -->
        <div class="col-span-full py-12 text-center text-slate-400">
          Loading sustainable resources...
        </div>
      </div>
    </div>
  `;

  let currentCategory = queryParams.category || 'all';
  let searchTerm = queryParams.q || '';

  const searchInput = container.querySelector('#market-search');
  const sortSelect = container.querySelector('#market-sort');
  const verifiedCheckbox = container.querySelector('#filter-verified');
  const logisticsCheckbox = container.querySelector('#filter-logistics');
  const pillsContainer = container.querySelector('#category-pills');
  const gridContainer = container.querySelector('#listings-grid');
  const countLabel = container.querySelector('#results-count');

  if (searchTerm) searchInput.value = searchTerm;

  // Set active category pill
  updatePillStyles();

  async function loadData() {
    gridContainer.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm font-medium text-slate-500">Querying circular economy inventory & computing AI match scores...</p>
      </div>
    `;

    try {
      const res = await API.getListings({
        q: searchInput.value.trim(),
        category: currentCategory,
        sort: sortSelect.value,
        verified_only: verifiedCheckbox.checked,
        logistics_only: logisticsCheckbox.checked
      });

      if (!res.success || res.listings.length === 0) {
        countLabel.textContent = `0 materials found`;
        gridContainer.innerHTML = `
          <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <span class="text-4xl block mb-3">📦</span>
            <h4 class="text-lg font-bold text-slate-900">No matching materials found</h4>
            <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">Try loosening your search filters, selecting a different material category, or post a request so sellers can contact you.</p>
            <button id="reset-filters" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition">
              Reset Filters
            </button>
          </div>
        `;
        const resetBtn = gridContainer.querySelector('#reset-filters');
        if (resetBtn) {
          resetBtn.onclick = () => {
            searchInput.value = '';
            currentCategory = 'all';
            verifiedCheckbox.checked = false;
            logisticsCheckbox.checked = false;
            updatePillStyles();
            loadData();
          };
        }
        return;
      }

      countLabel.textContent = `Showing ${res.listings.length} verified listings`;

      gridContainer.innerHTML = res.listings.map(item => `
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col overflow-hidden group">
          <!-- Card Image & AI Match Pill -->
          <div class="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img src="${item.images[0]}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">

            <!-- AI Match Pill -->
            <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1 shadow-md">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              ${item.ai_match}% Match
            </div>

            <!-- Condition Tag -->
            <div class="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur text-slate-700 font-semibold text-[11px] shadow-sm">
              ${item.condition}
            </div>

            <!-- Distance Pill -->
            <div class="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-white text-[11px] font-mono">
              📍 ${item.distance_km} km away
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>${item.category_name}</span>
                <span class="text-emerald-700 font-semibold text-[11px]">${item.demand_level}</span>
              </div>

              <h4 class="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                <a href="#material/${item.id}">${item.title}</a>
              </h4>

              <!-- Seller business & location (Protected Approximate) -->
              <div class="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span class="truncate flex items-center gap-1">
                  ${item.seller_verified ? '<span class="text-emerald-600 font-bold" title="Verified Enterprise">✓</span>' : ''}
                  <strong class="text-slate-800">${item.business_name}</strong>
                </span>
                <span class="shrink-0 text-slate-500">${item.city}, ${item.state}</span>
              </div>

              <!-- Price & Quantity -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span class="text-xs text-slate-400 block font-normal">Available</span>
                  <span class="text-sm font-bold text-slate-800">${item.quantity} ${item.unit}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs text-slate-400 block font-normal">Enterprise Price</span>
                  <span class="text-base font-extrabold text-emerald-700 font-mono">₹${item.price_per_unit}<span class="text-xs font-normal text-slate-500">/${item.unit}</span></span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <a href="#material/${item.id}" class="py-2 px-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition">
                View Details
              </a>
              <a href="#material/${item.id}?action=request" class="py-2 px-3 text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm">
                Request
              </a>
            </div>
          </div>
        </div>
      `).join('');

    } catch (err) {
      gridContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200 p-6">
          <p class="font-bold">Failed to load marketplace listings</p>
          <p class="text-xs text-rose-500 mt-1">${err.message}</p>
          <button id="retry-load" class="mt-3 px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs">Retry</button>
        </div>
      `;
      const retryBtn = gridContainer.querySelector('#retry-load');
      if (retryBtn) retryBtn.onclick = loadData;
    }
  }

  function updatePillStyles() {
    pillsContainer.querySelectorAll('.cat-pill').forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      if (cat === currentCategory) {
        btn.className = "cat-pill px-4 py-2 rounded-xl font-bold bg-[#0F382A] text-white shadow-sm shrink-0";
      } else {
        btn.className = "cat-pill px-4 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0";
      }
    });
  }

  // Event handlers
  pillsContainer.onclick = (e) => {
    const pill = e.target.closest('.cat-pill');
    if (pill) {
      currentCategory = pill.getAttribute('data-cat');
      updatePillStyles();
      loadData();
    }
  };

  let debounceTimer;
  searchInput.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadData, 300);
  };

  sortSelect.onchange = loadData;
  verifiedCheckbox.onchange = loadData;
  logisticsCheckbox.onchange = loadData;

  // Initial load
  loadData();
}
