// EcoLoop Dispute Resolution & Trust Center View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderDisputeCenter(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access the Dispute Center.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="dispute-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading dispute cases and arbitration logs...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#dispute-content');

  try {
    const [disputesRes, ordersRes] = await Promise.all([
      API.getMyDisputes(),
      API.getOrders('all')
    ]);

    const disputes = disputesRes.disputes || [];
    const orders = ordersRes.orders || [];

    content.innerHTML = `
      <div class="space-y-8 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Trust & Escrow Governance</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dispute Resolution Center</h1>
            <p class="text-xs text-slate-500 mt-1">Impartial arbitration for material quality, logistics discrepancy, or payment claims with evidence hashing.</p>
          </div>

          <button id="btn-open-dispute-modal" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition flex items-center gap-2 self-start sm:self-auto">
            <span>⚖️</span> File New Dispute
          </button>
        </div>

        <!-- How Disputes Work Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <span class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
              Escrow Protection
            </span>
            <p class="text-slate-500 leading-relaxed">When a dispute is opened, transaction funds are frozen in EcoLoop escrow and cannot be withdrawn until mutual resolution.</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <span class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
              Evidence Verification
            </span>
            <p class="text-slate-500 leading-relaxed">Both parties can submit lab reports, weighbridge receipts, timestamped photos, and OTP logs for verification.</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <span class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
              Impartial Arbitration
            </span>
            <p class="text-slate-500 leading-relaxed">Platform arbiters review delivery signatures and material specifications to execute a full refund, partial settlement, or material return.</p>
          </div>
        </div>

        <!-- Active Disputes Table / Cards -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="font-bold text-slate-900 text-base">Your Dispute Cases</h2>
            <span class="text-xs font-mono text-slate-400">${disputes.length} Cases On Record</span>
          </div>

          ${disputes.length > 0 ? `
            <div class="space-y-4">
              ${disputes.map(d => `
                <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        d.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }">
                        ${d.status.toUpperCase()}
                      </span>
                      <strong class="text-slate-900 font-bold text-sm">Order #${d.order_number}</strong>
                      <span class="text-xs text-slate-400 font-mono">• ${d.listing_title}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-mono">${new Date(d.created_at).toLocaleString()}</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Claim Reason</span>
                      <strong class="text-rose-700 font-bold">${d.reason}</strong>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Raised By</span>
                      <span class="text-slate-800 font-medium">${d.is_raised_by_me ? 'You (' + (d.raised_by_biz || d.raised_by_name) + ')' : (d.raised_by_biz || d.raised_by_name)}</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-bold block">Against Party</span>
                      <span class="text-slate-800 font-medium">${d.against_biz || d.against_name}</span>
                    </div>
                  </div>

                  <div class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Claimant Statement</span>
                    <p class="leading-relaxed">${d.description}</p>
                  </div>

                  ${d.resolution_notes ? `
                    <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div class="flex items-center gap-1.5 font-bold">
                        <span>🛡️</span>
                        <span>Official Arbiter Ruling (${new Date(d.resolved_at || d.created_at).toLocaleDateString()}):</span>
                      </div>
                      <p>${d.resolution_notes}</p>
                    </div>
                  ` : `
                    <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Status: Case under formal arbitration by EcoLoop Trust Operations.</span>
                      <a href="#orders" class="text-emerald-700 hover:underline font-bold text-[11px]">View Linked Order →</a>
                    </div>
                  `}
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-12 text-slate-400 space-y-2">
              <div class="text-3xl">⚖️</div>
              <p class="text-xs font-bold text-slate-700">Zero active disputes</p>
              <p class="text-[11px] text-slate-400">All your circular material transactions have proceeded smoothly without complaints.</p>
            </div>
          `}
        </div>
      </div>

      <!-- File Dispute Modal -->
      <div id="modal-file-dispute" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-left">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-900 text-base">File Transaction Dispute</h3>
              <p class="text-[11px] text-slate-500">Initiate formal escrow hold and arbitration.</p>
            </div>
            <button id="btn-close-dispute-modal" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>

          <form id="form-file-dispute" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Order</label>
              ${orders.length > 0 ? `
                <select id="dispute-order-id" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                  ${orders.map(o => `
                    <option value="${o.id}">#${o.order_number} - ${o.listing_title} (₹${o.total_amount})</option>
                  `).join('')}
                </select>
              ` : `
                <p class="text-xs text-slate-400 p-2 bg-slate-50 rounded-xl">No active or completed orders found to dispute.</p>
              `}
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Dispute Reason</label>
              <select id="dispute-reason" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                <option value="Material quality issue">Material quality issue (contamination / moisture / grade mismatch)</option>
                <option value="Wrong quantity">Wrong quantity (shortfall vs weighbridge slip)</option>
                <option value="Late delivery">Late delivery (exceeded logistics SLA)</option>
                <option value="Missing material">Missing material (partial shipment delivered)</option>
                <option value="Payment problem">Payment problem (escrow verification delay)</option>
                <option value="Damaged material">Damaged material (logistics freight mishandling)</option>
                <option value="Fraud/suspicious behavior">Fraud/suspicious behavior</option>
                <option value="Other">Other technical or commercial discrepancy</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Detailed Description of Discrepancy</label>
              <textarea id="dispute-description" rows="4" required placeholder="Please provide specific details including timestamps, batch numbers, weight discrepancy, and desired resolution..." class="w-full px-3 py-2 rounded-xl border border-slate-300"></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Attach Evidence / Photos (Optional)</label>
              <input type="file" id="dispute-evidence-file" accept=".pdf,.png,.jpg,.jpeg" class="w-full text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100">
            </div>

            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              ⚠️ Filing a frivolous or false dispute may affect your enterprise trust score and platform verification status.
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" id="btn-cancel-dispute" class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
              <button type="submit" id="btn-submit-dispute" class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow">Submit Dispute</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Modal Events
    const modal = content.querySelector('#modal-file-dispute');
    const openBtn = content.querySelector('#btn-open-dispute-modal');
    const closeBtn = content.querySelector('#btn-close-dispute-modal');
    const cancelBtn = content.querySelector('#btn-cancel-dispute');

    if (openBtn) openBtn.onclick = () => modal.classList.remove('hidden');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

    // Submit Dispute Form
    const dispForm = content.querySelector('#form-file-dispute');
    if (dispForm) {
      dispForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = dispForm.querySelector('#btn-submit-dispute');
        const orderSelect = dispForm.querySelector('#dispute-order-id');

        if (!orderSelect || !orderSelect.value) {
          Toast.show("No order selected for dispute.", "error");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          const orderId = orderSelect.value;
          const reason = dispForm.querySelector('#dispute-reason').value;
          const desc = dispForm.querySelector('#dispute-description').value;
          const fileInput = dispForm.querySelector('#dispute-evidence-file');

          let evidenceUrl = null;
          if (fileInput.files.length > 0) {
            const upRes = await API.uploadFile(fileInput.files[0]);
            if (upRes.success) evidenceUrl = upRes.file_url;
          }

          const res = await API.openDispute(orderId, reason, desc, evidenceUrl);
          if (res.success) {
            Toast.show("Dispute lodged with EcoLoop Governance. Escrow hold applied.", "success");
            modal.classList.add('hidden');
            renderDisputeCenter(container);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Dispute';
        }
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
