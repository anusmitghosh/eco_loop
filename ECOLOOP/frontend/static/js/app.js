// EcoLoop Master Application Router & Shell
import { State, Toast } from './state.js';
import { API } from './api.js';

import { renderLanding } from './views/landing.js';
import { renderMarketplace } from './views/marketplace.js';
import { renderMaterialDetail } from './views/material_detail.js';
import { renderListWaste } from './views/list_waste.js';
import { renderNegotiation } from './views/negotiation.js';
import { renderCheckout } from './views/checkout.js';
import { renderOrders } from './views/orders.js';
import { renderTracking } from './views/tracking.js';
import { renderLogisticsDashboard } from './views/logistics_dashboard.js';
import { renderSellerDashboard } from './views/seller_dashboard.js';
import { renderBuyerDashboard } from './views/buyer_dashboard.js';
import { renderImpact } from './views/impact.js';
import { renderPrivacyCenter } from './views/privacy_center.js';
import { renderAdmin } from './views/admin.js';
import { renderAuth } from './views/auth_view.js';
import { renderBusinessProfile } from './views/business_profile.js';
import { renderMessagesInbox } from './views/messages_inbox.js';
import { renderDisputeCenter } from './views/dispute_center.js';
import { renderNotificationsView } from './views/notifications_view.js';
import { renderHelpSupport } from './views/help_support.js';
import { renderPaymentMethodsView } from './views/payment_methods_view.js';

const appRoot = document.getElementById('app-root');
const navContainer = document.getElementById('nav-container');

