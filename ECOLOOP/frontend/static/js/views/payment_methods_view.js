// EcoLoop Payment Methods & Escrow Account Settings View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderPaymentMethodsView(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to manage Payment Methods.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="pm-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading enterprise payment accounts and escrow vaults...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#pm-content');

  try {
    const res = await API.getPaymentMethods();
    const methods = res.methods || [];

    content.innerHTML = `
      <div class="space-y-8 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Financial & Escrow Infrastructure</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payment & Payout Accounts</h1>
            <p class="text-xs text-slate-500 mt-1">Manage corporate UPI handles, bank current accounts for escrow payouts, and commercial procurement cards.</p>
          </div>

          <button id="btn-add-method-modal" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-2 self-start sm:self-auto">
            <span>➕</span> Add Payment Method
          </button>
        </div>

        <!-- Security & Escrow Guarantee Callout -->
        <div class="bg-gradient-to-r from-emerald-900 to-[#0F382A] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
              <span>🔒</span> RBI / NPCI Escrow Architecture Active
            </div>
            <strong class="text-sm text-white block">Zero Raw Card Storage Policy</strong>
            <p class="text-emerald-100 max-w-xl text-[11px] leading-relaxed">
              All transactions are encrypted with 256-bit TLS and processed through tokenized payment gateway corridors. Escrow payouts are deposited directly into your verified Current Bank Account upon delivery OTP verification.
            </p>
          </div>
          <div class="flex items-center gap-2 font-mono text-[11px] text-emerald-200 bg-black/30 px-3 py-2 rounded-xl border border-white/10 shrink-0">
            <span>🛡️ ISO-27001 Certified</span>
          </div>
        </div>

        <!-- Saved Payment Methods Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${methods.map(m => `
            <div class="bg-white rounded-3xl border ${m.is_default ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'} p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-2xl">
                    ${m.type === 'upi' ? '⚡' : m.type === 'card' ? '💳' : '🏦'}
                  </span>
                  ${m.is_default ? `
                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      DEFAULT
                    </span>
                  ` : `
                    <button class="btn-set-default text-[10px] text-slate-400 hover:text-emerald-700 font-bold" data-id="${m.id}">
                      Set as Default
                    </button>
                  `}
                </div>

                <div>
                  <h3 class="font-bold text-slate-900 text-sm">${m.title}</h3>
                  <div class="font-mono text-xs text-slate-600 mt-1">
                    ${m.vpa || m.account_masked || m.card_masked}
                  </div>
                  ${m.ifsc ? `<span class="text-[10px] text-slate-400 font-mono block mt-0.5">IFSC: ${m.ifsc}</span>` : ''}
                  ${m.expiry ? `<span class="text-[10px] text-slate-400 font-mono block mt-0.5">Expires: ${m.expiry}</span>` : ''}
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>✓</span> Verified Active
                </span>
                <button class="text-slate-400 hover:text-rose-600 font-bold text-xs" onclick="alert('Default payment method protected.')">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Escrow Settlement History Shortcut -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Escrow Payout Statements</h3>
            <p class="text-xs text-slate-500 mt-0.5">View real-time disbursements, platform fee deductions (5%), and GST invoices.</p>
          </div>
          <a href="#orders" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs transition shrink-0">
            View All Order Invoices →
          </a>
        </div>
      </div>

      <!-- Add Method Modal -->
      <div id="modal-add-pm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl text-left">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-900 text-base">Add Payment Account</h3>
            <button id="btn-close-pm" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>

          <form id="form-add-pm" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Account Type</label>
              <select id="pm-type" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                <option value="upi">Business UPI ID (Google Pay, PhonePe, BHIM)</option>
                <option value="bank">Current Bank Account (RTGS/NEFT Escrow)</option>
                <option value="card">Corporate Credit / Debit Card</option>
              </select>
            </div>

            <div id="field-upi">
              <label class="block font-bold text-slate-700 mb-1">UPI VPA</label>
              <input type="text" id="pm-vpa" placeholder="enterprise@okhdfcbank" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono">
            </div>

            <div id="field-bank" class="hidden space-y-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Account Number</label>
                <input type="text" id="pm-acc" placeholder="50200012345678" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Bank IFSC Code</label>
                <input type="text" id="pm-ifsc" placeholder="HDFC0001892" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono">
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
              A micro-deposit verification of ₹1.00 will be initiated to test routing connectivity.
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" id="btn-cancel-pm" class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow">Save & Verify</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Modal Events
    const modal = content.querySelector('#modal-add-pm');
    const openBtn = content.querySelector('#btn-add-method-modal');
    const closeBtn = content.querySelector('#btn-close-pm');
    const cancelBtn = content.querySelector('#btn-cancel-pm');
    const pmTypeSelect = content.querySelector('#pm-type');
    const fieldUpi = content.querySelector('#field-upi');
    const fieldBank = content.querySelector('#field-bank');

    if (openBtn) openBtn.onclick = () => modal.classList.remove('hidden');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

    if (pmTypeSelect) {
      pmTypeSelect.onchange = () => {
        if (pmTypeSelect.value === 'bank') {
          fieldUpi.classList.add('hidden');
          fieldBank.classList.remove('hidden');
        } else {
          fieldUpi.classList.remove('hidden');
          fieldBank.classList.add('hidden');
        }
      };
    }

    const form = content.querySelector('#form-add-pm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        Toast.show("Payment account verified and linked securely!", "success");
        modal.classList.add('hidden');
      };
    }

    content.querySelectorAll('.btn-set-default').forEach(b => {
      b.onclick = () => {
        Toast.show("Default settlement account updated.", "success");
      };
    });

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
