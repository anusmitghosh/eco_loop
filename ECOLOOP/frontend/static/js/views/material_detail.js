// EcoLoop Material Detail View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderMaterialDetail(container, listingId, actionParam = null) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="material-detail-content" class="py-12 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading material specifications & running AI match model...</p>
      </div>
    </div>
  `;

  const contentBox = container.querySelector('#material-detail-content');

  try {
    const res = await API.getListingDetail(listingId);
    if (!res.success || !res.listing) {
      contentBox.innerHTML = `
        <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto">
          <p class="text-slate-800 font-bold text-lg">Material listing not found or archived.</p>
          <a href="#marketplace" class="mt-4 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Back to Marketplace</a>
        </div>
      `;
      return;
    }

    const item = res.listing;
    const ai = item.ai_match_details || {};
    const impact = ai.impact || {};

    contentBox.innerHTML = `
      <div class="text-left">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <a href="#marketplace" class="hover:text-emerald-700">Marketplace</a>
          <span>/</span>
          <span>${item.category_name}</span>
          <span>/</span>
          <span class="text-slate-900 font-bold truncate">${item.title}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left Col: Photo & Specifications -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Main Photo & Gallery -->
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div class="relative h-80 sm:h-96 w-full bg-slate-100">
                <img id="main-image" src="${item.images[0]}" alt="${item.title}" class="w-full h-full object-cover">
                <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-300 font-bold text-xs backdrop-blur border border-emerald-500/30">
                  ${ai.match_percentage}% AI Compatibility Match
                </div>
                <div class="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-white/95 text-slate-800 font-bold text-xs shadow-sm">
                  ${item.condition}
                </div>
              </div>

              ${item.images.length > 1 ? `
                <div class="p-4 flex gap-3 overflow-x-auto border-t border-slate-100">
                  ${item.images.map((img, i) => `
                    <button class="thumb-btn h-16 w-20 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-emerald-600' : 'border-transparent'} shrink-0" data-src="${img}">
                      <img src="${img}" class="w-full h-full object-cover">
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Description & Material Properties -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 class="text-lg font-bold text-slate-900 mb-3">Resource Overview</h3>
              <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">${item.description}</p>

              <div class="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span class="text-slate-400 block font-medium">Resource Type</span>
                  <span class="font-bold text-slate-800 text-sm mt-0.5 block">${item.resource_type}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Condition Grade</span>
                  <span class="font-bold text-emerald-700 text-sm mt-0.5 block">${item.condition}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Minimum Order</span>
                  <span class="font-bold text-slate-800 text-sm mt-0.5 block">${item.minimum_order} ${item.unit}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Approximate Area</span>
                  <span class="font-bold text-slate-800 text-sm mt-0.5 block">${item.city}, ${item.state}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Proximity Distance</span>
                  <span class="font-bold text-slate-800 text-sm mt-0.5 block">~${ai.distance_km} km away</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-medium">Availability</span>
                  <span class="font-bold text-emerald-600 text-sm mt-0.5 block">Ready for Pickup</span>
                </div>
              </div>

              <!-- Location Privacy Note -->
              <div class="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
                <span class="text-base text-emerald-700">🔒</span>
                <div>
                  <strong class="text-slate-800 block">EcoLoop Location Privacy Protected:</strong>
                  Public listings display approximate city and neighborhood radius only. Exact coordinates and warehouse dispatch docks are unlocked exclusively to authorized logistics personnel upon order escrow confirmation.
                </div>
              </div>
            </div>

            <!-- Environmental Impact Card -->
            <div class="bg-gradient-to-br from-emerald-950 to-[#0F382A] text-white rounded-2xl p-6 shadow-md">
              <div class="flex items-center justify-between pb-4 border-b border-emerald-800/80">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🌱</span>
                  <h4 class="font-bold text-base text-emerald-100">Estimated Circular Environmental Benefit</h4>
                </div>
                <span class="text-[11px] font-mono text-emerald-400">EPA WARM Standard</span>
              </div>

              <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div class="text-xl font-extrabold text-emerald-400 font-mono">${impact.waste_diverted_tonnes || 0.08} t</div>
                  <span class="text-[11px] text-emerald-200/80 mt-1 block">Landfill Diverted</span>
                </div>
                <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div class="text-xl font-extrabold text-emerald-400 font-mono">${impact.co2_avoided_kg || 112} kg</div>
                  <span class="text-[11px] text-emerald-200/80 mt-1 block">CO2e Emissions Avoided</span>
                </div>
                <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div class="text-xl font-extrabold text-emerald-400 font-mono">${impact.water_saved_liters || 2080} L</div>
                  <span class="text-[11px] text-emerald-200/80 mt-1 block">Freshwater Conserved</span>
                </div>
                <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div class="text-xl font-extrabold text-emerald-400 font-mono">${impact.trees_equivalent || 5.3}</div>
                  <span class="text-[11px] text-emerald-200/80 mt-1 block">Trees Eqv. Planted</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Col: Pricing, Seller Info, AI Match Breakdown, & Purchase Request -->
          <div class="lg:col-span-5 space-y-6">
            <!-- Price Card -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div class="flex items-baseline justify-between">
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Enterprise Rate</span>
                  <div class="text-3xl font-extrabold text-emerald-700 font-mono mt-1">
                    ₹${item.price_per_unit}
                    <span class="text-sm font-normal text-slate-500">/ ${item.unit}</span>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ${item.quantity} ${item.unit} Available
                </span>
              </div>

              <!-- Action buttons -->
              <div class="mt-6 space-y-3">
                <button id="btn-open-request-modal" class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2">
                  <span>🛒</span> Request Material / Make Offer
                </button>
                <button id="btn-message-seller" class="w-full py-3 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2">
                  <span>💬</span> In-App Chat With Seller
                </button>
              </div>
            </div>

            <!-- AI Matching Engine Transparent Breakdown -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">AI</span>
                  <h4 class="font-bold text-sm text-slate-900">Multi-Factor Circular Compatibility</h4>
                </div>
                <span class="text-sm font-extrabold text-emerald-700 font-mono">${ai.match_percentage}% Match</span>
              </div>

              <!-- Multi-Factor Subscores Progress Bars -->
              <div class="mt-4 space-y-2.5 pb-4 border-b border-slate-100">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Algorithmic Subscores</span>
                ${[
                  { label: "Material Affinity", key: "material", defaultVal: 85 },
                  { label: "Proximity & Geo-routing", key: "proximity", defaultVal: 92 },
                  { label: "Condition & Purity", key: "condition", defaultVal: 95 },
                  { label: "Enterprise Trust Index", key: "trust", defaultVal: 96 },
                  { label: "Green Logistics Feasibility", key: "logistics", defaultVal: 90 }
                ].map(metric => {
                  const val = (ai.subscores && ai.subscores[metric.key] !== undefined) ? ai.subscores[metric.key] : metric.defaultVal;
                  return `
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-slate-600 font-medium">${metric.label}</span>
                        <span class="font-mono font-bold text-emerald-700">${val}/100</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" style="width: ${val}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Transparent Justification Bullet Points -->
              <div class="mt-4 space-y-2 text-xs text-slate-600">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Decision Rationale</span>
                ${(ai.reasons || []).map(r => `
                  <div class="flex items-start gap-2">
                    <span class="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                    <span class="leading-relaxed">${r}</span>
                  </div>
                `).join('')}
              </div>

              <div class="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900">
                <span class="font-bold block mb-1">Recommended Green Logistics:</span>
                ${ai.transportation_estimate || 'EcoLoop EV 1-Ton Cargo'} (~₹${ai.estimated_logistics_cost || 80} estimated transit cost, ~${ai.estimated_duration_mins || 18} mins duration).
              </div>

              <div class="mt-3 text-[11px] text-slate-400">
                ${ai.recommended_action || 'Priority Request Recommended'}
              </div>
            </div>

            <!-- Seller Business Card -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Business</span>
                ${item.seller_verified ? `
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <span>✓</span> Verified Enterprise
                  </span>
                ` : ''}
              </div>

              <div class="mt-4 flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img src="${item.seller_logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop'}" class="w-full h-full object-cover">
                </div>
                <div>
                  <h4 class="font-bold text-slate-900 text-sm leading-snug">${item.business_name}</h4>
                  <p class="text-xs text-slate-500">${item.business_type} • ${item.seller_city}, ${item.seller_state}</p>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span class="font-bold text-slate-800 text-sm">${item.seller_rating || 5.0} ★</span>
                  <span class="text-slate-400 block text-[10px] mt-0.5">Rating</span>
                </div>
                <div>
                  <span class="font-bold text-slate-800 text-sm">${item.seller_tx_count || 12}</span>
                  <span class="text-slate-400 block text-[10px] mt-0.5">Completed Sales</span>
                </div>
                <div>
                  <span class="font-bold text-emerald-700 text-sm">${item.materials_sold_kg || 1200} kg</span>
                  <span class="text-slate-400 block text-[10px] mt-0.5">Total Reused</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase Request Modal -->
      <div id="request-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-lg text-slate-900">Request Material</h3>
              <p class="text-xs text-slate-500">Negotiate and schedule with ${item.business_name}</p>
            </div>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>

          <form id="purchase-request-form" class="mt-6 space-y-4">
            <!-- Quantity -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Requested Quantity (${item.unit}) <span class="text-slate-400 font-normal">(Min: ${item.minimum_order} ${item.unit})</span>
              </label>
              <input type="number" id="req-qty" min="${item.minimum_order}" max="${item.quantity}" value="${item.minimum_order}" step="any" required
                class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Offer Price -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Offer Price Per ${item.unit} (₹) <span class="text-slate-400 font-normal">(Original: ₹${item.price_per_unit})</span>
              </label>
              <input type="number" id="req-price" min="1" value="${item.price_per_unit}" step="any" required
                class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500">
            </div>

            <!-- Logistics Preference -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Pickup / Delivery Method</label>
              <select id="req-logistics" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500">
                <option value="ecoloop_logistics">EcoLoop Green Fleet Logistics (Recommended - Dual OTP & Live GPS)</option>
                <option value="buyer_pickup">I'll Arrange Self-Pickup</option>
                <option value="seller_delivery">Seller Direct Delivery</option>
              </select>
            </div>

            <!-- Message to Seller -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Message / Handling Requirements</label>
              <textarea id="req-message" rows="3" placeholder="e.g. Please ensure moisture-proof strapping for transit..."
                class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>

            <!-- Order Summary Estimate -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div class="flex justify-between text-slate-600">
                <span>Material Cost:</span>
                <span id="sum-material" class="font-mono font-bold">₹0.00</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>EcoLoop Escrow Fee (5%):</span>
                <span id="sum-platform" class="font-mono font-bold">₹30.00</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Estimated Logistics:</span>
                <span id="sum-logistics" class="font-mono font-bold">₹80.00</span>
              </div>
              <div class="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-extrabold text-sm">
                <span>Estimated Total:</span>
                <span id="sum-total" class="font-mono text-emerald-700">₹0.00</span>
              </div>
            </div>

            <button type="submit" id="submit-request-btn" class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition">
              Submit Request & Start In-App Negotiation
            </button>
          </form>
        </div>
      </div>
    `;

    // Image thumbnail switcher
    contentBox.querySelectorAll('.thumb-btn').forEach(btn => {
      btn.onclick = () => {
        contentBox.querySelector('#main-image').src = btn.getAttribute('data-src');
        contentBox.querySelectorAll('.thumb-btn').forEach(b => b.classList.replace('border-emerald-600', 'border-transparent'));
        btn.classList.replace('border-transparent', 'border-emerald-600');
      };
    });

    // Modal controls
    const modal = contentBox.querySelector('#request-modal');
    const openModalBtn = contentBox.querySelector('#btn-open-request-modal');
    const closeModalBtn = contentBox.querySelector('#close-modal-btn');
    const reqForm = contentBox.querySelector('#purchase-request-form');

    const qtyInput = contentBox.querySelector('#req-qty');
    const priceInput = contentBox.querySelector('#req-price');
    const logisticsSelect = contentBox.querySelector('#req-logistics');

    const sumMaterial = contentBox.querySelector('#sum-material');
    const sumPlatform = contentBox.querySelector('#sum-platform');
    const sumLogistics = contentBox.querySelector('#sum-logistics');
    const sumTotal = contentBox.querySelector('#sum-total');

    function updateSummary() {
      const q = parseFloat(qtyInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      const mat = q * p;
      const fee = Math.max(30, Math.round(mat * 0.05));
      const log = logisticsSelect.value === 'ecoloop_logistics' ? 80 : 0;
      const tot = mat + fee + log;

      sumMaterial.textContent = `₹${mat.toFixed(2)}`;
      sumPlatform.textContent = `₹${fee.toFixed(2)}`;
      sumLogistics.textContent = `₹${log.toFixed(2)}`;
      sumTotal.textContent = `₹${tot.toFixed(2)}`;
    }

    qtyInput.oninput = updateSummary;
    priceInput.oninput = updateSummary;
    logisticsSelect.onchange = updateSummary;
    updateSummary();

    openModalBtn.onclick = () => {
      if (!State.user) {
        Toast.show("Please login or select a demo account to make a purchase request", "warning");
        window.location.hash = "#login";
        return;
      }
      modal.classList.remove('hidden');
    };

    closeModalBtn.onclick = () => {
      modal.classList.add('hidden');
    };

    if (actionParam === 'request') {
      openModalBtn.click();
    }

    contentBox.querySelector('#btn-message-seller').onclick = () => {
      openModalBtn.click();
    };

    reqForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = contentBox.querySelector('#submit-request-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting Request...";

      try {
        const payload = {
          listing_id: item.id,
          requested_quantity: parseFloat(qtyInput.value),
          offer_price: parseFloat(priceInput.value),
          delivery_preference: logisticsSelect.value,
          message: contentBox.querySelector('#req-message').value.trim()
        };

        const res = await API.createPurchaseRequest(payload);
        if (res.success) {
          Toast.show("Purchase request lodged! Opening in-app negotiation room...", "success");
          modal.classList.add('hidden');
          window.location.hash = `#negotiation/${res.conversation_id}`;
        }
      } catch (err) {
        Toast.show(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request & Start In-App Negotiation";
      }
    };

  } catch (err) {
    contentBox.innerHTML = `
      <div class="bg-rose-50 rounded-2xl p-8 border border-rose-200 text-center max-w-lg mx-auto text-rose-800">
        <p class="font-bold">Failed to load material details</p>
        <p class="text-xs text-rose-600 mt-1">${err.message}</p>
        <a href="#marketplace" class="mt-4 inline-block px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs">Back to Marketplace</a>
      </div>
    `;
  }
}
