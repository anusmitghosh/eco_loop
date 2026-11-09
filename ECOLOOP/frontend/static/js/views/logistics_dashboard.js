// EcoLoop Logistics Partner Dashboard View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderLogisticsDashboard(container) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in as a Logistics Partner to view assigned shipments.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="logistics-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Connecting to fleet dispatch and active transport manifests...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#logistics-content');

  try {
    const res = await API.getLogisticsJobs();
    const jobs = res.jobs || [];

    content.innerHTML = `
      <div class="text-left space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Green Fleet Operations</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Logistics Driver Portal</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">EcoLoop Green Fleet Dispatch</h1>
            <p class="text-xs text-slate-500 mt-0.5">Assigned EV commercial cargo jobs, pickup OTP validations, and delivery proofs.</p>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 block font-medium">Active Deliveries</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">${jobs.filter(j => j.stage === 'in_transit' || j.stage === 'picked_up').length}</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Live GPS active</span>
          </div>
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 block font-medium">Pending Pickups</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1">${jobs.filter(j => j.stage === 'order_confirmed' || j.stage === 'logistics_assigned' || j.stage === 'pickup_scheduled').length}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Awaiting seller OTP</span>
          </div>
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 block font-medium">Delivered Today</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">${jobs.filter(j => j.stage === 'delivered' || j.stage === 'delivery_confirmed').length || 1}</div>
            <span class="text-[11px] text-slate-500 mt-1 block">Proof signed</span>
          </div>
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-400 block font-medium">Fleet EV Efficiency</span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">98.4%</div>
            <span class="text-[11px] text-emerald-600 font-medium mt-1 block">Zero tailpipe emissions</span>
          </div>
        </div>

        <!-- Job Cards List -->
        <div class="space-y-6">
          <h3 class="font-bold text-slate-900 text-lg">Assigned Transport Manifests</h3>

          ${jobs.map(job => `
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    🚚
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-extrabold text-slate-900 text-sm">#${job.tracking_id}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.stage === 'delivered' || job.stage === 'delivery_confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        job.stage === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }">
                        ${job.stage.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">
                      Assigned Driver: <strong>${job.driver_name || 'Rajesh Sharma'}</strong> (${job.vehicle_model || 'EcoLoop EV Van'})
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a href="#tracking/${job.tracking_id}" class="px-4 py-2 rounded-xl bg-[#0F382A] hover:bg-[#144736] text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5">
                    <span>📡</span> Open Live Radar
                  </a>
                </div>
              </div>

              <!-- Unlocked Dispatch Coordinates for Driver -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div class="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px]">
                    <span>Pickup Location (Seller)</span>
                    <span class="text-emerald-700">Unlocked Dock</span>
                  </div>
                  <strong class="text-slate-900 text-sm block">${job.seller_name}</strong>
                  <p class="text-slate-600 font-medium">${job.pickup_exact_address}</p>
                  <p class="text-slate-500 font-mono">Coords: ${job.pickup_lat}, ${job.pickup_lng}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div class="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px]">
                    <span>Delivery Location (Buyer)</span>
                    <span class="text-emerald-700">Unlocked Dock</span>
                  </div>
                  <strong class="text-slate-900 text-sm block">${job.buyer_name}</strong>
                  <p class="text-slate-600 font-medium">${job.delivery_exact_address}</p>
                  <p class="text-slate-500 font-mono">Coords: ${job.delivery_lat}, ${job.delivery_lng}</p>
                </div>
              </div>

              <!-- Handover Quick Actions -->
              <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div class="text-slate-500">
                  Cargo: <strong>${job.material_title}</strong> (${job.quantity} ${job.unit}) • Fee: <strong class="text-emerald-700 font-mono">₹${job.estimated_cost}</strong>
                </div>

                <div class="flex items-center gap-3">
                  ${job.stage === 'order_confirmed' || job.stage === 'logistics_assigned' || job.stage === 'pickup_scheduled' ? `
                    <button class="btn-job-pickup px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition" data-id="${job.tracking_id}">
                      Input Seller Pickup OTP &rarr;
                    </button>
                  ` : job.stage === 'in_transit' || job.stage === 'near_destination' || job.stage === 'out_for_delivery' ? `
                    <button class="btn-job-deliver px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition" data-id="${job.tracking_id}">
                      Input Buyer Delivery OTP & Digital Sign &rarr;
                    </button>
                  ` : `
                    <span class="text-emerald-700 font-bold">✓ Job Delivered & Verified</span>
                  `}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Pickup OTP prompt
    content.querySelectorAll('.btn-job-pickup').forEach(btn => {
      btn.onclick = async () => {
        const trkId = btn.getAttribute('data-id');
        const otp = prompt("Enter 6-digit Pickup OTP provided by the seller at dispatch:");
        if (!otp) return;
        try {
          const res = await API.verifyPickup(trkId, otp);
          if (res.success) {
            Toast.show("Pickup confirmed! Live tracking is now active.", "success");
            renderLogisticsDashboard(container);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

    // Delivery OTP prompt
    content.querySelectorAll('.btn-job-deliver').forEach(btn => {
      btn.onclick = async () => {
        const trkId = btn.getAttribute('data-id');
        const otp = prompt("Enter 6-digit Delivery OTP provided by buyer upon material handover:");
        if (!otp) return;
        try {
          const res = await API.verifyDelivery(trkId, otp, "DIGITAL_SIGNATURE_OK");
          if (res.success) {
            Toast.show("Delivery confirmed! Proof generated.", "success");
            renderLogisticsDashboard(container);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    });

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
