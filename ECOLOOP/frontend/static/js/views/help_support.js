// EcoLoop Help & Enterprise Support Center View
import { State, Toast } from '../state.js';

export function renderHelpSupport(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#0F382A] via-[#164e3b] to-[#0F382A] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div class="absolute -right-6 -bottom-6 opacity-10 text-9xl font-black pointer-events-none">?</div>
        <div class="relative z-10 max-w-2xl">
          <span class="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">Operations & Guidance Desk</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Help & Enterprise Support</h1>
          <p class="text-xs text-emerald-100 mt-2 leading-relaxed">
            Need assistance with circular material logistics, escrow reconciliation, or AI matching? Our operations and trust arbiters are available 24/7 across Northeast & Pan-India hubs.
          </p>
        </div>
      </div>

      <!-- Quick Support Contact Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">📞</div>
          <h3 class="font-bold text-slate-900 text-sm">Enterprise Logistics Helpline</h3>
          <p class="text-xs text-slate-500">Direct dispatch coordination for active EV carrier drivers and dock arrivals.</p>
          <div class="pt-2 text-xs font-mono font-bold text-emerald-700">+91 1800-ECO-LOOP (Toll-Free)</div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg">⚖️</div>
          <h3 class="font-bold text-slate-900 text-sm">Escrow & Arbiter Support</h3>
          <p class="text-xs text-slate-500">Assistance with weighbridge slip disputes, moisture deductions, and fund holds.</p>
          <div class="pt-2 text-xs font-mono font-bold text-blue-700">escrow-trust@ecoloop.in</div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg">📋</div>
          <h3 class="font-bold text-slate-900 text-sm">CPCB / SPCB Compliance</h3>
          <p class="text-xs text-slate-500">Guidance on state pollution control manifests, hazardous scrap classification, and EPR.</p>
          <div class="pt-2 text-xs font-mono font-bold text-purple-700">compliance@ecoloop.in</div>
        </div>
      </div>

      <!-- Two Columns: FAQ & Interactive Ticket Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- FAQ Accordion (2 Columns width) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 class="font-bold text-slate-900 text-base">Frequently Asked Questions</h2>
            <span class="text-xs text-slate-400 font-mono">8 Common Topics</span>
          </div>

          <div class="space-y-3" id="faq-accordion">
            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>1. How does the Multi-Factor AI Matching Engine calculate compatibility?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                The engine evaluates listings and buyer profiles across five core subscores: <strong>Material Grade</strong> (polymer or pulp compatibility), <strong>Proximity Subscore</strong> (Haversine freight distance penalty), <strong>Condition Suitability</strong> (processing requirements vs buyer capability), <strong>Seller Trust Index</strong> (verified KYC status and rating), and <strong>Logistics Feasibility</strong> (EV payload matching). Transparent reasons are shown for every calculated percentage.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>2. How is my business location and warehouse address protected?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                EcoLoop adheres strictly to <strong>Privacy-by-Default</strong>. Public marketplace cards only disclose the city and approximate neighborhood region (~5 km radius). Exact physical warehouse gates and GPS coordinates are unlocked exclusively to authorized EV drivers after escrow payment confirmation, and live GPS streams automatically terminate once delivery OTP is authenticated.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>3. How does Escrow Payment guarantee safety for waste & surplus?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                When a buyer pays for an order via UPI or Corporate Net Banking, the money is held in a protected bank escrow vault. The seller is guaranteed funds upon dispatch, but payment is only released to the seller after the buyer verifies delivery via OTP or digital signature, protecting against phantom shipments or missing materials.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>4. What happens during EcoLoop EV Logistics dispatch?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                A verified EV commercial carrier (such as a Tata Ace EV Van) is assigned to the order with a unique tracking code (e.g., #EL-10284). The driver arrives at the seller dock, enters the Seller's secret Pickup OTP to confirm material loading, then drives to the buyer destination with live waypoint radar tracking. At arrival, the Buyer provides their Delivery OTP and digital signature.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>5. What circular economy categories can be listed?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                EcoLoop supports 18+ high-impact resource streams: Corrugated Cardboard, Plastics & Polymers (PET, HDPE, PP), Scrap Metals (Aluminum, Copper, Mild Steel), Wood Pallets & Offcuts, Spent Coffee Grounds & Organic Food Waste, Commercial Office Furniture, Refrigerators, Equipment, and Industrial Packaging Films.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>6. How do businesses qualify for the Verified Enterprise Badge?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                Enterprises can upload their active GSTIN certificate, MCA Incorporation Certificate, or Factory Trade License on the Business Profile KYC tab. Platform compliance arbiters cross-verify with official registry databases before granting the Verified Badge.
              </p>
            </details>

            <details class="bg-white rounded-2xl border border-slate-200 p-4 open:border-emerald-500 transition group cursor-pointer">
              <summary class="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>7. How is environmental impact calculated?</span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                Impact calculations utilize conversion factors aligned with the EPA WARM v15 and WRAP circular economy guidelines. Diverted mass translates into avoided carbon emissions (kg CO2e) and process water savings. Verifiable circular impact certificates are automatically generated for each transaction.
              </p>
            </details>
          </div>
        </div>

        <!-- Submit Support Ticket Form (1 Column width) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div class="pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-900 text-base">Submit Support Inquiry</h3>
            <p class="text-[11px] text-slate-500">Open a prioritized ticket with our operations center.</p>
          </div>

          <form id="form-support-ticket" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Department</label>
              <select id="tkt-dept" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                <option value="logistics">Logistics & EV Carrier Dispatch</option>
                <option value="escrow">Escrow & Payment Reconciliation</option>
                <option value="material">Material Quality & Grading Assistance</option>
                <option value="kyc">Enterprise Verification & KYC</option>
                <option value="technical">Platform Technical Support</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Priority</label>
              <select id="tkt-priority" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                <option value="normal">Normal (Response within 4 hrs)</option>
                <option value="urgent">Urgent / Active Shipment (Response < 30 mins)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Subject</label>
              <input type="text" id="tkt-subject" required placeholder="Brief summary of request..." class="w-full px-3 py-2 rounded-xl border border-slate-300">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Description</label>
              <textarea id="tkt-message" rows="4" required placeholder="Include order reference #EL-XXXXX or listing ID if applicable..." class="w-full px-3 py-2 rounded-xl border border-slate-300"></textarea>
            </div>

            <button type="submit" id="btn-submit-ticket" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition">
              Submit Ticket to Operations Desk
            </button>
          </form>

          <div id="ticket-feedback" class="hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium"></div>
        </div>
      </div>
    </div>
  `;

  // Ticket Form Handler
  const tktForm = container.querySelector('#form-support-ticket');
  const feedback = container.querySelector('#ticket-feedback');
  if (tktForm) {
    tktForm.onsubmit = (e) => {
      e.preventDefault();
      const tktId = 'TKT-EL-' + Math.floor(10000 + Math.random() * 90000);
      const subject = tktForm.querySelector('#tkt-subject').value;

      feedback.innerHTML = `
        <div class="flex items-center gap-1.5 font-bold mb-1">
          <span>✓</span>
          <span>Ticket Opened: ${tktId}</span>
        </div>
        <p class="text-[11px] leading-relaxed">Our operations team has received your ticket "<em>${subject}</em>". An arbiter will review your details and respond via in-app alert shortly.</p>
      `;
      feedback.classList.remove('hidden');
      tktForm.reset();
      Toast.show(`Ticket ${tktId} logged with operations desk!`, "success");
    };
  }
}
