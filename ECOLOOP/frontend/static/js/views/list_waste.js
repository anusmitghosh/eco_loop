// EcoLoop List Waste View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export function renderListWaste(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <span class="text-4xl block mb-3">🔒</span>
          <h3 class="text-xl font-extrabold text-slate-900">Sign in to List Surplus Waste</h3>
          <p class="text-xs text-slate-600 mt-2 mb-6">Create a verified business listing to connect with buyers, re-processors, and circular logistics partners.</p>
          <button id="auth-trigger-btn" class="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow hover:bg-emerald-700 transition">
            Sign In / Quick Demo Persona
          </button>
        </div>
      </div>
    `;
    container.querySelector('#auth-trigger-btn').onclick = () => {
      window.location.hash = "#login";
    };
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Title -->
      <div class="mb-8">
        <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Circular Listing Portal</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">List Your Surplus Material or Waste</h1>
        <p class="text-sm text-slate-600 mt-1">Convert unused by-products, packaging, scrap, or idle assets into commercial revenue and certified carbon offsets.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Form Column -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form id="create-listing-form" class="space-y-6">
            <!-- Material Category & Title -->
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                1. Material Classification
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Material Listing Title *</label>
                  <input type="text" id="lst-title" placeholder="e.g. Clean Corrugated Double-Wall Cardboard Cartons" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select id="lst-category" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium">
                      ${(State.categories || []).map(c => `
                        <option value="${c.id}">${c.name}</option>
                      `).join('') || `
                        <option value="1">Paper/Cardboard</option>
                        <option value="2">Plastic</option>
                        <option value="3">Metal</option>
                        <option value="4">Glass</option>
                        <option value="5">Wood</option>
                        <option value="6">Food Waste</option>
                        <option value="7">Textile</option>
                        <option value="8">Construction Material</option>
                        <option value="9">Industrial Scrap</option>
                        <option value="10">Office Furniture</option>
                        <option value="11">Equipment</option>
                        <option value="12">Packaging Materials</option>
                      `}
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Resource Specification *</label>
                    <input type="text" id="lst-resource-type" placeholder="e.g. 5-ply shipping boxes, dry & stacked" required
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                  </div>
                </div>
              </div>
            </div>

            <!-- Quantity & Commercials -->
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                2. Quantity & Enterprise Pricing
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Available Quantity *</label>
                  <input type="number" id="lst-qty" min="1" step="any" value="100" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Unit of Measure *</label>
                  <select id="lst-unit" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500">
                    <option value="kg">kg (Kilograms)</option>
                    <option value="tonnes">tonnes (Metric Tonnes)</option>
                    <option value="units">units (Items / Pieces)</option>
                    <option value="rolls">rolls</option>
                    <option value="liters">liters</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Price Per Unit (₹) *</label>
                  <input type="number" id="lst-price" min="0" step="any" value="15" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono text-emerald-700 focus:ring-2 focus:ring-emerald-500">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Minimum Order Quantity</label>
                  <input type="number" id="lst-min-order" min="1" step="any" value="20"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Condition Grade *</label>
                  <select id="lst-condition" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500">
                    <option value="Clean & Dry">Clean & Dry</option>
                    <option value="New">New / Surplus Sealed</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Used">Used / Functioning</option>
                    <option value="Recyclable">Recyclable Grade</option>
                    <option value="Processing required">Processing Required</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Location & Privacy Settings -->
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>3. Location & Privacy Protection</span>
                <span class="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Privacy By Default Active</span>
              </h3>

              <div class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input type="text" id="lst-city" value="Guwahati" required
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">State *</label>
                    <input type="text" id="lst-state" value="Assam" required
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Exact Dispatch Facility / Address <span class="text-rose-600 font-normal">(Never exposed publicly)</span>
                  </label>
                  <input type="text" id="lst-exact-addr" value="Plot 42, GS Road, Christian Basti, Guwahati, Assam 781005" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500">
                  <p class="text-[11px] text-slate-500 mt-1">This address remains encrypted. Only authorized logistics drivers receive exact dispatch directions after order payment.</p>
                </div>

                <!-- Logistics options checkboxes -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="lst-ecoloop-logistics" checked class="rounded text-emerald-600">
                    <span class="font-bold text-slate-800">Enable EcoLoop Green Logistics (EV Cargo, Live Tracking, Escrow)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="lst-pickup" checked class="rounded text-emerald-600">
                    <span class="text-slate-700">Allow Buyer Self-Arranged Pickup</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="lst-delivery" checked class="rounded text-emerald-600">
                    <span class="text-slate-700">I Can Provide Direct Seller Delivery</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Description & Image -->
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                4. Description & Photos
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea id="lst-desc" rows="3" required
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500">Uniform clean corrugated packaging boxes from daily inventory unpacking. Stored indoor on dry wooden pallets, strapping intact. Ideal for re-boxing or pulp moulding.</textarea>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Material Photo * (Upload or Provide URL)</label>
                  <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shrink-0">
                      <span>📷</span> Choose File
                      <input type="file" id="lst-file-input" accept="image/png,image/jpeg,image/webp" class="hidden">
                    </label>
                    <input type="url" id="lst-image" value="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop"
                      placeholder="Or paste secure image URL"
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-mono">
                  </div>
                  <span id="lst-file-status" class="text-[11px] text-slate-400 mt-1 block">Supported: JPG, PNG, WEBP (Max 5MB)</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="submit" id="btn-publish-listing" class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition">
                Publish Circular Listing
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Card (Prompt requirement: Allow seller to preview listing before publishing) -->
        <div class="lg:col-span-5 sticky top-24 space-y-4">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-bold text-slate-800">LIVE PREVIEW</span>
            <span>How buyers will see your listing</span>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
            <div class="relative h-48 w-full bg-slate-100">
              <img id="prev-img" src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop" class="w-full h-full object-cover">
              <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-900/90 text-emerald-300 font-bold text-xs">
                92% AI Match
              </div>
              <div id="prev-cond" class="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-white/95 text-slate-700 font-semibold text-[11px]">
                Clean & Dry
              </div>
              <div class="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/60 text-white text-[11px] font-mono">
                📍 Guwahati (Approx)
              </div>
            </div>

            <div class="p-4">
              <h4 id="prev-title" class="font-bold text-slate-900 text-base leading-snug">Clean Corrugated Double-Wall Cartons</h4>
              <p id="prev-seller" class="text-xs text-slate-500 mt-1">${State.user.business?.business_name || State.user.full_name} • Guwahati, Assam</p>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span class="text-xs text-slate-400 block font-normal">Available</span>
                  <span id="prev-qty" class="text-sm font-bold text-slate-800">100 kg</span>
                </div>
                <div class="text-right">
                  <span class="text-xs text-slate-400 block font-normal">Rate</span>
                  <span id="prev-price" class="text-base font-extrabold text-emerald-700 font-mono">₹15/kg</span>
                </div>
              </div>

              <div class="mt-4 p-3 rounded-xl bg-emerald-50 text-[11px] text-emerald-900 space-y-1">
                <div class="flex items-center gap-1 font-bold text-emerald-800">
                  <span>✓</span> Location Privacy Active
                </div>
                <p>Public buyers will only see Guwahati neighborhood. Exact address Plot 42, GS Road will remain protected.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind live preview listeners
  const form = container.querySelector('#create-listing-form');
  const titleInput = container.querySelector('#lst-title');
  const qtyInput = container.querySelector('#lst-qty');
  const unitSelect = container.querySelector('#lst-unit');
  const priceInput = container.querySelector('#lst-price');
  const condSelect = container.querySelector('#lst-condition');
  const imgInput = container.querySelector('#lst-image');

  const prevTitle = container.querySelector('#prev-title');
  const prevQty = container.querySelector('#prev-qty');
  const prevPrice = container.querySelector('#prev-price');
  const prevCond = container.querySelector('#prev-cond');
  const prevImg = container.querySelector('#prev-img');

  function updatePreview() {
    prevTitle.textContent = titleInput.value.trim() || 'Untitled Listing';
    prevQty.textContent = `${qtyInput.value || 0} ${unitSelect.value}`;
    prevPrice.textContent = `₹${priceInput.value || 0}/${unitSelect.value}`;
    prevCond.textContent = condSelect.value;
    if (imgInput.value) {
      prevImg.src = imgInput.value;
    }
  }

  titleInput.oninput = updatePreview;
  qtyInput.oninput = updatePreview;
  unitSelect.onchange = updatePreview;
  priceInput.oninput = updatePreview;
  condSelect.onchange = updatePreview;
  imgInput.oninput = updatePreview;

  const fileInput = container.querySelector('#lst-file-input');
  const fileStatus = container.querySelector('#lst-file-status');
  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileStatus.textContent = `Uploading ${file.name}...`;
      try {
        const res = await API.uploadFile(file);
        if (res.success) {
          imgInput.value = res.url;
          prevImg.src = res.url;
          fileStatus.innerHTML = `<span class="text-emerald-600 font-bold">✓ Uploaded: ${file.name}</span>`;
          Toast.show("Photo uploaded successfully!", "success");
        }
      } catch (err) {
        fileStatus.textContent = `Upload failed: ${err.message}`;
        Toast.show(err.message, "error");
      }
    };
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#btn-publish-listing');
    btn.disabled = true;
    btn.textContent = "Publishing Listing...";

    try {
      const payload = {
        title: titleInput.value.trim(),
        category_id: parseInt(container.querySelector('#lst-category').value),
        resource_type: container.querySelector('#lst-resource-type').value.trim(),
        quantity: parseFloat(qtyInput.value),
        unit: unitSelect.value,
        condition: condSelect.value,
        price_per_unit: parseFloat(priceInput.value),
        minimum_order: parseFloat(container.querySelector('#lst-min-order').value) || 1.0,
        city: container.querySelector('#lst-city').value.trim(),
        state: container.querySelector('#lst-state').value.trim(),
        approx_latitude: 26.1445,
        approx_longitude: 91.7362,
        exact_address: container.querySelector('#lst-exact-addr').value.trim(),
        exact_latitude: 26.1462,
        exact_longitude: 91.7378,
        pickup_available: container.querySelector('#lst-pickup').checked,
        delivery_available: container.querySelector('#lst-delivery').checked,
        ecoloop_logistics_available: container.querySelector('#lst-ecoloop-logistics').checked,
        description: container.querySelector('#lst-desc').value.trim(),
        images: [imgInput.value.trim()]
      };

      const res = await API.createListing(payload);
      if (res.success) {
        Toast.show("Surplus material published to EcoLoop marketplace!", "success");
        window.location.hash = `#material/${res.listing_id}`;
      }
    } catch (err) {
      Toast.show(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Publish Circular Listing";
    }
  };
}
