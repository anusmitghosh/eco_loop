// EcoLoop Business Profile & Verification View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderBusinessProfile(container, tab = 'profile') {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to view your Business Profile.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="profile-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading enterprise profile & compliance records...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#profile-content');

  try {
    const res = await API.getProfile();
    const p = res.profile || {};
    const verifs = p.verifications || [];

    const isVerified = p.is_verified || p.biz_verified;

    content.innerHTML = `
      <div class="text-left space-y-8">
        <!-- Top Banner / Header -->
        <div class="bg-gradient-to-r from-[#0F382A] via-[#164e3b] to-[#0F382A] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div class="absolute -right-10 -bottom-10 opacity-10 text-9xl font-black pointer-events-none">♺</div>
          
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div class="flex items-center gap-5">
              <div class="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-3xl font-black text-emerald-300 shadow-inner">
                ${p.logo_url ? `<img src="${p.logo_url}" class="w-full h-full object-cover rounded-2xl">` : (p.business_name || p.full_name || 'E')[0]}
              </div>
              <div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h1 class="text-2xl sm:text-3xl font-black tracking-tight">${p.business_name || 'Enterprise Profile'}</h1>
                  ${isVerified ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      Verified Enterprise
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                      Verification Pending
                    </span>
                  `}
                </div>
                <p class="text-xs text-emerald-200 mt-1 max-w-xl">${p.description || 'Active participant in the Indian B2B circular economy ecosystem.'}</p>
                <div class="flex items-center gap-4 text-xs text-emerald-300/80 mt-2 font-mono">
                  <span>📍 ${p.city || 'Guwahati'}, ${p.state || 'Assam'}</span>
                  <span>•</span>
                  <span>Role: ${p.role.toUpperCase()}</span>
                  <span>•</span>
                  <span>Joined: ${new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div class="flex sm:flex-col items-center gap-2 self-stretch sm:self-auto shrink-0">
              <button id="btn-edit-profile-modal" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-emerald-50 transition shadow">
                ✏️ Edit Profile
              </button>
              <button id="btn-scroll-verification" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition">
                🛡️ Compliance & KYC
              </button>
            </div>
          </div>
        </div>

        <!-- Privacy Reminder Callout -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div class="flex items-center gap-3">
            <span class="text-xl">🔒</span>
            <div>
              <strong class="text-emerald-950 font-bold">Privacy-by-Default Architecture Active:</strong>
              <span class="text-emerald-800 ml-1">Other businesses only see your registered city and approximate area. Your exact warehouse dock address is strictly locked until transactions are confirmed.</span>
            </div>
          </div>
          <a href="#location-settings" class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition">Location Settings</a>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Trust Rating</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-2xl font-black text-slate-900">★ ${p.rating ? p.rating.toFixed(1) : '5.0'}</span>
              <span class="text-[10px] text-slate-400">(${p.total_reviews || 0} reviews)</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Completed Trades</span>
            <div class="text-2xl font-black text-slate-900 mt-1">${p.transactions_completed || 0}</div>
            <span class="text-[10px] text-emerald-600 font-medium">100% Escrow Fulfilled</span>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Material Diverted</span>
            <div class="text-2xl font-black text-slate-900 mt-1">${((p.materials_sold_kg || 0) / 1000).toFixed(2)} t</div>
            <span class="text-[10px] text-slate-500 font-mono">${p.materials_sold_kg || 0} kg recycled</span>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Material Procured</span>
            <div class="text-2xl font-black text-slate-900 mt-1">${((p.materials_purchased_kg || 0) / 1000).toFixed(2)} t</div>
            <span class="text-[10px] text-slate-500 font-mono">${p.materials_purchased_kg || 0} kg circular input</span>
          </div>
        </div>

        <!-- Two Columns: Business Details & Verification -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <!-- Business Details Card -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 class="font-bold text-slate-900 text-base">Enterprise Information</h2>
              <span class="text-[10px] font-mono text-slate-400">ID: BIZ-${p.business_id || p.id}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Business Name</span>
                <strong class="text-slate-900 font-bold">${p.business_name || '-'}</strong>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Industry Sector</span>
                <strong class="text-slate-900 font-bold">${p.business_type || 'Industrial & Manufacturing'}</strong>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Registration / CIN</span>
                <strong class="text-slate-900 font-bold font-mono">${p.registration_no || 'U24100AS2021PTC018921'}</strong>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">GSTIN Number</span>
                <strong class="text-slate-900 font-bold font-mono">${p.gstin || '18AAACG1234F1Z5'}</strong>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Official Email</span>
                <span class="text-slate-900 font-medium">${p.email || '-'}</span>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Business Contact</span>
                <span class="text-slate-900 font-medium">${p.phone || '-'}</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Circular Mission Statement</span>
              <p class="text-slate-700 leading-relaxed">${p.description || 'Promoting zero-landfill industrial ecology by sourcing and redistributing packaging buffers, plastic regrinds, and commercial surplus.'}</p>
            </div>
          </div>

          <!-- Compliance & KYC Section -->
          <div id="compliance-section" class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 class="font-bold text-slate-900 text-base">KYC & Business Verification</h2>
                <p class="text-[11px] text-slate-500">Submit official government business identification to earn the Verified Enterprise Badge.</p>
              </div>
              <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">🛡️</span>
            </div>

            <!-- Submit Document Form -->
            <form id="form-submit-kyc" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                <select id="kyc-doc-type" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="gstin">GST Registration Certificate (GSTIN)</option>
                  <option value="trade_license">Municipal Trade License / Shop Establishment</option>
                  <option value="incorporation_cert">Certificate of Incorporation (MCA / RoC)</option>
                  <option value="pollution_board">Pollution Control Board Consent (SPCB/CPCB)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Document / Certificate Number</label>
                <input type="text" id="kyc-doc-number" required placeholder="e.g. 18AAACG1234F1Z5" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Upload Document File (PDF, PNG, JPG)</label>
                <input type="file" id="kyc-file-input" accept=".pdf,.png,.jpg,.jpeg" class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                <span class="text-[10px] text-slate-400 mt-1 block">Maximum size 10MB. Document will be cryptographically hashed.</span>
              </div>

              <button type="submit" id="btn-submit-kyc" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2">
                <span>Submit Verification for Admin Review</span>
              </button>
            </form>

            <!-- Past Submissions List -->
            <div class="pt-4 border-t border-slate-100">
              <h3 class="text-xs font-bold text-slate-900 mb-2">Submitted Verification Records</h3>
              ${verifs.length > 0 ? `
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  ${verifs.map(v => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong class="text-slate-900 block font-mono text-[11px]">${v.document_type.toUpperCase()} • ${v.document_number}</strong>
                        <span class="text-[10px] text-slate-400">${new Date(v.created_at).toLocaleString()}</span>
                        ${v.reviewer_notes ? `<p class="text-[10px] text-slate-500 mt-0.5">Note: ${v.reviewer_notes}</p>` : ''}
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        v.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }">
                        ${v.status.toUpperCase()}
                      </span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p class="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">No previous verification documents submitted.</p>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal Container -->
      <div id="modal-edit-profile" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-900 text-base">Edit Enterprise Profile</h3>
            <button id="btn-close-modal" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>

          <form id="form-edit-profile" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Business Name</label>
              <input type="text" id="edit-biz-name" value="${p.business_name || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Business Category / Type</label>
              <input type="text" id="edit-biz-type" value="${p.business_type || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">City</label>
                <input type="text" id="edit-biz-city" value="${p.city || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">State</label>
                <input type="text" id="edit-biz-state" value="${p.state || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Registration / CIN</label>
                <input type="text" id="edit-biz-reg" value="${p.registration_no || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">GSTIN</label>
                <input type="text" id="edit-biz-gstin" value="${p.gstin || ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Description / Circular Mission</label>
              <textarea id="edit-biz-desc" rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-300">${p.description || ''}</textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3">
              <button type="button" id="btn-cancel-modal" class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
              <button type="submit" id="btn-save-modal" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Bind Modal Events
    const modal = content.querySelector('#modal-edit-profile');
    const openBtn = content.querySelector('#btn-edit-profile-modal');
    const closeBtn = content.querySelector('#btn-close-modal');
    const cancelBtn = content.querySelector('#btn-cancel-modal');

    openBtn.onclick = () => modal.classList.remove('hidden');
    closeBtn.onclick = () => modal.classList.add('hidden');
    cancelBtn.onclick = () => modal.classList.add('hidden');

    const scrollVerifBtn = content.querySelector('#btn-scroll-verification');
    if (scrollVerifBtn) {
      scrollVerifBtn.onclick = () => {
        content.querySelector('#compliance-section')?.scrollIntoView({ behavior: 'smooth' });
      };
    }

    // Save profile form
    const editForm = content.querySelector('#form-edit-profile');
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = editForm.querySelector('#btn-save-modal');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const payload = {
          business_name: editForm.querySelector('#edit-biz-name').value,
          business_type: editForm.querySelector('#edit-biz-type').value,
          city: editForm.querySelector('#edit-biz-city').value,
          state: editForm.querySelector('#edit-biz-state').value,
          registration_no: editForm.querySelector('#edit-biz-reg').value,
          gstin: editForm.querySelector('#edit-biz-gstin').value,
          description: editForm.querySelector('#edit-biz-desc').value
        };

        const updRes = await API.updateProfile(payload);
        if (updRes.success) {
          Toast.show("Enterprise profile updated!", "success");
          modal.classList.add('hidden');
          renderBusinessProfile(container);
        }
      } catch (err) {
        Toast.show(err.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    };

    // KYC Submit Form
    const kycForm = content.querySelector('#form-submit-kyc');
    kycForm.onsubmit = async (e) => {
      e.preventDefault();
      const kycBtn = kycForm.querySelector('#btn-submit-kyc');
      kycBtn.disabled = true;
      kycBtn.textContent = 'Submitting...';

      try {
        const docType = kycForm.querySelector('#kyc-doc-type').value;
        const docNumber = kycForm.querySelector('#kyc-doc-number').value;
        const fileInput = kycForm.querySelector('#kyc-file-input');

        let fileUrl = null;
        if (fileInput.files.length > 0) {
          const upRes = await API.uploadFile(fileInput.files[0]);
          if (upRes.success) fileUrl = upRes.file_url;
        }

        const resKyc = await API.submitVerification({
          document_type: docType,
          document_number: docNumber,
          document_url: fileUrl
        });

        if (resKyc.success) {
          Toast.show("Compliance records submitted successfully!", "success");
          renderBusinessProfile(container);
        }
      } catch (err) {
        Toast.show(err.message, "error");
      } finally {
        kycBtn.disabled = false;
        kycBtn.textContent = 'Submit Verification for Admin Review';
      }
    };

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
