// EcoLoop Location Privacy Center & Security Governance View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderPrivacyCenter(container, activeTab = 'location') {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access Privacy & Location Settings.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="privacy-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading security keys, 2FA credentials & location access history...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#privacy-content');

  try {
    const [settingsRes, auditRes, secRes] = await Promise.all([
      API.getPrivacySettings(),
      API.getLocationAuditHistory(),
      API.getSecuritySessions().catch(() => ({ active_sessions: [], recent_security_events: [] }))
    ]);

    const s = settingsRes.settings || {};
    const audits = auditRes.audit_events || [];
    const sessions = secRes.active_sessions || [];
    const secEvents = secRes.recent_security_events || [];
    const user = State.user;

    content.innerHTML = `
      <div class="text-left space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Privacy & Security Governance</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy & Security Center</h1>
            <p class="text-xs text-slate-500 mt-1">Configure consent-based coordinate disclosure, manage 2FA, review active sessions, and inspect audit trails.</p>
          </div>

          <!-- Tab Selector Buttons -->
          <div class="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs font-bold self-start sm:self-auto">
            <button id="tab-btn-location" class="px-3.5 py-2 rounded-xl transition ${activeTab === 'location' ? 'bg-[#0F382A] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              📍 Location Privacy
            </button>
            <button id="tab-btn-security" class="px-3.5 py-2 rounded-xl transition ${activeTab === 'security' ? 'bg-[#0F382A] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              🛡️ Security & 2FA
            </button>
            <button id="tab-btn-compliance" class="px-3.5 py-2 rounded-xl transition ${activeTab === 'compliance' ? 'bg-[#0F382A] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              📋 Audit & Compliance
            </button>
          </div>
        </div>

        <!-- TAB 1: LOCATION PRIVACY -->
        <div id="panel-location" class="${activeTab === 'location' ? 'space-y-6' : 'hidden'}">
          <!-- Privacy Notice -->
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-3">
            <span class="text-xl">🛡️</span>
            <div>
              <strong class="font-bold">Privacy-First Architecture Policy:</strong>
              <span class="ml-1 text-emerald-800">Your exact factory gate or warehouse dock coordinates are never published publicly. Public buyers see city & approximate radius only. Exact addresses are strictly unlocked when transactions are confirmed.</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <!-- Seller Location Protections -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Seller Location Protections</h3>
                  <p class="text-[11px] text-slate-500">Pickup address confidentiality settings</p>
                </div>
                <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span>
              </div>

              <div class="space-y-3 text-xs">
                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <input type="checkbox" id="set-show-city" ${s.show_city_publicly ? 'checked' : ''} class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500">
                  <div>
                    <strong class="text-slate-800 block font-bold">Show City Publicly</strong>
                    <span class="text-slate-500">Displays municipality (e.g. Guwahati) on public cards.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <input type="checkbox" id="set-show-approx" ${s.show_approx_area ? 'checked' : ''} class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500">
                  <div>
                    <strong class="text-slate-800 block font-bold">Show Approximate Area to Buyers</strong>
                    <span class="text-slate-500">Displays neighborhood radius (~5 km) for distance calculations.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <input type="checkbox" id="set-reveal-after" ${s.reveal_exact_after_confirmation ? 'checked' : ''} class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500">
                  <div>
                    <strong class="text-slate-800 block font-bold">Reveal Exact Pickup Location After Confirmation</strong>
                    <span class="text-slate-500">Discloses factory gate only once buyer completes payment.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <input type="checkbox" id="set-share-logistics" ${s.share_exact_with_logistics ? 'checked' : ''} class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500">
                  <div>
                    <strong class="text-slate-800 block font-bold">Share Exact Location with EcoLoop Logistics</strong>
                    <span class="text-slate-500">Allows assigned EV driver to navigate directly to dock.</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Buyer Destination Protections -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Buyer Destination Protections</h3>
                  <p class="text-[11px] text-slate-500">Receiving facility & masked identity</p>
                </div>
                <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span>
              </div>

              <div class="space-y-3 text-xs">
                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked disabled class="mt-0.5 rounded text-emerald-600">
                  <div>
                    <strong class="text-slate-800 block font-bold">Mask Personal Phone & Email</strong>
                    <span class="text-slate-500">Seller only communicates through EcoLoop protected channels.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked class="mt-0.5 rounded text-emerald-600">
                  <div>
                    <strong class="text-slate-800 block font-bold">Keep Delivery Facility Private From Seller</strong>
                    <span class="text-slate-500">Seller sees receiving hub area; only the authorized driver receives exact delivery bay address.</span>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked disabled class="mt-0.5 rounded text-emerald-600">
                  <div>
                    <strong class="text-slate-800 block font-bold">Auto-Expiring Live GPS Streams</strong>
                    <span class="text-slate-500">Live GPS tracking automatically stops upon OTP delivery confirmation.</span>
                  </div>
                </label>

                <div class="pt-2">
                  <button id="btn-save-privacy" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
                    Save Privacy Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: SECURITY & 2FA -->
        <div id="panel-security" class="${activeTab === 'security' ? 'space-y-6' : 'hidden'}">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <!-- 2FA & Account Protection -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Two-Factor Authentication (2FA)</h3>
                  <p class="text-[11px] text-slate-500">Secure logins with secondary OTP verification</p>
                </div>
                <span class="w-8 h-8 rounded-full ${user.two_factor_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'} flex items-center justify-center font-bold text-sm">
                  ${user.two_factor_enabled ? '🔒' : '🔓'}
                </span>
              </div>

              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <strong class="text-slate-900 block font-bold">2FA Status: ${user.two_factor_enabled ? '<span class="text-emerald-700">ENABLED</span>' : '<span class="text-slate-500">DISABLED</span>'}</strong>
                  <span class="text-slate-500">Requires a 6-digit OTP sent to registered phone or email on every new device session.</span>
                </div>
                <button id="btn-toggle-2fa" class="px-4 py-2 rounded-xl ${user.two_factor_enabled ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'} font-bold text-xs transition shrink-0">
                  ${user.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              <!-- Password Update Form -->
              <div class="pt-2 space-y-3">
                <h4 class="font-bold text-slate-900 text-xs">Update Enterprise Password</h4>
                <form id="form-change-password" class="space-y-3 text-xs">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Current Password</label>
                    <input type="password" id="pwd-old" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl border border-slate-300">
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">New Password (min 6 chars)</label>
                    <input type="password" id="pwd-new" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl border border-slate-300">
                  </div>
                  <button type="submit" id="btn-submit-pwd" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs transition">
                    Update Password
                  </button>
                </form>
              </div>
            </div>

            <!-- Active Sessions & Device Logins -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Active Authorized Sessions</h3>
                  <p class="text-[11px] text-slate-500">Cryptographically active browser & device tokens</p>
                </div>
                <span class="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">1 Active</span>
              </div>

              <div class="space-y-3">
                ${sessions.map(sess => `
                  <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-2">
                        <strong class="text-slate-900 font-bold">${sess.device}</strong>
                        ${sess.is_current ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">This Session</span>` : ''}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono">IP: ${sess.ip_address} • Last activity: ${sess.last_active}</div>
                    </div>
                    <button class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 font-bold text-[10px] transition" onclick="alert('Session protected.')">
                      Revoke
                    </button>
                  </div>
                `).join('')}
              </div>

              <!-- Recent Security Events -->
              <div class="pt-2">
                <h4 class="font-bold text-slate-900 text-xs mb-2">Recent Security Events</h4>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  ${secEvents.length > 0 ? secEvents.map(ev => `
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                      <div>
                        <strong class="text-slate-800 font-mono block">${ev.event_type}</strong>
                        <span class="text-slate-400 text-[10px]">${ev.details}</span>
                      </div>
                      <span class="text-[9px] font-mono text-slate-400">${new Date(ev.created_at).toLocaleTimeString()}</span>
                    </div>
                  `).join('') : `
                    <p class="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">No security warnings detected.</p>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: AUDIT & COMPLIANCE -->
        <div id="panel-compliance" class="${activeTab === 'compliance' ? 'space-y-6' : 'hidden'}">
          <!-- Compliance & Data Export Box -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 class="font-bold text-slate-900 text-sm">GDPR / DPDP Compliance & Data Portability</h4>
              <p class="text-xs text-slate-500 mt-0.5">Download a complete machine-readable archive of all your business records, orders, and telemetry history.</p>
            </div>
            <button id="btn-export-data" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition shrink-0 inline-flex items-center gap-2">
              <span>📥</span> Download My Data (JSON)
            </button>
          </div>

          <!-- Location Access Audit Log -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Location Access Audit History</h3>
                <p class="text-xs text-slate-500">Every query and access to your physical dispatch or delivery coordinates is logged cryptographically.</p>
              </div>
              <span class="text-[11px] font-mono text-slate-400">${audits.length} Events Recorded</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 border-b border-slate-100 font-medium">
                    <th class="pb-3">Timestamp</th>
                    <th class="pb-3">Action</th>
                    <th class="pb-3">Requester Entity</th>
                    <th class="pb-3">Resource Ref</th>
                    <th class="pb-3">Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono">
                  ${audits.map(a => `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="py-3 text-slate-500 whitespace-nowrap">${new Date(a.timestamp).toLocaleString()}</td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.action.includes('OTP') ? 'bg-emerald-100 text-emerald-800' :
                          a.action.includes('ACCESSED') ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }">
                          ${a.action}
                        </span>
                      </td>
                      <td class="py-3 text-slate-700 font-sans font-medium">${a.requester_name || 'System Driver'} (${a.requester_role || 'logistics'})</td>
                      <td class="py-3 text-slate-900 font-bold">${a.resource_id || '-'}</td>
                      <td class="py-3 text-slate-600 font-sans">${a.details || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tab Switcher Handlers
    const tabBtnLocation = content.querySelector('#tab-btn-location');
    const tabBtnSecurity = content.querySelector('#tab-btn-security');
    const tabBtnCompliance = content.querySelector('#tab-btn-compliance');

    const panelLocation = content.querySelector('#panel-location');
    const panelSecurity = content.querySelector('#panel-security');
    const panelCompliance = content.querySelector('#panel-compliance');

    function switchTab(t) {
      [panelLocation, panelSecurity, panelCompliance].forEach(p => p.classList.add('hidden'));
      [tabBtnLocation, tabBtnSecurity, tabBtnCompliance].forEach(b => {
        b.className = 'px-3.5 py-2 rounded-xl transition text-slate-600 hover:bg-slate-100';
      });

      if (t === 'location') {
        panelLocation.classList.remove('hidden');
        tabBtnLocation.className = 'px-3.5 py-2 rounded-xl transition bg-[#0F382A] text-white shadow';
      } else if (t === 'security') {
        panelSecurity.classList.remove('hidden');
        tabBtnSecurity.className = 'px-3.5 py-2 rounded-xl transition bg-[#0F382A] text-white shadow';
      } else {
        panelCompliance.classList.remove('hidden');
        tabBtnCompliance.className = 'px-3.5 py-2 rounded-xl transition bg-[#0F382A] text-white shadow';
      }
    }

    tabBtnLocation.onclick = () => switchTab('location');
    tabBtnSecurity.onclick = () => switchTab('security');
    tabBtnCompliance.onclick = () => switchTab('compliance');

    // Save privacy preferences
    const saveBtn = content.querySelector('#btn-save-privacy');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Updating...";

        try {
          const payload = {
            show_city_publicly: content.querySelector('#set-show-city').checked,
            show_approx_area: content.querySelector('#set-show-approx').checked,
            reveal_exact_after_confirmation: content.querySelector('#set-reveal-after').checked,
            share_exact_with_logistics: content.querySelector('#set-share-logistics').checked
          };

          const res = await API.updatePrivacySettings(payload);
          if (res.success) {
            Toast.show("Privacy and location permissions updated!", "success");
          }
        } catch (err) {
          Toast.show(err.message, "error");
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Privacy Preferences";
        }
      };
    }

    // Toggle 2FA
    const toggle2faBtn = content.querySelector('#btn-toggle-2fa');
    if (toggle2faBtn) {
      toggle2faBtn.onclick = async () => {
        toggle2faBtn.disabled = true;
        try {
          const res = await API.toggle2FA();
          if (res.success) {
            Toast.show(res.message, "success");
            user.two_factor_enabled = res.two_factor_enabled;
            renderPrivacyCenter(container, 'security');
          }
        } catch (err) {
          Toast.show(err.message, "error");
        } finally {
          toggle2faBtn.disabled = false;
        }
      };
    }

    // Change Password Form
    const pwdForm = content.querySelector('#form-change-password');
    if (pwdForm) {
      pwdForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = pwdForm.querySelector('#btn-submit-pwd');
        const oldP = pwdForm.querySelector('#pwd-old').value;
        const newP = pwdForm.querySelector('#pwd-new').value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        try {
          const res = await API.changePassword(oldP, newP);
          if (res.success) {
            Toast.show("Password changed successfully!", "success");
            pwdForm.reset();
          }
        } catch (err) {
          Toast.show(err.message, "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Password';
        }
      };
    }

    // Export data
    const exportBtn = content.querySelector('#btn-export-data');
    if (exportBtn) {
      exportBtn.onclick = async () => {
        try {
          const data = await API.exportUserData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ecoloop-user-data-${State.user.id}.json`;
          a.click();
          URL.revokeObjectURL(url);
          Toast.show("Your complete data archive was exported.", "success");
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
