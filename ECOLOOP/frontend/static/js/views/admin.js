// EcoLoop Admin Operations & Security Command View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderAdmin(container) {
  if (!State.user || State.user.role !== 'admin') {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <span class="text-4xl block mb-2">🛑</span>
          <h3 class="text-lg font-bold text-slate-900">Admin Authorization Required</h3>
          <p class="text-xs text-slate-500 mt-1 mb-4">Please sign in as platform administrator or click below to switch to the admin demo persona.</p>
          <button id="admin-demo-btn" class="w-full py-2.5 rounded-xl bg-[#0F382A] text-white font-bold text-xs shadow hover:bg-[#144736] transition">
            Switch to Admin Demo Persona
          </button>
        </div>
      </div>
    `;
    const btn = container.querySelector('#admin-demo-btn');
    if (btn) {
      btn.onclick = async () => {
        await State.demoSwitch('admin');
        renderAdmin(container);
      };
    }
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="admin-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Initializing EcoLoop Security Operations Center & Audit Engine...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#admin-content');

  try {
    const [metricsRes, bizRes, disputesRes, auditRes, secRes] = await Promise.all([
      API.getAdminMetrics(),
      API.getAdminBusinesses(),
      API.getAdminDisputes(),
      API.getAdminAuditLogs(),
      API.getAdminSecurityEvents()
    ]);

    const m = metricsRes.metrics || {};
    const businesses = bizRes.businesses || [];
    const disputes = disputesRes.disputes || [];
    const auditLogs = auditRes.audit_logs || [];
    const secEvents = secRes.security_events || [];

    content.innerHTML = `
      <div class="text-left space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Platform Governance</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Admin Mode</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Platform Operations & Security Center</h1>
            <p class="text-xs text-slate-500 mt-0.5">Real-time marketplace monitoring, business KYC verification, dispute resolution, and immutable audit logs.</p>
          </div>
        </div>

        <!-- Executive Metrics KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Total Users</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${m.total_users || 8}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">${m.verified_businesses || 6} verified enterprises</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Active Listings</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${m.active_listings || 8}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Live in circular index</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Active Logistics Fleet</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">${m.active_logistics || 1}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Live GPS active</span>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block">Open Disputes</span>
            <div class="text-2xl sm:text-3xl font-extrabold ${m.open_disputes > 0 ? 'text-rose-600' : 'text-slate-900'} font-mono mt-1">${m.open_disputes || 0}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Escrow hold</span>
          </div>
        </div>

        <!-- Section 1: Business Verification Queue -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Business Verification & KYC Review</h3>
              <p class="text-xs text-slate-500">Approve or revoke enterprise credentials, GST numbers, and circular trust badges.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-100 font-medium">
                  <th class="pb-3">Business Name</th>
                  <th class="pb-3">Type</th>
                  <th class="pb-3">Registration / GST</th>
                  <th class="pb-3">Location</th>
                  <th class="pb-3">Status</th>
                  <th class="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${businesses.map(b => `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 font-bold text-slate-900">${b.business_name}</td>
                    <td class="py-3 text-slate-600">${b.business_type}</td>
                    <td class="py-3 font-mono text-slate-700">${b.gstin || b.registration_no || 'Pending Upload'}</td>
                    <td class="py-3 text-slate-600">${b.city}, ${b.state}</td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }">
                        ${b.is_verified ? '✓ VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td class="py-3 text-right space-x-2">
                      ${!b.is_verified ? `
                        <button class="btn-verify-biz px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" data-id="${b.id}" data-action="approve">
                          Approve
                        </button>
                      ` : `
                        <button class="btn-verify-biz px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs" data-id="${b.id}" data-action="reject">
                          Revoke
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Dispute Management Center -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Dispute Management & Escrow Arbitration</h3>
              <p class="text-xs text-slate-500">Review claims regarding damaged goods, wrong quantity, or transit delays.</p>
            </div>
            <span class="text-xs font-mono text-slate-400">${disputes.length} Disputes Total</span>
          </div>

          ${disputes.length === 0 ? `
            <div class="py-8 text-center text-slate-400">
              <span class="text-2xl block mb-1">✓</span>
              <p class="text-xs">No unresolved platform disputes at this time.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${disputes.map(d => `
                <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-mono font-bold text-slate-900 text-sm">Order #${d.order_number}</span>
                      <span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }">
                        ${d.status.toUpperCase()}
                      </span>
                    </div>
                    <span class="text-xs font-mono text-emerald-700 font-bold">Escrow: ₹${d.total_amount}</span>
                  </div>

                  <div class="text-xs text-slate-600">
                    <p><strong>Reason:</strong> ${d.reason}</p>
                    <p class="mt-1"><strong>Claim:</strong> ${d.description}</p>
                    <p class="mt-1 text-slate-400">Raised by: ${d.raised_by_name} vs ${d.against_name}</p>
                  </div>

                  ${d.status !== 'resolved' ? `
                    <div class="pt-3 border-t border-slate-200 flex items-center gap-3">
                      <button class="btn-resolve-disp px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs" data-id="${d.id}" data-action="resolve_refund_buyer">
                        Refund Buyer & Cancel
                      </button>
                      <button class="btn-resolve-disp px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs" data-id="${d.id}" data-action="resolve_release_seller">
                        Release to Seller
                      </button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Section 3: Immutable Security Audit Logs Explorer -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Security Audit Logs & Telemetry Events</h3>
              <p class="text-xs text-slate-500">Chronological ledger of user logins, role switches, location coordinate access, and payments.</p>
            </div>
            <div class="flex items-center gap-2">
              <select id="audit-filter-action" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium">
                <option value="">All Event Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOCATION_COORDINATES_ACCESSED">LOCATION_COORDINATES_ACCESSED</option>
                <option value="ORDER_CREATED">ORDER_CREATED</option>
                <option value="PAYMENT_PROCESSED">PAYMENT_PROCESSED</option>
                <option value="PICKUP_OTP_VERIFIED">PICKUP_OTP_VERIFIED</option>
                <option value="DELIVERY_CONFIRMED">DELIVERY_CONFIRMED</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead class="sticky top-0 bg-white">
                <tr class="text-slate-400 border-b border-slate-100 font-medium">
                  <th class="pb-3">Timestamp</th>
                  <th class="pb-3">Action</th>
                  <th class="pb-3">Entity / User</th>
                  <th class="pb-3">Resource</th>
                  <th class="pb-3">IP Address</th>
                  <th class="pb-3">Audit Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono text-[11px]" id="audit-table-body">
                ${auditLogs.map(a => `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-2.5 text-slate-500 whitespace-nowrap">${new Date(a.timestamp).toLocaleString()}</td>
                    <td class="py-2.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.action.includes('OTP') ? 'bg-emerald-100 text-emerald-800' :
                        a.action.includes('LOCATION') ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }">
                        ${a.action}
                      </span>
                    </td>
                    <td class="py-2.5 text-slate-700 font-sans">${a.user_email || 'System Daemon'}</td>
                    <td class="py-2.5 text-slate-900 font-bold">${a.resource_type}:${a.resource_id || '-'}</td>
                    <td class="py-2.5 text-slate-500">${a.ip_address || '127.0.0.1'}</td>
                    <td class="py-2.5 text-slate-600 font-sans">${a.details || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Business verification buttons
    content.querySelectorAll('.btn-verify-biz').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        try {
          const vRes = await API.reviewBusinessVerification(id, action, "Verified by Admin Security Console");
          if (vRes.success) {
            Toast.show(`Business status updated: ${action}`, "success");
            renderAdmin(container);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

    // Dispute resolution buttons
    content.querySelectorAll('.btn-resolve-disp').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const notes = prompt("Enter resolution notes for the transaction records:");
        if (!notes) return;

        try {
          const dRes = await API.resolveDispute(id, action, notes);
          if (dRes.success) {
            Toast.show("Dispute resolved and escrow actions executed.", "success");
            renderAdmin(container);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

    // Audit logs filter
    const filterSelect = content.querySelector('#audit-filter-action');
    filterSelect.onchange = async () => {
      const val = filterSelect.value;
      const filtered = await API.getAdminAuditLogs(val);
      const tbody = content.querySelector('#audit-table-body');
      tbody.innerHTML = (filtered.audit_logs || []).map(a => `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-2.5 text-slate-500 whitespace-nowrap">${new Date(a.timestamp).toLocaleString()}</td>
          <td class="py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              a.action.includes('OTP') ? 'bg-emerald-100 text-emerald-800' :
              a.action.includes('LOCATION') ? 'bg-amber-100 text-amber-800' :
              'bg-slate-100 text-slate-700'
            }">
              ${a.action}
            </span>
          </td>
          <td class="py-2.5 text-slate-700 font-sans">${a.user_email || 'System'}</td>
          <td class="py-2.5 text-slate-900 font-bold">${a.resource_type}:${a.resource_id || '-'}</td>
          <td class="py-2.5 text-slate-500">${a.ip_address || '127.0.0.1'}</td>
          <td class="py-2.5 text-slate-600 font-sans">${a.details || '-'}</td>
        </tr>
      `).join('');
    };

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
