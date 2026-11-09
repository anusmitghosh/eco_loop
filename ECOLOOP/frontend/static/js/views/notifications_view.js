// EcoLoop Full Notifications Center View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderNotificationsView(container, filter = 'all') {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to view your Notifications.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="notif-content" class="py-16 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Loading enterprise notification feeds...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#notif-content');

  try {
    const res = await API.getNotifications();
    const allNotifs = res.notifications || [];

    content.innerHTML = `
      <div class="space-y-6 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Live Telemetry & Transaction Feeds</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
            <p class="text-xs text-slate-500 mt-1">Multi-channel updates across material requests, negotiations, payments, EV logistics, and security.</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-mark-all-read-view" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition">
              ✓ Mark All Read
            </button>
          </div>
        </div>

        <!-- Multi-Channel Delivery Channels Settings Banner -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div class="space-y-0.5">
            <strong class="text-slate-900 block font-bold">Multi-Channel Broadcast Preferences:</strong>
            <span class="text-slate-500">In-app notifications are instant. Receive mirrored SMS OTPs and email transaction summaries.</span>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-[11px]">
              <input type="checkbox" checked class="rounded text-emerald-600">
              Email Alerts
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-[11px]">
              <input type="checkbox" checked class="rounded text-emerald-600">
              SMS OTP
            </label>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-bold p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button class="notif-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'all' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="all">All (${allNotifs.length})</button>
          <button class="notif-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'trade' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="trade">Requests & Offers</button>
          <button class="notif-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'logistics' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="logistics">Logistics & Tracking</button>
          <button class="notif-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'payment' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="payment">Escrow Payments</button>
          <button class="notif-filter-btn px-3 py-1.5 rounded-xl transition ${filter === 'security' ? 'bg-[#0F382A] text-white' : 'text-slate-600 hover:bg-slate-100'}" data-filter="security">Security & Alerts</button>
        </div>

        <!-- Notification List -->
        <div id="notifs-container" class="space-y-3">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    const notifsContainer = content.querySelector('#notifs-container');

    function renderList(filtered) {
      if (filtered.length === 0) {
        notifsContainer.innerHTML = `
          <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <div class="text-4xl">🔔</div>
            <p class="text-xs font-bold text-slate-700">No notifications in this category</p>
            <p class="text-[11px] text-slate-400">All alerts and transaction events will populate here in real-time.</p>
          </div>
        `;
        return;
      }

      notifsContainer.innerHTML = filtered.map(n => {
        const isRead = bool(n.is_read);
        const icon = 
          n.type === 'logistics' ? '🚚' :
          n.type === 'payment' ? '💳' :
          n.type === 'offer' || n.type === 'request' ? '🤝' :
          n.type === 'security' || n.type === 'alert' ? '🔒' : '📢';

        return `
          <div class="bg-white rounded-2xl border ${!isRead ? 'border-emerald-400 bg-emerald-50/20 shadow-sm' : 'border-slate-200'} p-4 sm:p-5 hover:border-slate-300 transition flex items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <span class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                ${icon}
              </span>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="text-slate-900 font-bold text-sm">${n.title}</strong>
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                    n.type === 'logistics' ? 'bg-amber-100 text-amber-800' :
                    n.type === 'payment' ? 'bg-emerald-100 text-emerald-800' :
                    n.type === 'security' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }">
                    ${n.type}
                  </span>
                  ${!isRead ? `<span class="w-2 h-2 rounded-full bg-emerald-500"></span>` : ''}
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">${n.message}</p>
                <div class="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                  <span>${new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  ${n.link_url ? `
                    <span>•</span>
                    <a href="${n.link_url}" class="text-emerald-700 font-bold hover:underline">View Details →</a>
                  ` : ''}
                </div>
              </div>
            </div>

            <div class="shrink-0 flex items-center gap-2">
              ${!isRead ? `
                <button class="btn-single-read px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition" data-id="${n.id}">
                  Mark read
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Bind single read buttons
      notifsContainer.querySelectorAll('.btn-single-read').forEach(b => {
        b.onclick = async () => {
          const id = b.getAttribute('data-id');
          await API.markNotificationRead(id);
          renderNotificationsView(container, filter);
        };
      });
    }

    function bool(val) {
      return val === true || val === 1 || val === '1';
    }

    function filterNotifs(f) {
      if (f === 'trade') return allNotifs.filter(n => n.type === 'request' || n.type === 'offer');
      if (f === 'logistics') return allNotifs.filter(n => n.type === 'logistics');
      if (f === 'payment') return allNotifs.filter(n => n.type === 'payment');
      if (f === 'security') return allNotifs.filter(n => n.type === 'security' || n.type === 'alert');
      return allNotifs;
    }

    renderList(filterNotifs(filter));

    // Filter Buttons
    content.querySelectorAll('.notif-filter-btn').forEach(btn => {
      btn.onclick = () => {
        content.querySelectorAll('.notif-filter-btn').forEach(b => {
          b.className = 'notif-filter-btn px-3 py-1.5 rounded-xl transition text-slate-600 hover:bg-slate-100';
        });
        btn.className = 'notif-filter-btn px-3 py-1.5 rounded-xl transition bg-[#0F382A] text-white';
        renderList(filterNotifs(btn.getAttribute('data-filter')));
      };
    });

    // Mark All Read
    const markAllBtn = content.querySelector('#btn-mark-all-read-view');
    if (markAllBtn) {
      markAllBtn.onclick = async () => {
        await API.markAllNotificationsRead();
        Toast.show("All notifications marked as read.", "success");
        renderNotificationsView(container);
      };
    }

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
