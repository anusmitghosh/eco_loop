// EcoLoop My Orders View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderOrders(container, currentFilter = 'all') {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to view your circular orders.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Title -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Orders & Transactions</h1>
          <p class="text-xs text-slate-500 mt-1">Manage physical material handovers, track active logistics, and view OTP verification codes.</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-3 text-xs" id="order-tabs">
        ${['all', 'active', 'in_transit', 'completed', 'disputed', 'cancelled'].map(tab => `
          <button data-tab="${tab}" class="tab-btn px-4 py-2 rounded-xl font-bold transition shrink-0 ${
            tab === currentFilter ? 'bg-[#0F382A] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }">
            ${tab.replace('_', ' ').toUpperCase()}
          </button>
        `).join('')}
      </div>

      <!-- Orders List Container -->
      <div id="orders-list" class="mt-6 space-y-4">
        <div class="py-12 text-center text-slate-400">
          <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
          <p class="text-sm">Retrieving your orders...</p>
        </div>
      </div>
    </div>
  `;

  const tabsContainer = container.querySelector('#order-tabs');
  const listContainer = container.querySelector('#orders-list');

  async function loadOrders(tab) {
    listContainer.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <div class="inline-block animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
        <p class="text-xs">Loading ${tab} orders...</p>
      </div>
    `;

    try {
      const res = await API.getOrders(tab);
      if (!res.success || res.orders.length === 0) {
        listContainer.innerHTML = `
          <div class="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto">
            <span class="text-4xl block mb-2">📋</span>
            <h4 class="font-bold text-slate-900 text-base">No ${tab.replace('_', ' ')} orders found</h4>
            <p class="text-xs text-slate-500 mt-1">Explore available materials in the marketplace or check your pending negotiation requests.</p>
            <a href="#marketplace" class="mt-4 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Browse Marketplace</a>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = res.orders.map(order => `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow transition flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono font-extrabold text-slate-900 text-sm">#${order.order_number}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                order.order_status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                order.order_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                order.order_status === 'disputed' ? 'bg-rose-100 text-rose-800' :
                'bg-slate-100 text-slate-800'
              }">
                ${order.order_status.replace('_', ' ').toUpperCase()}
              </span>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                ${order.delivery_method === 'ecoloop_logistics' ? 'EcoLoop Green Fleet' : 'Self Arranged'}
              </span>
            </div>

            <div>
              <h4 class="font-bold text-slate-900 text-base leading-snug">${order.listing_title}</h4>
              <p class="text-xs text-slate-500 mt-0.5">
                ${order.quantity} ${order.unit} • ₹${order.unit_price}/${order.unit} •
                Counterparty: <strong class="text-slate-700">${order.buyer_id === State.user.id ? order.seller_business_name : order.buyer_business_name}</strong>
              </p>
            </div>

            <!-- OTP Card Strip -->
            ${order.my_otp ? `
              <div class="inline-flex items-center gap-3 p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span class="text-emerald-700 font-bold">🔐 ${order.otp_label}:</span>
                <span class="font-mono text-base font-extrabold text-slate-900 tracking-wider">${order.my_otp}</span>
              </div>
            ` : ''}
          </div>

          <!-- Commercials & Action Column -->
          <div class="flex flex-col sm:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
            <div class="sm:text-right">
              <span class="text-xs text-slate-400 block">Total Settlement</span>
              <span class="text-xl font-extrabold text-emerald-700 font-mono">₹${order.total_amount.toFixed(2)}</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              ${order.tracking_id ? `
                <a href="#tracking/${order.tracking_id}" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  Track Shipment
                </a>
              ` : ''}

              <!-- Tax Invoice Button -->
              <button class="btn-view-invoice px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition inline-flex items-center gap-1" data-order-id="${order.id}">
                <span>📄</span> Tax Invoice
              </button>

              ${order.order_status === 'delivered' ? `
                <button class="btn-open-review px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition inline-flex items-center gap-1" data-order-id="${order.id}" data-title="${order.listing_title}">
                  <span>⭐</span> Rate & Review
                </button>
              ` : ''}

              ${order.order_status === 'created' || order.order_status === 'escrow_pending' ? `
                <button class="btn-cancel-order px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition" data-order-id="${order.id}">
                  Cancel Order
                </button>
              ` : ''}

              <button class="btn-open-dispute px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition" data-order-id="${order.id}">
                Dispute / Issue
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Invoice Modal Trigger
      listContainer.querySelectorAll('.btn-view-invoice').forEach(btn => {
        btn.onclick = async () => {
          const ordId = btn.getAttribute('data-order-id');
          try {
            const inv = await API.getOrderInvoice(ordId);
            showInvoiceModal(inv);
          } catch (err) {
            Toast.show(err.message, "error");
          }
        };
      });

      // Review Modal Trigger
      listContainer.querySelectorAll('.btn-open-review').forEach(btn => {
        btn.onclick = () => {
          const ordId = btn.getAttribute('data-order-id');
          const title = btn.getAttribute('data-title');
          showReviewModal(ordId, title, () => loadOrders(tab));
        };
      });

      // Cancel Order Trigger
      listContainer.querySelectorAll('.btn-cancel-order').forEach(btn => {
        btn.onclick = async () => {
          const ordId = btn.getAttribute('data-order-id');
          const reason = prompt("Enter cancellation reason:");
          if (!reason) return;
          try {
            await API.cancelOrder(ordId, reason);
            Toast.show("Order successfully cancelled and inventory released.", "info");
            loadOrders(tab);
          } catch (err) {
            Toast.show(err.message, "error");
          }
        };
      });

      // Dispute triggers
      listContainer.querySelectorAll('.btn-open-dispute').forEach(btn => {
        btn.onclick = () => {
          const ordId = btn.getAttribute('data-order-id');
          const reason = prompt("Select dispute reason (e.g. Material quality mismatch, Wrong quantity, Late delivery, Damaged goods):");
          if (!reason) return;
          const details = prompt("Please provide details of the dispute:");
          if (!details) return;

          API.openDispute(ordId, reason, details).then(res => {
            if (res.success) {
              Toast.show("Dispute lodged! An EcoLoop resolution agent has been assigned.", "warning");
              loadOrders(tab);
            }
          }).catch(err => Toast.show(err.message, "error"));
        };
      });

    } catch (err) {
      listContainer.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
    }
  }

  tabsContainer.onclick = (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn) {
      const tab = btn.getAttribute('data-tab');
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.className = "tab-btn px-4 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shrink-0");
      btn.className = "tab-btn px-4 py-2 rounded-xl font-bold bg-[#0F382A] text-white shadow-sm transition shrink-0";
      loadOrders(tab);
    }
  };

  loadOrders(currentFilter);
}

