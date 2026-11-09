// EcoLoop Negotiation & Messaging View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderNegotiation(container, conversationId) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to access your negotiation room.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="negotiation-card" class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[780px]">
        <div class="p-12 text-center text-slate-400">
          <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
          <p class="text-sm">Connecting to secure in-app negotiation channel...</p>
        </div>
      </div>
    </div>
  `;

  const card = container.querySelector('#negotiation-card');

  try {
    const res = await API.getConversation(conversationId);
    if (!res.success) {
      card.innerHTML = `<div class="p-8 text-center text-rose-600">Failed to load conversation.</div>`;
      return;
    }

    const conv = res.conversation;
    const isBuyer = res.is_buyer;
    const isSeller = res.is_seller;
    const isAccepted = conv.request_status === 'accepted' || conv.request_status === 'converted_to_order';

    card.innerHTML = `
      <!-- Header -->
      <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <a href="#orders" class="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-slate-900 text-base leading-snug">
                Negotiating: ${conv.listing_title}
              </h3>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
                conv.request_status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                conv.request_status === 'declined' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }">
                ${conv.request_status.toUpperCase()}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Between <strong>${conv.buyer_display}</strong> (Buyer) & <strong>${conv.seller_display}</strong> (Seller)
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${isAccepted ? `
            <a href="#checkout/${conv.purchase_request_id}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
              Proceed to Checkout &rarr;
            </a>
          ` : ''}

          <div class="relative group">
            <button class="p-2 rounded-xl hover:bg-slate-200 text-slate-500 text-sm">⋮</button>
            <div class="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg hidden group-hover:block p-1 text-xs z-20">
              <button id="btn-report-conv" class="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700">Report Conversation</button>
              <button id="btn-block-user" class="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-rose-600 font-semibold">Block User</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Offer Strip -->
      <div class="px-5 py-3 bg-emerald-50/80 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div class="flex items-center gap-4 text-emerald-900 font-medium">
          <span>📦 Terms: <strong>${conv.requested_quantity} ${conv.unit}</strong></span>
          <span>💰 Offer: <strong>₹${conv.offer_price}/${conv.unit}</strong> (Total: <strong>₹${conv.total_material_offer}</strong>)</span>
          <span>🚚 Method: <strong>${conv.delivery_preference.replace('_', ' ').toUpperCase()}</strong></span>
        </div>

        <!-- Action buttons for counterparty -->
        ${!isAccepted && conv.request_status !== 'declined' ? `
          <div class="flex items-center gap-2">
            <button id="btn-open-counter" class="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition shadow-sm">
              Counter-Offer
            </button>
            <button id="btn-accept-offer" class="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition shadow-sm">
              Accept Terms
            </button>
            <button id="btn-decline-offer" class="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 transition">
              Decline
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Masked Security Warning Strip -->
      <div class="px-5 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shrink-0">
        <span class="flex items-center gap-1.5">
          <span class="text-emerald-700">🛡️</span>
          <strong>EcoLoop Masked Protection:</strong> Phone numbers & personal emails are shielded. Keep all communications in-platform.
        </span>
        <span class="text-slate-400">Escrow Guarantee Active</span>
      </div>

      <!-- Message History List -->
      <div id="messages-container" class="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
        ${res.messages.map(m => {
          const isMe = m.sender_id === State.user.id;
          if (m.message_type === 'offer' || m.message_type === 'counter_offer') {
            return `
              <div class="max-w-md mx-auto my-3 p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm text-center">
                <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  ${m.message_type === 'counter_offer' ? '⚡ Counter-Offer Lodged' : '📋 Official Purchase Offer'}
                </span>
                <p class="text-sm font-semibold text-slate-800">${m.content}</p>
                <span class="text-[10px] text-slate-400 block mt-2">${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            `;
          }

          if (m.message_type === 'acceptance') {
            return `
              <div class="max-w-md mx-auto my-3 p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-center text-emerald-950 font-bold text-sm">
                🎉 ${m.content}
              </div>
            `;
          }

          if (m.message_type === 'rejection') {
            return `
              <div class="max-w-md mx-auto my-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800 text-xs font-medium">
                ✕ ${m.content}
              </div>
            `;
          }

          return `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
              <span class="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">${m.sender_name}</span>
              <div class="max-w-md p-3.5 rounded-2xl text-sm leading-relaxed ${
                isMe ? 'bg-[#0F382A] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
              }">
                ${m.content}
              </div>
              <span class="text-[10px] text-slate-400 mt-1 px-1">${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Counter-Offer Floating Drawer / Form (Hidden by default) -->
      <div id="counter-offer-drawer" class="hidden p-4 bg-emerald-50 border-t border-emerald-200 shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-xs text-emerald-900 uppercase">Make a Counter-Offer</h4>
          <button id="btn-close-counter" class="text-slate-400 hover:text-slate-600 text-sm font-bold">&times;</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Counter Quantity (${conv.unit})</label>
            <input type="number" id="counter-qty" value="${conv.requested_quantity}" step="any"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Counter Price Per ${conv.unit} (₹)</label>
            <input type="number" id="counter-price" value="${conv.offer_price}" step="any"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Logistics Method</label>
            <select id="counter-delivery" class="w-full px-3 py-2 rounded-xl border border-slate-300">
              <option value="ecoloop_logistics">EcoLoop Green Fleet Logistics</option>
              <option value="buyer_pickup">Buyer Self-Pickup</option>
              <option value="seller_delivery">Seller Delivery</option>
            </select>
          </div>
        </div>
        <button id="btn-submit-counter" class="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition">
          Send Formal Counter-Offer
        </button>
      </div>

      <!-- Message Input Form -->
      <form id="send-msg-form" class="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
        <input type="text" id="chat-input" placeholder="Type a message or negotiation note..." required autocomplete="off"
          class="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
        <button type="submit" class="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition flex items-center gap-1.5">
          <span>Send</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </form>
    `;

    // Scroll to bottom of message list
    const msgContainer = card.querySelector('#messages-container');
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Send text message
    const msgForm = card.querySelector('#send-msg-form');
    const chatInput = card.querySelector('#chat-input');
    msgForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';

      try {
        const sendRes = await API.sendMessage(conversationId, text);
        if (sendRes.success) {
          // Re-render negotiation view
          renderNegotiation(container, conversationId);
        }
      } catch (err) {
        Toast.show(err.message, "error");
      }
    };

    // Counter offer drawer toggle
    const counterDrawer = card.querySelector('#counter-offer-drawer');
    const openCounterBtn = card.querySelector('#btn-open-counter');
    const closeCounterBtn = card.querySelector('#btn-close-counter');
    if (openCounterBtn) {
      openCounterBtn.onclick = () => counterDrawer.classList.toggle('hidden');
    }
    if (closeCounterBtn) {
      closeCounterBtn.onclick = () => counterDrawer.classList.add('hidden');
    }

    // Submit counter offer
    const submitCounterBtn = card.querySelector('#btn-submit-counter');
    if (submitCounterBtn) {
      submitCounterBtn.onclick = async () => {
        try {
          const qty = parseFloat(card.querySelector('#counter-qty').value);
          const price = parseFloat(card.querySelector('#counter-price').value);
          const delivery = card.querySelector('#counter-delivery').value;

          const actionRes = await API.handleOfferAction(conversationId, 'counter', {
            counter_quantity: qty,
            counter_price: price,
            counter_delivery: delivery,
            note: `Updated terms: ${qty} ${conv.unit} @ ₹${price}/${conv.unit}`
          });
          if (actionRes.success) {
            Toast.show("Counter-offer submitted!", "success");
            renderNegotiation(container, conversationId);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

    // Accept offer
    const acceptBtn = card.querySelector('#btn-accept-offer');
    if (acceptBtn) {
      acceptBtn.onclick = async () => {
        try {
          const actionRes = await API.handleOfferAction(conversationId, 'accept');
          if (actionRes.success) {
            Toast.show("Offer accepted! Transaction confirmed.", "success");
            renderNegotiation(container, conversationId);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

    // Decline offer
    const declineBtn = card.querySelector('#btn-decline-offer');
    if (declineBtn) {
      declineBtn.onclick = async () => {
        const reason = prompt("Enter a reason for declining this offer (optional):");
        try {
          const actionRes = await API.handleOfferAction(conversationId, 'decline', { note: reason });
          if (actionRes.success) {
            Toast.show("Offer declined.", "info");
            renderNegotiation(container, conversationId);
          }
        } catch (err) {
          Toast.show(err.message, "error");
        }
      };
    }

  } catch (err) {
    card.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
