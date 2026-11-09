// EcoLoop Live Location Tracker & Interactive Map
import { API } from '../api.js';
import { State, Toast } from '../state.js';

let mapInstance = null;
let driverMarker = null;
let routeLine = null;

export async function renderTracking(container, trackingId) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div id="tracking-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm font-medium">Connecting to EcoLoop live telemetry & GPS radar...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#tracking-content');

  try {
    const res = await API.trackShipment(trackingId);
    if (!res.success || !res.shipment) {
      content.innerHTML = `
        <div class="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-md mx-auto">
          <p class="font-bold text-slate-800">Tracking session not found for ${trackingId}.</p>
          <a href="#orders" class="mt-4 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Back to Orders</a>
        </div>
      `;
      return;
    }

    const s = res.shipment;
    const isLive = s.is_tracking_active;
    const isDelivered = s.stage === 'delivered' || s.stage === 'delivery_confirmed';

    content.innerHTML = `
      <div class="text-left space-y-6">
        <!-- Top Status Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0">
              🚚
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-base font-extrabold text-slate-900">#${s.tracking_id}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isDelivered ? 'bg-emerald-100 text-emerald-800' :
                  isLive ? 'bg-emerald-600 text-white shadow-sm' :
                  'bg-amber-100 text-amber-800'
                }">
                  ${s.stage.replace('_', ' ').toUpperCase()}
                </span>
                ${isLive ? `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 radar-live"></span>
                    Live Tracking Active
                  </span>
                ` : `
                  <span class="text-xs text-slate-400 font-medium">Tracking Offline / Completed</span>
                `}
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Material: <strong>${s.material_title}</strong> (${s.quantity} ${s.unit}) • Driver: <strong>${s.driver_name}</strong>
              </p>
            </div>
          </div>

          <!-- Quick Metrics: ETA, Distance, Speed -->
          <div class="flex items-center gap-6 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div>
              <span class="text-slate-400 block font-medium">Estimated Arrival</span>
              <span class="font-mono font-extrabold text-slate-900 text-sm mt-0.5 block">
                ${isDelivered ? 'Delivered' : `${s.estimated_duration_mins || 18} Mins`}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Route Distance</span>
              <span class="font-mono font-extrabold text-slate-900 text-sm mt-0.5 block">${s.estimated_distance_km || 6.8} km</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Vehicle Fleet</span>
              <span class="font-bold text-emerald-700 text-xs mt-0.5 block">${s.vehicle_model || 'EcoLoop Tata Ace EV'}</span>
            </div>
          </div>
        </div>

        <!-- 10-Stage Milestone Stepper -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <div class="min-w-[700px]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Shipment Progress Milestones</span>
            <div class="flex items-center justify-between relative">
              ${[
                { key: "order_confirmed", label: "Confirmed" },
                { key: "logistics_assigned", label: "Assigned" },
                { key: "pickup_scheduled", label: "Scheduled" },
                { key: "driver_arriving", label: "Arriving" },
                { key: "picked_up", label: "Picked Up" },
                { key: "in_transit", label: "In Transit" },
                { key: "near_destination", label: "Near Dest." },
                { key: "out_for_delivery", label: "Out For Delivery" },
                { key: "delivered", label: "Delivered" },
                { key: "delivery_confirmed", label: "Completed" }
              ].map((step, idx) => {
                const stages = ["order_confirmed", "logistics_assigned", "pickup_scheduled", "driver_arriving", "picked_up", "in_transit", "near_destination", "out_for_delivery", "delivered", "delivery_confirmed"];
                const curIdx = stages.indexOf(s.stage);
                const isPassed = curIdx >= idx;
                const isCurrent = curIdx === idx;

                return `
                  <div class="flex flex-col items-center text-center z-10">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCurrent ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow' :
                      isPassed ? 'bg-emerald-800 text-white' :
                      'bg-slate-100 text-slate-400'
                    }">
                      ${isPassed ? '✓' : idx + 1}
                    </div>
                    <span class="text-[10px] font-semibold mt-1.5 ${isCurrent ? 'text-emerald-700 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'}">
                      ${step.label}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Interactive Map & Telemetry Radar Section -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Leaflet Live Map -->
          <div class="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50">
              <span class="font-bold text-slate-700 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                Interactive GPS Radar View
              </span>
              <span class="text-slate-500 font-mono text-[11px]">Last coordinate sync: <span id="sync-timer">3s ago</span></span>
            </div>

            <!-- Leaflet Container -->
            <div id="live-map-canvas" class="h-[460px] w-full bg-slate-100 relative">
              <!-- Overlay simulation control bar for easy testing -->
              <div class="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-800">Demo Telemetry Simulator:</span>
                  <button id="btn-hop-forward" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm">
                    Move Driver Forward &rarr;
                  </button>
                </div>
                <div class="text-[11px] text-slate-500">
                  Speed: <strong class="text-slate-800 font-mono">34.2 km/h</strong> | Heading: <strong class="text-slate-800 font-mono">135° SE</strong>
                </div>
              </div>
            </div>

            <!-- Privacy Disclosure Strip -->
            <div class="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>🔒 <strong>Privacy By Default:</strong> Exact coordinates are transmitted only over encrypted TLS and cease permanently once delivery is confirmed.</span>
              <a href="#privacy-center" class="text-emerald-700 font-semibold hover:underline">Location Settings</a>
            </div>
          </div>

          <!-- Right: Handover Verification & OTP Controls -->
          <div class="lg:col-span-4 space-y-4">
            <!-- Dual OTP Verification Box -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 class="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Verification Handshake</span>
                <span class="text-[10px] font-mono text-emerald-700">Dual-Key Protocol</span>
              </h4>

              <!-- Pickup OTP Section -->
              <div class="p-3.5 rounded-xl ${s.stage === 'order_confirmed' || s.stage === 'logistics_assigned' || s.stage === 'pickup_scheduled' || s.stage === 'driver_arriving' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">1. Pickup OTP</span>
                  <span class="text-[10px] text-slate-500">${s.stage === 'order_confirmed' || s.stage === 'logistics_assigned' || s.stage === 'pickup_scheduled' || s.stage === 'driver_arriving' ? 'Awaiting Handover' : '✓ Verified'}</span>
                </div>
                <p class="text-[11px] text-slate-600 mb-2">Driver must enter seller's OTP to unlock physical pickup.</p>
                <div class="flex gap-2">
                  <input type="text" id="input-pickup-otp" placeholder="Enter 6-digit OTP" value="${s.pickup_otp || '482910'}"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold">
                  <button id="btn-verify-pickup" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap">
                    Verify Pickup
                  </button>
                </div>
              </div>

              <!-- Delivery OTP Section -->
              <div class="p-3.5 rounded-xl ${s.stage === 'in_transit' || s.stage === 'near_destination' || s.stage === 'out_for_delivery' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">2. Delivery OTP</span>
                  <span class="text-[10px] text-slate-500">${isDelivered ? '✓ Confirmed' : 'Pending Destination'}</span>
                </div>
                <p class="text-[11px] text-slate-600 mb-2">Driver enters buyer's OTP upon unloading to release escrow funds.</p>
                <div class="flex gap-2">
                  <input type="text" id="input-delivery-otp" placeholder="Enter 6-digit OTP" value="${s.delivery_otp || '739104'}"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold">
                  <button id="btn-verify-delivery" class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap">
                    Confirm Delivery
                  </button>
                </div>
              </div>
            </div>

            <!-- Route Coordinates Card -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-xs space-y-3">
              <h4 class="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Dispatched Locations</h4>

              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">P</span>
                <div>
                  <span class="text-slate-400 font-medium block">Pickup Point (Seller)</span>
                  <strong class="text-slate-800">${s.pickup_contact_name || s.seller_name}</strong>
                  <p class="text-slate-500 text-[11px] mt-0.5">${s.pickup_exact_address}</p>
                </div>
              </div>

              <div class="flex items-start gap-2.5 pt-2 border-t border-slate-100">
                <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">D</span>
                <div>
                  <span class="text-slate-400 font-medium block">Destination (Buyer)</span>
                  <strong class="text-slate-800">${s.buyer_name}</strong>
                  <p class="text-slate-500 text-[11px] mt-0.5">${s.delivery_exact_address}</p>
                </div>
              </div>
            </div>

            <!-- Delivery Proof Certificate Banner if delivered -->
            ${isDelivered ? `
              <div class="p-4 rounded-2xl bg-emerald-900 text-white text-xs space-y-2 shadow-md">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-emerald-300">✓ Delivery Proof Authenticated</span>
                  <span class="font-mono text-[10px] text-emerald-400">HASH_OK</span>
                </div>
                <p class="text-emerald-100 text-[11px]">Material inspected and confirmed via buyer OTP. Environmental impact credentials recorded.</p>
                <a href="#impact" class="inline-block mt-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition">
                  View Verifiable Impact Certificate &rarr;
                </a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Initialize Leaflet Map
    setTimeout(() => {
      initLeafletMap(s);
    }, 100);

    // Bind Handover Verification Buttons
    const pickupBtn = content.querySelector('#btn-verify-pickup');
    const pickupInput = content.querySelector('#input-pickup-otp');
    if (pickupBtn) {
      pickupBtn.onclick = async () => {
        const otp = pickupInput.value.trim();
        if (!otp) return Toast.show("Please enter the 6-digit pickup OTP", "warning");

        try {
          const vRes = await API.verifyPickup(s.tracking_id, otp);
          if (vRes.success) {
            Toast.show("Pickup verified! Live tracking is now underway.", "success");
            renderTracking(container, s.tracking_id);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

    const deliveryBtn = content.querySelector('#btn-verify-delivery');
    const deliveryInput = content.querySelector('#input-delivery-otp');
    if (deliveryBtn) {
      deliveryBtn.onclick = async () => {
        const otp = deliveryInput.value.trim();
        if (!otp) return Toast.show("Please enter the 6-digit delivery OTP", "warning");

        try {
          const vRes = await API.verifyDelivery(s.tracking_id, otp, "DIGITAL_OTP_SIG");
          if (vRes.success) {
            Toast.show("Delivery confirmed! Escrow funds released to seller and impact updated.", "success");
            renderTracking(container, s.tracking_id);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

    // Telemetry Simulator: Hop Forward along the route
    const hopBtn = content.querySelector('#btn-hop-forward');
    if (hopBtn) {
      // Define a route waypoint array from Christian Basti towards Beltola Hub
      const routeWaypoints = [
        { lat: 26.1462, lng: 91.7378, label: "At Pickup: Christian Basti Hub", stage: "picked_up" },
        { lat: 26.1400, lng: 91.7480, label: "Cruising GS Road past Dispur Supermarket", stage: "in_transit" },
        { lat: 26.1320, lng: 91.7650, label: "Approaching Six Mile Flyover", stage: "in_transit" },
        { lat: 26.1220, lng: 91.7820, label: "Entering Beltola Industrial Corridor", stage: "near_destination" },
        { lat: 26.1150, lng: 91.7920, label: "Arrived at Warehouse 12 Unloading Dock", stage: "out_for_delivery" }
      ];

      hopBtn.onclick = async () => {
        try {
          const stepRes = await API.simulateLogisticsStep(s.tracking_id);
          Toast.show(`Driver position updated: ${stepRes.status_label}`, "info");

          // Move driver marker on map smoothly
          if (driverMarker) {
            driverMarker.setLatLng([stepRes.driver_live_lat, stepRes.driver_live_lng]);
            driverMarker.bindPopup(`<b>${s.driver_name}</b><br>${stepRes.status_label}<br><span class="text-xs text-slate-500 font-mono">Speed: ${stepRes.speed_kmh} km/h</span>`).openPopup();
            mapInstance.panTo([stepRes.driver_live_lat, stepRes.driver_live_lng]);
          }

          // If stage advanced, refresh tracking view seamlessly after a short delay
          if (stepRes.stage !== s.stage) {
            setTimeout(() => {
              renderTracking(container, s.tracking_id);
            }, 1000);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}

function initLeafletMap(shipment) {
  const mapDiv = document.getElementById('live-map-canvas');
  if (!mapDiv || typeof L === 'undefined') {
    return;
  }

  // Clear existing instance if any
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const pickupLat = shipment.pickup_lat || 26.1462;
  const pickupLng = shipment.pickup_lng || 91.7378;
  const deliveryLat = shipment.delivery_lat || 26.1150;
  const deliveryLng = shipment.delivery_lng || 91.7920;
  const driverLat = shipment.driver_live_lat || 26.1320;
  const driverLng = shipment.driver_live_lng || 91.7650;

  mapInstance = L.map(mapDiv, {
    center: [driverLat, driverLng],
    zoom: 13,
    zoomControl: true
  });

  // OpenStreetMap clean tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | EcoLoop Green Logistics',
    maxZoom: 19
  }).addTo(mapInstance);

  // Custom marker icons
  const pickupIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background:#0F382A; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const deliveryIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background:#16A34A; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const driverIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background:#2563EB; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; border:3px solid white; box-shadow:0 0 0 6px rgba(37,99,235,0.25);">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Add Markers
  L.marker([pickupLat, pickupLng], { icon: pickupIcon })
    .addTo(mapInstance)
    .bindPopup(`<b>Pickup: ${shipment.pickup_contact_name || shipment.seller_name}</b><br>${shipment.pickup_exact_address}`);

  L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon })
    .addTo(mapInstance)
    .bindPopup(`<b>Destination: ${shipment.buyer_name}</b><br>${shipment.delivery_exact_address}`);

  driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
    .addTo(mapInstance)
    .bindPopup(`<b>${shipment.driver_name}</b><br>${shipment.vehicle_model} (${shipment.license_plate})<br>Live Telemetry Active`);

  // Polyline route
  const waypoints = [
    [pickupLat, pickupLng],
    [26.1400, 91.7480],
    [driverLat, driverLng],
    [26.1220, 91.7820],
    [deliveryLat, deliveryLng]
  ];

  routeLine = L.polyline(waypoints, {
    color: '#16A34A',
    weight: 5,
    opacity: 0.8,
    dashArray: '8, 8'
  }).addTo(mapInstance);

  mapInstance.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}
