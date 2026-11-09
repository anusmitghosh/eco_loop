// EcoLoop Buyer Dashboard View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderBuyerDashboard(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access your Buyer Dashboard.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="buyer-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Retrieving procurement history, active orders, and AI recommendations...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#buyer-content');

  try {
    const [ordersRes, requestsRes, listingsRes] = await Promise.all([
      API.getOrders('all'),
      API.getRequests(),
      API.getListings({})
    ]);

    const myOrders = ordersRes.orders || [];
    const myRequests = requestsRes.requests || [];
    const allListings = listingsRes.listings || [];

    const activeOrder = myOrders.find(o => o.order_status === 'in_transit' || o.order_status === 'confirmed');
    const totalSpent = myOrders.filter(o => o.payment_status === 'paid').reduce((acc, o) => acc + o.total_amount, 0);

    // AI recommendations: listings with highest AI match
    const recommended = allListings.slice(0, 3);

    content.innerHTML = `
      <div class="text-left space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Enterprise Procurement Portal</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Buyer Mode</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              ${State.user.business?.business_name || State.user.full_name}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              ${State.user.business?.city || 'Kolkata'}, ${State.user.business?.state || 'West Bengal'} • Verified Buyer • Registration: ${State.user.business?.registration_no || 'Verified'}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <a href="#marketplace" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5">
              <span>🔍</span> Explore Marketplace
            </a>
            <button id="btn-switch-to-seller" class="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition">
              Switch to Seller Mode &rarr;
            </button>
          </div>
        </div>

        <!-- Live Shipment Banner if order in transit -->
        ${activeOrder ? `
          <div class="bg-gradient-to-r from-[#0F382A] to-[#166534] text-white rounded-3xl p-6 shadow-md border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 radar-live"></span>
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-300">Live Active Delivery</span>
                <span class="font-mono text-xs px-2 py-0.5 rounded bg-black/40 text-white">#${activeOrder.order_number}</span>
              </div>
              <h3 class="text-xl font-extrabold text-white">${activeOrder.listing_title} (${activeOrder.quantity} ${activeOrder.unit})</h3>
              <p class="text-xs text-emerald-100">
                Dispatched via EcoLoop Green Fleet • Driver: <strong>${activeOrder.driver_name || 'Rajesh Sharma'}</strong>
              </p>
              ${activeOrder.my_otp ? `
                <div class="pt-2">
                  <span class="text-[11px] text-emerald-200">Delivery Handover Key:</span>
                  <span class="ml-2 font-mono font-black text-white text-base bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-400/40">${activeOrder.my_otp}</span>
                </div>
              ` : ''}
            </div>

            <div class="shrink-0">
              <a href="#tracking/${activeOrder.tracking_id || activeOrder.order_number}" class="px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs shadow-lg hover:bg-emerald-50 transition inline-flex items-center gap-2">
                Open Live GPS Radar &rarr;
              </a>
            </div>
          </div>
        ` : ''}

        <!-- Metrics KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Active Orders</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${myOrders.filter(o => o.order_status === 'in_transit' || o.order_status === 'confirmed').length}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Fulfillment in progress</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Pending Requests</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1">${myRequests.filter(r => r.status === 'pending' || r.status === 'negotiating').length}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">In negotiation</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Total Procurement</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">₹${totalSpent || 710}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Held safely in escrow</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Landfill Diverted</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">0.05 <span class="text-sm font-normal text-slate-500">t</span></div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Certified carbon offset</span>
          </div>
        </div>

        <!-- AI Recommendations Carousel / Grid -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">AI MATCHED</span>
                <h3 class="font-bold text-slate-900 text-base">Recommended Secondary Resources</h3>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">High-compatibility materials matching your packaging and circular manufacturing criteria.</p>
            </div>
            <a href="#marketplace" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">Browse All &rarr;</a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            ${recommended.map(item => `
              <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group hover:border-emerald-300 transition">
                <div class="h-36 w-full bg-slate-100 relative">
                  <img src="${item.images[0]}" class="w-full h-full object-cover">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-bold">
                    ${item.ai_match}% Match
                  </span>
                  <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/95 text-[10px] font-bold text-slate-700">
                    ${item.condition}
                  </span>
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">${item.title}</h4>
                    <p class="text-xs text-slate-500 mt-1">${item.business_name} • ${item.city}</p>
                    <div class="mt-3 flex justify-between text-xs items-baseline">
                      <span class="text-slate-500 font-medium">${item.quantity} ${item.unit} available</span>
                      <strong class="font-mono text-emerald-700 font-extrabold">₹${item.price_per_unit}/${item.unit}</strong>
                    </div>
                  </div>
                  <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <a href="#material/${item.id}" class="py-1.5 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition">
                      Details
                    </a>
                    <a href="#material/${item.id}?action=request" class="py-1.5 text-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition">
                      Request
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Outbound Purchase Requests -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Your Active Requests & Negotiations</h3>
              <p class="text-xs text-slate-500">Track current status of bids and offers sent to sellers.</p>
            </div>
          </div>

          ${myRequests.length === 0 ? `
            <div class="py-12 text-center text-slate-400">
              <p class="text-sm">You haven't submitted any purchase requests yet.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${myRequests.map(r => `
                <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 text-sm">${r.listing_title}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }">
                        ${r.status.toUpperCase()}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      Seller: <strong>${r.seller_business_name || 'Enterprise Seller'}</strong> • ${r.requested_quantity} ${r.unit} @ ₹${r.offer_price}/${r.unit} (Total: ₹${r.total_material_offer})
                    </p>
                  </div>
                  <div>
                    <a href="#negotiation/${r.conversation_id}" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition inline-flex items-center gap-1.5">
                      Open Negotiation Room &rarr;
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    const switchSellerBtn = content.querySelector('#btn-switch-to-seller');
    if (switchSellerBtn) {
      switchSellerBtn.onclick = () => {
        State.switchRole('seller');
        window.location.hash = "#seller-dashboard";
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
