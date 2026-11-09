// EcoLoop Seller Dashboard View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderSellerDashboard(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access your Seller Dashboard.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="seller-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading seller operations, inbound requests, and revenue analytics...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#seller-content');

  try {
    const [reqsRes, myListingsRes, ordersRes] = await Promise.all([
      API.getRequests(),
      API.getMyListings().catch(() => ({ listings: [] })),
      API.getOrders('all')
    ]);

    const requests = reqsRes.requests || [];
    const myListings = myListingsRes.listings || [];
    const myOrders = ordersRes.orders || [];

    const totalRevenue = myOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.material_amount, 0);

    content.innerHTML = `
      <div class="text-left space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Enterprise Seller Hub</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Seller Mode</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              ${State.user.business?.business_name || State.user.full_name}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              ${State.user.business?.city || 'Guwahati'}, ${State.user.business?.state || 'Assam'} • Rating: ${State.user.business?.rating || 4.9} ★ • GST: ${State.user.business?.gstin || 'Verified'}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <a href="#list-waste" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5">
              <span>+</span> List New Material
            </a>
            <button id="btn-switch-to-buyer" class="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition">
              Switch to Buyer Mode &rarr;
            </button>
          </div>
        </div>

        <!-- Metric KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Active Listings</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${myListings.length || 2}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Live in marketplace</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Pending Inbound Requests</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1">${requests.filter(r => r.status === 'pending' || r.status === 'negotiating').length}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Awaiting response</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Completed Sales</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${myOrders.filter(o => o.order_status === 'delivered' || o.order_status === 'completed').length || 1}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Escrow released</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Total Commercial Revenue</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">₹${totalRevenue || 600}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Zero default risk</span>
          </div>
        </div>

        <!-- Inbound Purchase Requests -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Inbound Purchase & Offer Requests</h3>
              <p class="text-xs text-slate-500">Review terms, accept, negotiate, or arrange pickup with verified buyers.</p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-500">${requests.length} Requests</span>
          </div>

          ${requests.length === 0 ? `
            <div class="py-12 text-center text-slate-400">
              <p class="text-sm">No new purchase requests at this time.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${requests.map(req => `
                <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="space-y-1.5 flex-1">
                    <div class="flex items-center gap-2">
                      <strong class="text-slate-900 text-sm">${req.buyer_business_name || 'Enterprise Buyer'}</strong>
                      ${req.buyer_verified ? '<span class="text-emerald-700 text-xs font-bold">✓ Verified</span>' : ''}
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }">
                        ${req.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 class="font-bold text-slate-800 text-sm">${req.listing_title}</h4>
                    <p class="text-xs text-slate-600">
                      Requested: <strong class="text-slate-800">${req.requested_quantity} ${req.unit}</strong> @
                      <strong class="text-emerald-700 font-mono">₹${req.offer_price}/${req.unit}</strong>
                      (Total Offer: <strong class="text-slate-900 font-mono">₹${req.total_material_offer}</strong>)
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Logistics: ${req.delivery_preference.replace('_', ' ').toUpperCase()} • Destination: ${req.buyer_city || 'Regional Hub'}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <a href="#negotiation/${req.conversation_id}" class="px-4 py-2 rounded-xl bg-[#0F382A] hover:bg-[#144736] text-white font-bold text-xs shadow-sm transition">
                      Negotiate / Open Chat
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Active Listings Section -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Your Active Inventory</h3>
              <p class="text-xs text-slate-500">Live materials listed under your corporate profile.</p>
            </div>
            <a href="#list-waste" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">+ Add Material</a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${myListings.map(item => `
              <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between" id="listing-card-${item.id}">
                <div class="h-36 w-full bg-slate-100 relative">
                  <img src="${(item.images && item.images[0]) || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800'}" class="w-full h-full object-cover">
                  <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/95 text-[11px] font-bold text-slate-700">
                    ${item.condition}
                  </span>
                  ${item.inquiries_count !== undefined && item.inquiries_count > 0 ? `
                    <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-300 text-[10px] font-bold">
                      ${item.inquiries_count} Active Inquiries
                    </span>
                  ` : ''}
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm line-clamp-1">${item.title}</h4>
                    <div class="mt-2 flex justify-between text-xs">
                      <span class="text-slate-500">${item.quantity} ${item.unit} available</span>
                      <strong class="font-mono text-emerald-700">₹${item.price_per_unit}/${item.unit}</strong>
                    </div>
                  </div>
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a href="#material/${item.id}" class="flex-1 text-center py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition">
                      View
                    </a>
                    <button class="btn-edit-listing px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition border border-emerald-200"
                      data-id="${item.id}" data-price="${item.price_per_unit}" data-qty="${item.quantity}" title="Update rate or stock">
                      Edit
                    </button>
                    <button class="btn-delete-listing px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200"
                      data-id="${item.id}" title="Remove Listing">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Wire up listing edit and delete buttons
    content.querySelectorAll('.btn-edit-listing').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const curPrice = btn.getAttribute('data-price');
        const curQty = btn.getAttribute('data-qty');

        const newPrice = prompt("Enter updated price per unit (₹):", curPrice);
        if (newPrice === null) return;
        const newQty = prompt("Enter updated available quantity:", curQty);
        if (newQty === null) return;

        try {
          await API.updateListing(id, {
            price_per_unit: parseFloat(newPrice),
            quantity: parseFloat(newQty)
          });
          Toast.show("Listing inventory & pricing updated!", "success");
          renderSellerDashboard(container);
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

    content.querySelectorAll('.btn-delete-listing').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm("Are you sure you want to delete this listing from the marketplace?")) return;

        try {
          await API.deleteListing(id);
          Toast.show("Listing removed from marketplace.", "info");
          renderSellerDashboard(container);
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

    const switchBuyerBtn = content.querySelector('#btn-switch-to-buyer');
    if (switchBuyerBtn) {
      switchBuyerBtn.onclick = () => {
        State.switchRole('buyer');
        window.location.hash = "#buyer-dashboard";
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