// Certified GST Tax Invoice Modal
function showInvoiceModal(inv) {
  const existing = document.getElementById('ecoloop-invoice-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ecoloop-invoice-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 text-slate-800">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">EL</div>
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">Tax Invoice & Escrow Bill of Supply</h3>
            <span class="text-[11px] text-slate-500 font-mono">${inv.invoice_number}</span>
          </div>
        </div>
        <button id="close-invoice-btn" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">&times;</button>
      </div>

      <!-- Parties Row -->
      <div class="grid grid-cols-2 gap-4 mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
        <div>
          <span class="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Seller Enterprise</span>
          <strong class="text-slate-900 block mt-0.5">${inv.seller_business}</strong>
          <span class="text-slate-500 font-mono">GSTIN: ${inv.seller_gstin}</span>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Buyer Enterprise</span>
          <strong class="text-slate-900 block mt-0.5">${inv.buyer_business}</strong>
          <span class="text-slate-500 font-mono">GSTIN: ${inv.buyer_gstin}</span>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="mt-4 border border-slate-200 rounded-2xl overflow-hidden text-xs">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th class="py-2.5 px-3">Description</th>
              <th class="py-2.5 px-3 text-center">Qty / Rate</th>
              <th class="py-2.5 px-3 text-right">Taxable Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="py-3 px-3">
                <strong class="text-slate-900 block">${inv.line_item.title}</strong>
                <span class="text-[11px] text-slate-400">HSN/SAC: Circular Secondary Raw Material</span>
              </td>
              <td class="py-3 px-3 text-center font-mono">${inv.line_item.quantity} ${inv.line_item.unit} @ ₹${inv.line_item.unit_price}</td>
              <td class="py-3 px-3 text-right font-mono font-bold">₹${inv.line_item.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="py-2 px-3 text-slate-600">EcoLoop EV Green Logistics Freight</td>
              <td class="py-2 px-3 text-center font-mono">Fixed Distance</td>
              <td class="py-2 px-3 text-right font-mono">₹${inv.logistics_fee.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="py-2 px-3 text-slate-600">Dual-Key Escrow Platform Assurance</td>
              <td class="py-2 px-3 text-center font-mono">5.0% Escrow</td>
              <td class="py-2 px-3 text-right font-mono">₹${inv.escrow_fee.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="py-2 px-3 text-slate-600">Integrated GST on Services (18%)</td>
              <td class="py-2 px-3 text-center font-mono">18.0%</td>
              <td class="py-2 px-3 text-right font-mono">₹${inv.gst_amount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot class="bg-emerald-50/70 border-t border-emerald-100 font-bold text-slate-900">
            <tr>
              <td colspan="2" class="py-3 px-3 text-right">Grand Total (INR):</td>
              <td class="py-3 px-3 text-right font-mono text-base text-emerald-800 font-extrabold">₹${inv.grand_total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Tamper Verification Hash -->
      <div class="mt-4 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] break-all">
        <span class="text-slate-400 block mb-0.5">SHA-256 Tamper Audit Verification Hash:</span>
        ${inv.tamper_evident_hash}
      </div>

      <div class="mt-6 flex items-center justify-between">
        <span class="text-[11px] text-slate-400">Status: ${inv.status.toUpperCase()} (Digitally Certified)</span>
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-sm">
          Print / Download PDF
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#close-invoice-btn').onclick = () => modal.remove();
}

// Enterprise Rating & Review Modal
function showReviewModal(orderId, title, onSuccess) {
  const existing = document.getElementById('ecoloop-review-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ecoloop-review-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in';

  let selectedRating = 5;

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-bold text-slate-900 text-base">Rate Counterparty Transaction</h3>
        <button id="close-review-btn" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">&times;</button>
      </div>

      <p class="text-xs text-slate-500 mt-2">
        Feedback on <strong>${title}</strong>: Your rating directly updates the Enterprise Trust Index on EcoLoop.
      </p>

      <!-- Star Rating Picker -->
      <div class="mt-4 flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl" id="stars-row">
        ${[1, 2, 3, 4, 5].map(star => `
          <button data-star="${star}" class="star-btn text-2xl transition hover:scale-125 focus:outline-none">
            ⭐
          </button>
        `).join('')}
      </div>

      <div class="mt-4">
        <label class="block text-xs font-bold text-slate-700 mb-1">Feedback Comments (Optional)</label>
        <textarea id="review-comment" rows="3" placeholder="Punctuality, material cleanliness, packaging quality, driver handover experience..."
          class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
      </div>

      <div class="mt-6 flex gap-2">
        <button id="submit-review-btn" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm">
          Submit Rating & Review
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const starBtns = modal.querySelectorAll('.star-btn');
  function updateStars(num) {
    selectedRating = num;
    starBtns.forEach((b, idx) => {
      b.style.opacity = idx < num ? '1' : '0.25';
    });
  }
  updateStars(5);

  starBtns.forEach(b => {
    b.onclick = () => updateStars(parseInt(b.getAttribute('data-star')));
  });

  modal.querySelector('#close-review-btn').onclick = () => modal.remove();

  modal.querySelector('#submit-review-btn').onclick = async () => {
    const comment = modal.querySelector('#review-comment').value.trim();
    try {
      await API.submitOrderReview(orderId, selectedRating, comment);
      Toast.show("Thank you! Enterprise Trust Rating recorded.", "success");
      modal.remove();
      if (onSuccess) onSuccess();
    } catch (err) {
      Toast.show(err.message, "error");
    }
  };
}
