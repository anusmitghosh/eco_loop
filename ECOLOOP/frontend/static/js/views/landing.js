// EcoLoop Landing Page View
import { State } from '../state.js';

export function renderLanding(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-b from-[#0F382A] via-[#144736] to-[#0A281E] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <!-- Background subtle grid pattern -->
      <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#22C55E_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div class="relative max-w-7xl mx-auto">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Circular Economy B2B Marketplace
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-7">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
              Turn Business Waste Into <span class="text-emerald-400 underline decoration-emerald-500/50 underline-offset-8">Business Value</span>
            </h1>
            <p class="text-lg sm:text-xl text-emerald-100/90 font-normal leading-relaxed max-w-2xl mb-8">
              Connect with businesses that reuse, recycle, or recover your unused materials, packaging, excess inventory, and secondary resources. Powered by AI-matching and verified green logistics.
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <a href="#marketplace" class="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2">
                Explore Marketplace
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
              <a href="#list-waste" class="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/20 backdrop-blur transition-all inline-flex items-center gap-2">
                List Your Waste
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </a>
            </div>

            <!-- Trust badges -->
            <div class="mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-sm text-emerald-200/80">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold text-base">✓</span> Privacy By Default
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold text-base">✓</span> Verified Enterprise Only
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold text-base">✓</span> Escrow Protected
              </div>
            </div>
          </div>

          <!-- Hero Interactive Simulation Card -->
          <div class="lg:col-span-5">
            <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl text-slate-900 bg-white">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    EL
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm">AI Circular Match Engine</h4>
                    <p class="text-xs text-slate-500">Live Compatibility Calculation</p>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  94% Match
                </span>
              </div>

              <div class="mt-4 space-y-3">
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                  <div>
                    <span class="text-slate-500 block">Resource Available</span>
                    <strong class="text-slate-800 text-sm">Clean Corrugated Cardboard</strong>
                  </div>
                  <span class="font-mono text-emerald-700 font-bold text-sm">80 kg @ ₹12/kg</span>
                </div>

                <div class="space-y-1.5 text-xs text-slate-600">
                  <div class="flex items-center gap-2 text-emerald-700 font-medium">
                    <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    Specification matches secondary pulp processing
                  </div>
                  <div class="flex items-center gap-2 text-emerald-700 font-medium">
                    <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    Within 6.8 km local green logistics corridor
                  </div>
                  <div class="flex items-center gap-2 text-emerald-700 font-medium">
                    <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    Estimated transport fee: ₹80 (EcoLoop EV Cargo)
                  </div>
                  <div class="flex items-center gap-2 text-emerald-700 font-medium">
                    <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    Prevents 112 kg CO2e & diverts 0.08 tonnes
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-slate-500">Seller: <strong class="text-slate-700">GreenLeaf (Verified)</strong></span>
                  <a href="#marketplace" class="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1">
                    View in Marketplace &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Metrics Counter Bar -->
    <section class="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#0F382A]">142.8+</div>
          <p class="text-sm font-medium text-slate-500 mt-1">Tonnes Reused & Diverted</p>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#0F382A]">185+</div>
          <p class="text-sm font-medium text-slate-500 mt-1">Verified Businesses</p>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#0F382A]">24</div>
          <p class="text-sm font-medium text-slate-500 mt-1">Industrial Clusters & Cities</p>
        </div>
        <div>
          <div class="text-3xl sm:text-4xl font-extrabold text-emerald-600">₹42.5L+</div>
          <p class="text-sm font-medium text-slate-500 mt-1">Material Value Unlocked</p>
        </div>
      </div>
    </section>

    <!-- How EcoLoop Works -->
    <section id="how-it-works" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Seamless Circular Flow</h2>
        <h3 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How EcoLoop Connects Businesses</h3>
        <p class="mt-4 text-base text-slate-600">What is unwanted or excess for one business becomes valuable raw material for another.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-6">
            1
          </div>
          <h4 class="text-xl font-bold text-slate-900 mb-2">List Waste or By-Products</h4>
          <p class="text-sm text-slate-600 leading-relaxed">
            Sellers list unused cardboard, plastics, scrap metal, organic waste, or equipment with condition notes and quantity. Approximate coordinates keep exact addresses safe.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-6">
            2
          </div>
          <h4 class="text-xl font-bold text-slate-900 mb-2">AI Match & In-App Negotiate</h4>
          <p class="text-sm text-slate-600 leading-relaxed">
            Our multi-factor matching engine evaluates proximity, processing compatibility, and logistics burden. Buyers make offers and negotiate terms inside protected channels.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-6">
            3
          </div>
          <h4 class="text-xl font-bold text-slate-900 mb-2">Escrow, Logistics & Impact</h4>
          <p class="text-sm text-slate-600 leading-relaxed">
            Payment is safeguarded in escrow. EcoLoop Green Logistics manages pickup and delivery with dual OTP verification. Upon delivery, impact metrics update automatically.
          </p>
        </div>
      </div>
    </section>

    <!-- What You Can Sell / Resource Categories -->
    <section class="py-16 bg-[#F0FDF4] border-y border-emerald-100 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 class="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Supported Resources</h2>
            <h3 class="text-3xl font-extrabold text-[#0F382A]">Recover Value Across 12+ Material Categories</h3>
          </div>
          <a href="#marketplace" class="mt-4 md:mt-0 text-emerald-700 font-bold hover:text-emerald-800 inline-flex items-center gap-1.5 text-sm">
            Browse all categories &rarr;
          </a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          ${[
            { name: "Paper & Cardboard", count: "48 listings", icon: "📦", slug: "cardboard" },
            { name: "Plastics & Polymers", count: "36 listings", icon: "♳", slug: "plastic" },
            { name: "Scrap Metals", count: "29 listings", icon: "⚙️", slug: "metal" },
            { name: "Wood & Pallets", count: "22 listings", icon: "🪵", slug: "wood" },
            { name: "Food & Organic Waste", count: "18 listings", icon: "☕", slug: "food-waste" },
            { name: "Industrial Scrap", count: "31 listings", icon: "🏭", slug: "industrial-scrap" },
            { name: "Office Furniture", count: "14 listings", icon: "🪑", slug: "furniture" },
            { name: "Machinery & Equipment", count: "12 listings", icon: "🔌", slug: "equipment" },
            { name: "Packaging Supplies", count: "25 listings", icon: "✉️", slug: "packaging" },
            { name: "Textile Waste", count: "16 listings", icon: "👕", slug: "textile" },
            { name: "Glass Offcuts", count: "9 listings", icon: "🍾", slug: "glass" },
            { name: "Construction Materials", count: "19 listings", icon: "🧱", slug: "construction" },
          ].map(c => `
            <a href="#marketplace?category=${c.slug}" class="bg-white rounded-xl p-4 border border-emerald-200/60 shadow-sm hover:border-emerald-500 hover:shadow-md transition text-left group">
              <span class="text-2xl mb-2 block">${c.icon}</span>
              <h5 class="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition leading-snug">${c.name}</h5>
              <span class="text-xs text-slate-500 mt-1 block">${c.count}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Security & Privacy Focus Section -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 block">Architected For Enterprise Safety</span>
          <h3 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Privacy-First Location & Escrow Protection
          </h3>
          <p class="mt-4 text-base text-slate-600 leading-relaxed">
            Unlike consumer classifieds, EcoLoop never exposes your physical address, factory premises, or personal phone number to the general public.
          </p>

          <div class="mt-8 space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                🔒
              </div>
              <div>
                <h5 class="font-bold text-slate-900 text-sm">Protected Pickup Coordinates</h5>
                <p class="text-xs text-slate-600 mt-0.5">Public users only see City and approximate radius. Exact coordinates unlock only after transaction confirmation to authorized drivers.</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                🛡️
              </div>
              <div>
                <h5 class="font-bold text-slate-900 text-sm">Dual OTP Verification</h5>
                <p class="text-xs text-slate-600 mt-0.5">Material cannot be picked up without the Seller's OTP, and cannot be marked delivered without the Buyer's OTP and digital signature.</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                🛑
              </div>
              <div>
                <h5 class="font-bold text-slate-900 text-sm">Auto-Expiring Live GPS</h5>
                <p class="text-xs text-slate-600 mt-0.5">Live driver tracking automatically terminates immediately upon delivery confirmation, maintaining full route confidentiality.</p>
              </div>
            </div>
          </div>

          <div class="mt-8">
            <a href="#privacy-center" class="text-emerald-700 font-bold hover:text-emerald-800 text-sm inline-flex items-center gap-1.5">
              Explore Privacy Settings & Audit Controls &rarr;
            </a>
          </div>
        </div>

        <div class="bg-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 relative">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
            <span class="text-slate-400">Security Architecture Protocol</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">RBAC + PBKDF2</span>
          </div>

          <div class="mt-6 space-y-4 font-mono text-xs text-slate-300">
            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span class="text-emerald-400">PUBLIC_VIEW:</span>
              <p class="text-slate-300 mt-1">Guwahati, Assam (Approx 5km radius) | Seller Verified: True | Address: [ENCRYPTED]</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span class="text-amber-400">ESCROW_CONFIRMED:</span>
              <p class="text-slate-300 mt-1">Driver Auth Token Issued | Pickup OTP: [SELLER_KEY] | Live GPS: ACTIVE</p>
            </div>
            <div class="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
              <span class="text-emerald-400">DELIVERED_STATUS:</span>
              <p class="text-slate-300 mt-1">OTP Handshake Verified | GPS Stream: TERMINATED | Delivery Proof: SECURE_HASH</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion Section -->
    <section class="py-16 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h3>
          <p class="text-sm text-slate-600 mt-2">Everything you need to know about circular B2B transactions on EcoLoop.</p>
        </div>

        <div class="space-y-4">
          ${[
            {
              q: "Can my business operate as both a buyer and a seller?",
              a: "Yes! EcoLoop accounts support unified dual roles. You can list your company's surplus or scrap materials in Seller Mode, and switch instantly to Buyer Mode to procure secondary raw materials with no duplicate registration required."
            },
            {
              q: "How does the AI Matching Engine evaluate compatibility?",
              a: "Our algorithm calculates a multi-factor score (e.g. 94%) considering physical material properties, required sorting/preprocessing, geographical proximity (Haversine formula), freight cost feasibility, and enterprise verification history."
            },
            {
              q: "Who pays for EcoLoop Green Logistics?",
              a: "Logistics costs are calculated transparently during the purchase request and offer stage based on distance, weight, and vehicle capacity. The cost is included in the buyer's checkout total before payment confirmation."
            },
            {
              q: "Are the environmental impact figures verified?",
              a: "Yes. All carbon avoidance, water conservation, and landfill diversion figures are calculated using established lifecycle circular conversion indices (EPA WARM & WRAP guidelines) and are downloadable as certified impact receipts."
            }
          ].map((item, idx) => `
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h5 class="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
                <span>${item.q}</span>
              </h5>
              <p class="text-xs text-slate-600 leading-relaxed">${item.a}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#09231A] text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-base">♺</span>
            <span class="text-xl font-extrabold tracking-wider text-white">ECOLOOP</span>
          </div>
          <p class="text-xs text-emerald-200/70 leading-relaxed">
            Turning Leftovers Into Leverages. The B2B circular economy marketplace connecting sustainable enterprises across India.
          </p>
          <div class="mt-4 text-xs text-slate-500">
            &copy; 2026 EcoLoop Inc. All rights reserved.
          </div>
        </div>

        <div>
          <h5 class="text-white font-bold text-sm mb-4">Marketplace</h5>
          <ul class="space-y-2 text-xs">
            <li><a href="#marketplace" class="hover:text-emerald-400 transition">Browse Materials</a></li>
            <li><a href="#list-waste" class="hover:text-emerald-400 transition">List Surplus Material</a></li>
            <li><a href="#how-it-works" class="hover:text-emerald-400 transition">AI Matching Engine</a></li>
            <li><a href="#logistics-jobs" class="hover:text-emerald-400 transition">EcoLoop Green Fleet</a></li>
          </ul>
        </div>

        <div>
          <h5 class="text-white font-bold text-sm mb-4">Security & Compliance</h5>
          <ul class="space-y-2 text-xs">
            <li><a href="#privacy-center" class="hover:text-emerald-400 transition">Location Privacy Center</a></li>
            <li><a href="#privacy-center" class="hover:text-emerald-400 transition">Audit Access History</a></li>
            <li><a href="#impact" class="hover:text-emerald-400 transition">Impact Verification</a></li>
            <li><a href="#dispute-center" class="hover:text-emerald-400 transition">Dispute Resolution</a></li>
          </ul>
        </div>

        <div>
          <h5 class="text-white font-bold text-sm mb-4">Enterprise Support</h5>
          <p class="text-xs text-slate-400 mb-3">Enterprise inquiries, verified industrial scrap bulk agreements, and regional logistics hubs.</p>
          <div class="text-xs font-mono text-emerald-400">support@ecoloop.in</div>
          <div class="text-xs font-mono text-slate-400 mt-1">Toll-Free: 1800-ECO-LOOP</div>
        </div>
      </div>
    </footer>
  `;
}
