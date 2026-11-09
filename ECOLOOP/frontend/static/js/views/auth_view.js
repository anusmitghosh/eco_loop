// EcoLoop Authentication View (Login / Signup / 1-Click Demo Personas)
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export function renderAuth(container, initialTab = 'login') {
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-12">
      <!-- 1-Click Quick Demo Presets Card -->
      <div class="mb-8 bg-gradient-to-r from-[#0F382A] to-[#144736] text-white rounded-3xl p-6 shadow-xl border border-emerald-500/30">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Fast Testing & Evaluation</span>
          <span class="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono">1-Click Login</span>
        </div>
        <h3 class="font-extrabold text-base text-white">Instant Demo Personas</h3>
        <p class="text-xs text-emerald-100/80 mt-1 mb-4">Switch instantly between pre-configured real-world enterprise accounts:</p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button class="demo-btn p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition" data-role="seller">
            <strong class="text-emerald-300 block text-xs">GreenLeaf Restaurant</strong>
            <span class="text-[11px] text-white/80">Seller Mode (Cardboard / Coffee)</span>
          </button>
          <button class="demo-btn p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition" data-role="buyer">
            <strong class="text-emerald-300 block text-xs">PackRight Packaging</strong>
            <span class="text-[11px] text-white/80">Buyer Mode (Procurement)</span>
          </button>
          <button class="demo-btn p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition" data-role="logistics">
            <strong class="text-emerald-300 block text-xs">EcoLoop Express Logistics</strong>
            <span class="text-[11px] text-white/80">Green Fleet Driver Mode</span>
          </button>
          <button class="demo-btn p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition" data-role="admin">
            <strong class="text-emerald-300 block text-xs">EcoLoop Chief Admin</strong>
            <span class="text-[11px] text-white/80">Platform Governance & Escrow</span>
          </button>
        </div>
      </div>

      <!-- Auth Form Card -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <!-- Tabs -->
        <div class="flex items-center border-b border-slate-200 pb-4 mb-6">
          <button id="tab-login" class="flex-1 text-center pb-2 font-bold text-sm text-emerald-700 border-b-2 border-emerald-600 transition">
            Sign In
          </button>
          <button id="tab-signup" class="flex-1 text-center pb-2 font-bold text-sm text-slate-400 hover:text-slate-600 transition">
            Register Business
          </button>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Business Email Address</label>
            <input type="email" id="login-email" value="seller@greenleaf.in" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input type="password" id="login-password" value="ecoloop123" required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium">
          </div>

          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-slate-600">
              <input type="checkbox" checked class="rounded text-emerald-600">
              <span>Remember this session</span>
            </label>
            <span class="text-emerald-700 font-semibold cursor-pointer">Default pass: ecoloop123</span>
          </div>

          <button type="submit" id="btn-login-submit" class="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition">
            Sign In to Enterprise Workspace
          </button>
        </form>

        <!-- Signup Form (Hidden initially) -->
        <form id="signup-form" class="space-y-4 hidden">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Corporate / Legal Business Name *</label>
            <input type="text" id="reg-biz-name" placeholder="e.g. Acme Circular Reclaim Ltd" required
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Contact Officer Name *</label>
              <input type="text" id="reg-fullname" placeholder="e.g. Rahul Verma" required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Business Type *</label>
              <select id="reg-biz-type" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="Manufacturing">Manufacturing & Production</option>
                <option value="Food & Hospitality">Food, Beverage & Hospitality</option>
                <option value="Packaging">Packaging & Logistics</option>
                <option value="Recycling">Recycling & Material Recovery</option>
                <option value="Corporate Office">Corporate Office / IT</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
              <input type="email" id="reg-email" placeholder="procurement@acme.com" required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input type="tel" id="reg-phone" placeholder="+91 9876543210" required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-mono">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">GSTIN / Registration No.</label>
              <input type="text" id="reg-gstin" placeholder="18AABCG1234H1Z5"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-mono">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Primary Role *</label>
              <select id="reg-role" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="buyer_seller">Buyer + Seller (Seamless Dual Mode)</option>
                <option value="seller">Seller (Generate Revenue from Waste)</option>
                <option value="buyer">Buyer (Procure Secondary Resources)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">City *</label>
              <input type="text" id="reg-city" value="Guwahati" required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">State *</label>
              <input type="text" id="reg-state" value="Assam" required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
            <input type="password" id="reg-password" minlength="6" placeholder="At least 6 characters" required
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
          </div>

          <button type="submit" id="btn-signup-submit" class="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition">
            Create Verified Business Account
          </button>
        </form>
      </div>
    </div>
  `;

  const tabLogin = container.querySelector('#tab-login');
  const tabSignup = container.querySelector('#tab-signup');
  const loginForm = container.querySelector('#login-form');
  const signupForm = container.querySelector('#signup-form');

  tabLogin.onclick = () => {
    tabLogin.className = "flex-1 text-center pb-2 font-bold text-sm text-emerald-700 border-b-2 border-emerald-600 transition";
    tabSignup.className = "flex-1 text-center pb-2 font-bold text-sm text-slate-400 hover:text-slate-600 transition";
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  };

  tabSignup.onclick = () => {
    tabSignup.className = "flex-1 text-center pb-2 font-bold text-sm text-emerald-700 border-b-2 border-emerald-600 transition";
    tabLogin.className = "flex-1 text-center pb-2 font-bold text-sm text-slate-400 hover:text-slate-600 transition";
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  };

  if (initialTab === 'signup') {
    tabSignup.click();
  }

  // Demo Persona 1-Click switches
  container.querySelectorAll('.demo-btn').forEach(btn => {
    btn.onclick = async () => {
      const roleKey = btn.getAttribute('data-role');
      await State.demoSwitch(roleKey);
      if (roleKey === 'seller') window.location.hash = "#seller-dashboard";
      else if (roleKey === 'buyer') window.location.hash = "#buyer-dashboard";
      else if (roleKey === 'logistics') window.location.hash = "#logistics-jobs";
      else if (roleKey === 'admin') window.location.hash = "#admin";
    };
  });

  // Login handler
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#btn-login-submit');
    btn.disabled = true;
    btn.textContent = "Verifying...";

    try {
      const email = container.querySelector('#login-email').value.trim();
      const password = container.querySelector('#login-password').value;
      const res = await API.login(email, password);

      if (res.success) {
        API.setToken(res.token);
        State.setUser(res.user);
        Toast.show(`Welcome back, ${res.user.business?.business_name || res.user.full_name}!`, "success");

        if (res.user.role === 'admin') window.location.hash = "#admin";
        else if (res.user.active_role === 'seller') window.location.hash = "#seller-dashboard";
        else window.location.hash = "#marketplace";
      }
    } catch (err) {
      Toast.show(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Sign In to Enterprise Workspace";
    }
  };

  // Signup handler
  signupForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#btn-signup-submit');
    btn.disabled = true;
    btn.textContent = "Registering...";

    try {
      const payload = {
        email: container.querySelector('#reg-email').value.trim(),
        phone: container.querySelector('#reg-phone').value.trim(),
        password: container.querySelector('#reg-password').value,
        full_name: container.querySelector('#reg-fullname').value.trim(),
        business_name: container.querySelector('#reg-biz-name').value.trim(),
        business_type: container.querySelector('#reg-biz-type').value,
        registration_no: container.querySelector('#reg-gstin').value.trim() || 'REG-PENDING',
        gstin: container.querySelector('#reg-gstin').value.trim(),
        city: container.querySelector('#reg-city').value.trim(),
        state: container.querySelector('#reg-state').value.trim(),
        role: container.querySelector('#reg-role').value
      };

      const res = await API.signup(payload);
      if (res.success) {
        API.setToken(res.token);
        State.setUser(res.user);
        Toast.show("Enterprise account registered successfully!", "success");
        window.location.hash = "#marketplace";
      }
    } catch (err) {
      Toast.show(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Create Verified Business Account";
    }
  };
}
