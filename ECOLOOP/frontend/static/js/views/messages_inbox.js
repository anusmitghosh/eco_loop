// EcoLoop Messages & Negotiation Inbox View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderMessagesInbox(container, filter = 'all') {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access your Messages & Negotiations.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="inbox-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading conversations & active negotiations...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#inbox-content');

  try {
    const res = await API.getUserConversations();
    const allConvs = res.conversations || [];

    content.innerHTML = `
      <div class="space-y-6 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Direct Enterprise Communications</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Messages & Negotiations</h1>
            <p class="text-xs text-slate-500 mt-1">In-platform masked negotiations, purchase requests, counter-offers, and deal confirmations.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              ${allConvs.length} Active Threads
            </span>
          </div>
        </div>

        <!-- Privacy & Protection Notice -->
        <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
          <span class="text-lg">🛡️</span>
          <span><strong>Masked Communication Active:</strong> Personal telephone numbers and private emails are never exposed. All discussions, price negotiations, and delivery terms are verified in-platform for audit compliance.</span>
        </div>

        <!-- Filter Pills & Search -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-bold p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <button class="inbox-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'all' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="all">All (${allConvs.length})</button>
            <button class="inbox-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'inbound' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="inbound">Inbound (Seller)</button>
            <button class="inbox-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'outbound' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="outbound">Outbound (Buyer)</button>
            <button class="inbox-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'accepted' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="accepted">Accepted Deals</button>
          </div>

          <div class="relative w-full sm:w-64">
            <input type="text" id="inbox-search" placeholder="Search by enterprise or material..." class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500">
            <span class="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          </div>
        </div>

        <!-- Conversations List -->
        <div id="conversations-list-container" class="space-y-3">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    const listContainer = content.querySelector('#conversations-list-container');
    const searchInput = content.querySelector('#inbox-search');

    function renderList(filteredConvs) {
      if (filteredConvs.length === 0) {
        listContainer.innerHTML = `
          <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <div class="text-4xl">💬</div>
            <p class="text-sm font-bold text-slate-700">No conversations found.</p>
            <p class="text-xs text-slate-400">Browse the marketplace and submit a purchase request or offer to start negotiating.</p>
            <a href="#marketplace" class="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition">
              Explore Marketplace
            </a>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filteredConvs.map(c => {
        const isUnread = (c.unread_messages || 0) > 0;
        return `
          <div class="bg-white rounded-2xl border ${isUnread ? 'border-emerald-400 bg-emerald-50/20 shadow-sm' : 'border-slate-200'} p-4 sm:p-5 hover:border-emerald-500 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" onclick="window.location.hash='#negotiation/${c.id}'">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-base shrink-0 border border-slate-200">
                ${(c.other_party_name || 'E')[0]}
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="text-slate-900 font-bold text-sm">${c.other_party_name || 'Verified Enterprise'}</strong>
                  <span class="text-[10px] text-slate-400 font-mono">📍 ${c.other_party_city || 'India'}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.request_status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                    c.request_status === 'negotiating' ? 'bg-amber-100 text-amber-800' :
                    c.request_status === 'declined' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }">
                    ${(c.request_status || 'PENDING').toUpperCase()}
                  </span>
                  ${c.is_buyer ? `
                    <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">You are Buyer</span>
                  ` : `
                    <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">You are Seller</span>
                  `}
                </div>

                <div class="flex items-center gap-2 text-xs">
                  <span class="font-bold text-slate-800">${c.listing_title}</span>
                  <span class="text-slate-400">•</span>
                  <span class="font-mono text-emerald-700 font-semibold">${c.requested_quantity} ${c.unit} @ ₹${c.offer_price}/${c.unit}</span>
                </div>

                <p class="text-xs text-slate-500 line-clamp-1 italic">
                  "${c.last_message_content || 'Purchase request initialized.'}"
                </p>
              </div>
            </div>

            <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2">
              <span class="text-[10px] text-slate-400 font-mono">
                ${c.last_message_time ? new Date(c.last_message_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </span>
              <div class="flex items-center gap-2">
                ${isUnread ? `
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                    ${c.unread_messages} New
                  </span>
                ` : ''}
                <button class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs transition">
                  Open Room →
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Filter Logic
    function applyFilter(fVal, query = '') {
      let result = allConvs;
      if (fVal === 'inbound') {
        result = result.filter(c => !c.is_buyer);
      } else if (fVal === 'outbound') {
        result = result.filter(c => c.is_buyer);
      } else if (fVal === 'accepted') {
        result = result.filter(c => c.request_status === 'accepted');
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        result = result.filter(c => 
          (c.other_party_name && c.other_party_name.toLowerCase().includes(q)) ||
          (c.listing_title && c.listing_title.toLowerCase().includes(q))
        );
      }

      renderList(result);
    }

    // Initial render
    applyFilter(filter);

    // Filter button listeners
    content.querySelectorAll('.inbox-filter-btn').forEach(btn => {
      btn.onclick = () => {
        content.querySelectorAll('.inbox-filter-btn').forEach(b => {
          b.className = 'inbox-filter-btn px-3 py-1.5 rounded-xl transition text-slate-600 hover:bg-slate-100';
        });
        btn.className = 'inbox-filter-btn px-3 py-1.5 rounded-xl transition bg-[#0F382A] text-white';
        applyFilter(btn.getAttribute('data-filter'), searchInput.value);
      };
    });

    // Search input listener
    searchInput.oninput = (e) => {
      const activeBtn = content.querySelector('.inbox-filter-btn.bg-\\[\\#0F382A\\]');
      const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
      applyFilter(activeFilter, e.target.value);
    };

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