// Render Navigation Header (Prompt Section 31 Specification)
function renderNavbar() {
  const user = State.user;
  const activeRole = State.activeRole;
  const unread = State.unreadCount;

  navContainer.innerHTML = `
    <header class="bg-[#0F382A] text-white border-b border-emerald-900/60 sticky top-0 z-40 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-6">
            <a href="#home" class="flex items-center gap-2 group">
              <span class="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                ♺
              </span>
              <div>
                <span class="text-xl font-extrabold tracking-wider text-white flex items-center gap-1">
                  ECOLOOP
                </span>
                <span class="text-[9px] uppercase tracking-widest text-emerald-300 font-semibold block -mt-1">
                  Turning Leftovers Into Leverages
                </span>
              </div>
            </a>

            <!-- Desktop Nav Links (Prompt requirement #31) -->
            <nav class="hidden xl:flex items-center gap-0.5 text-xs font-semibold">
              <a href="#home" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Home</a>
              <a href="#marketplace" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Marketplace</a>
              <a href="#how-it-works" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">How It Works</a>
              <a href="#list-waste" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">List Waste</a>
              <a href="#orders" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Orders</a>
              <a href="#messages" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Messages</a>
              <a href="#logistics-jobs" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Logistics</a>
              <a href="#impact" class="px-2.5 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition">Impact</a>
              ${user && user.role === 'admin' ? `
                <a href="#admin" class="px-2.5 py-2 rounded-xl text-amber-300 hover:text-white hover:bg-white/10 transition">Admin</a>
              ` : ''}
            </nav>
          </div>

          <!-- Right Side: Quick Persona Switcher + Mode Switcher + Notifications + Profile -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- 1-Click Quick Demo Persona Selector Dropdown -->
            <div class="relative group">
              <button class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="hidden sm:inline">Demo Persona</span>
                <span>▾</span>
              </button>
              <div class="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl hidden group-hover:block p-1.5 text-xs z-50 text-white">
                <div class="px-2.5 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Switch Persona</div>
                <button class="nav-demo-btn w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center justify-between" data-role="seller">
                  <span>GreenLeaf Restaurant</span>
                  <span class="text-[10px] text-emerald-400 font-bold">Seller</span>
                </button>
                <button class="nav-demo-btn w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center justify-between" data-role="buyer">
                  <span>PackRight Packaging</span>
                  <span class="text-[10px] text-blue-400 font-bold">Buyer</span>
                </button>
                <button class="nav-demo-btn w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center justify-between" data-role="both">
                  <span>EcoBiz Solutions</span>
                  <span class="text-[10px] text-teal-400 font-bold">Both</span>
                </button>
                <button class="nav-demo-btn w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center justify-between" data-role="logistics">
                  <span>EcoLoop Green Fleet</span>
                  <span class="text-[10px] text-amber-400 font-bold">Logistics</span>
                </button>
                <button class="nav-demo-btn w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center justify-between" data-role="admin">
                  <span>EcoLoop Platform Admin</span>
                  <span class="text-[10px] text-purple-400 font-bold">Admin</span>
                </button>
              </div>
            </div>

            <!-- Active Mode Switcher Pill (Buyer / Seller) without creating separate accounts -->
            ${user ? `
              <div class="hidden lg:flex items-center bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button id="btn-mode-buyer" class="px-2.5 py-1 rounded-lg transition ${activeRole === 'buyer' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-emerald-200 hover:text-white'}">
                  Buyer Mode
                </button>
                <button id="btn-mode-seller" class="px-2.5 py-1 rounded-lg transition ${activeRole === 'seller' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-emerald-200 hover:text-white'}">
                  Seller Mode
                </button>
              </div>
            ` : ''}

            <!-- Notifications Bell -->
            ${user ? `
              <div class="relative group">
                <a href="#notifications" id="btn-notifs" class="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-200 relative block">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  ${unread > 0 ? `
                    <span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center font-mono">
                      ${unread}
                    </span>
                  ` : ''}
                </a>
                <div class="absolute right-0 top-full mt-1 w-80 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl hidden group-hover:block p-3 text-xs z-50">
                  <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span class="font-bold text-slate-800">Notifications</span>
                    <a href="#notifications" class="text-emerald-700 hover:underline text-[10px] font-bold">View all</a>
                  </div>
                  <div id="nav-notifs-list" class="max-h-64 overflow-y-auto space-y-2">
                    <p class="text-slate-400 py-2 text-center text-xs">Loading alerts...</p>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Profile Menu (Prompt requirement #31) -->
            ${user ? `
              <div class="relative group">
                <button class="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white">
                  <span class="truncate max-w-[100px] hidden sm:inline">${user.business?.business_name || user.full_name}</span>
                  <div class="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    ${(user.full_name || 'U')[0]}
                  </div>
                  <span>▾</span>
                </button>
                <div class="absolute right-0 top-full mt-1 w-56 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl hidden group-hover:block p-1.5 text-xs z-50">
                  <div class="px-3 py-2 border-b border-slate-100 mb-1">
                    <strong class="block text-slate-900 truncate">${user.business?.business_name || user.full_name}</strong>
                    <span class="text-[10px] text-slate-500 truncate block">${user.email}</span>
                  </div>
                  
                  <a href="${activeRole === 'seller' ? '#seller-dashboard' : '#buyer-dashboard'}" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Dashboard</a>
                  <a href="#account" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Account</a>
                  <a href="#business-profile" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Business Profile</a>
                  <a href="#privacy-center" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Privacy & Security</a>
                  <a href="#location-settings" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Location Settings</a>
                  <a href="#payment-methods" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Payment Methods</a>
                  <a href="#disputes" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Dispute Center</a>
                  <a href="#help" class="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Help & Support</a>
                  <button id="btn-logout" class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-bold border-t border-slate-100 mt-1">Logout</button>
                </div>
              </div>
            ` : `
              <div class="flex items-center gap-2">
                <a href="#login" class="px-3 py-1.5 rounded-xl text-emerald-200 hover:text-white font-medium text-xs transition">
                  Sign In
                </a>
                <a href="#signup" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition">
                  Register Business
                </a>
              </div>
            `}
          </div>
        </div>
      </div>
    </header>
  `;

  // Bind Navbar Listeners
  navContainer.querySelectorAll('.nav-demo-btn').forEach(btn => {
    btn.onclick = async () => {
      const roleKey = btn.getAttribute('data-role');
      await State.demoSwitch(roleKey);
      if (roleKey === 'seller') window.location.hash = "#seller-dashboard";
      else if (roleKey === 'buyer') window.location.hash = "#buyer-dashboard";
      else if (roleKey === 'both') window.location.hash = "#marketplace";
      else if (roleKey === 'logistics') window.location.hash = "#logistics-jobs";
      else if (roleKey === 'admin') window.location.hash = "#admin";
    };
  });

  const modeBuyerBtn = navContainer.querySelector('#btn-mode-buyer');
  const modeSellerBtn = navContainer.querySelector('#btn-mode-seller');
  if (modeBuyerBtn) {
    modeBuyerBtn.onclick = () => {
      State.switchRole('buyer');
      window.location.hash = "#buyer-dashboard";
    };
  }
  if (modeSellerBtn) {
    modeSellerBtn.onclick = () => {
      State.switchRole('seller');
      window.location.hash = "#seller-dashboard";
    };
  }

  const logoutBtn = navContainer.querySelector('#btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      State.logout();
      window.location.hash = "#";
    };
  }

  // Load notifications preview on hover
  const notifContainer = navContainer.querySelector('#nav-notifs-list');
  if (notifContainer && user) {
    API.getNotifications().then(res => {
      if (res.success && res.notifications.length > 0) {
        notifContainer.innerHTML = res.notifications.slice(0, 5).map(n => `
          <a href="${n.link_url || '#notifications'}" class="block p-2 rounded-xl ${n.is_read ? 'bg-slate-50' : 'bg-emerald-50/60'} hover:bg-slate-100 transition">
            <strong class="text-slate-900 block text-[11px] leading-tight">${n.title}</strong>
            <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-2">${n.message}</p>
          </a>
        `).join('');
      } else {
        notifContainer.innerHTML = `<p class="text-slate-400 py-2 text-center text-xs">No new notifications.</p>`;
      }
    }).catch(() => {});
  }
}

// Router Logic: Supports all 26 Views Specified in Prompt Section 48
export async function route() {
  const hash = window.location.hash.slice(1) || '';
  const [routePath, queryString] = hash.split('?');
  const queryParams = Object.fromEntries(new URLSearchParams(queryString || ''));

  renderNavbar();

  // Scroll to top
  window.scrollTo(0, 0);

  // 1. Landing Page
  if (!routePath || routePath === '' || routePath === 'home' || routePath === 'landing') {
    renderLanding(appRoot);
  } else if (routePath === 'how-it-works') {
    renderLanding(appRoot);
    setTimeout(() => {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  // 2. Login
  } else if (routePath === 'login') {
    renderAuth(appRoot, 'login');
  // 3. Signup
  } else if (routePath === 'signup') {
    renderAuth(appRoot, 'signup');
  // 4 & 5. Business Profile & Verification & Account
  } else if (routePath === 'business-profile' || routePath === 'verification' || routePath === 'account') {
    await renderBusinessProfile(appRoot, routePath === 'verification' ? 'kyc' : 'profile');
  // 6. Marketplace
  } else if (routePath === 'marketplace') {
    await renderMarketplace(appRoot, queryParams);
  // 7. Material Details
  } else if (routePath.startsWith('material/')) {
    const id = routePath.split('/')[1];
    await renderMaterialDetail(appRoot, id, queryParams.action);
  // 8. List Waste
  } else if (routePath === 'list-waste') {
    renderListWaste(appRoot);
  // 9. Buyer Dashboard
  } else if (routePath === 'buyer-dashboard') {
    await renderBuyerDashboard(appRoot);
  // 10. Seller Dashboard
  } else if (routePath === 'seller-dashboard') {
    await renderSellerDashboard(appRoot);
  // 11. Material Requests & Negotiations Inbox
  } else if (routePath === 'messages' || routePath === 'requests') {
    await renderMessagesInbox(appRoot, queryParams.filter || 'all');
  // 12. Negotiation / Chat Room
  } else if (routePath.startsWith('negotiation/')) {
    const id = routePath.split('/')[1];
    await renderNegotiation(appRoot, id);
  // 13. Checkout
  } else if (routePath.startsWith('checkout/')) {
    const id = routePath.split('/')[1];
    await renderCheckout(appRoot, id);
  // 14 & 15. Orders & Order Details
  } else if (routePath === 'orders' || routePath.startsWith('orders/')) {
    const tabOrId = routePath.includes('/') ? routePath.split('/')[1] : (queryParams.tab || 'all');
    await renderOrders(appRoot, tabOrId);
  // 16. Logistics Dashboard
  } else if (routePath === 'logistics-jobs' || routePath === 'logistics') {
    await renderLogisticsDashboard(appRoot);
  // 17 & 18. Shipment Tracking & Live Map
  } else if (routePath.startsWith('tracking/')) {
    const id = routePath.split('/')[1];
    await renderTracking(appRoot, id);
  // 19. Environmental Impact Dashboard
  } else if (routePath === 'impact') {
    await renderImpact(appRoot);
  // 20. Notifications
  } else if (routePath === 'notifications') {
    await renderNotificationsView(appRoot, queryParams.filter || 'all');
  // 21, 22, 23. Privacy Center, Security Center & Location Settings
  } else if (routePath === 'privacy-center') {
    await renderPrivacyCenter(appRoot, 'location');
  } else if (routePath === 'security') {
    await renderPrivacyCenter(appRoot, 'security');
  } else if (routePath === 'location-settings') {
    await renderPrivacyCenter(appRoot, 'location');
  // 24. Dispute Center
  } else if (routePath === 'disputes') {
    await renderDisputeCenter(appRoot);
  // 25. Help & Support
  } else if (routePath === 'help' || routePath === 'support') {
    renderHelpSupport(appRoot);
  // Payment Methods
  } else if (routePath === 'payment-methods') {
    await renderPaymentMethodsView(appRoot);
  // 26. Admin Dashboard
  } else if (routePath === 'admin') {
    await renderAdmin(appRoot);
  } else {
    // Default fallback to landing
    renderLanding(appRoot);
  }
}

// Global App Initialization
window.addEventListener('DOMContentLoaded', async () => {
  await State.init();
  State.subscribe(renderNavbar);
  window.addEventListener('hashchange', route);
  route();
});
