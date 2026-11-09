// EcoLoop Checkout & Payment View
import { API } from '../api.js';
import { State, Toast } from '../state.js';

export async function renderCheckout(container, requestId) {
  if (!State.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <p class="text-sm font-bold text-slate-800">Please sign in to proceed with checkout.</p>
        <button onclick="window.location.hash='#login'" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="checkout-content" class="py-12 text-center text-slate-400">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm">Calculating escrow settlement and logistics fees...</p>
      </div>
    </div>
  `;

  const content = container.querySelector('#checkout-content');

  try {
    // Fetch requests list to get the relevant purchase request
    const reqRes = await API.getRequests();
    const reqList = reqRes.requests || [];
    const pr = reqList.find(r => r.id == requestId) || reqList[0];

    if (!pr) {
      content.innerHTML = `
        <div class="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <p class="font-bold text-slate-900">Purchase Request #${requestId} not found.</p>
          <a href="#orders" class="mt-4 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">View Orders</a>
        </div>
      `;
      return;
    }

    const materialAmount = pr.total_material_offer;
    const platformFee = Math.max(30, Math.round(materialAmount * 0.05));
    const logisticsFee = pr.delivery_preference === 'ecoloop_logistics' ? 80 : 0;
    const grandTotal = materialAmount + platformFee + logisticsFee;

    content.innerHTML = `
      <div class="text-left">
        <!-- Header -->
        <div class="mb-8 pb-4 border-b border-slate-200">
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Escrow Checkout</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Confirm Order & Authorize Payment</h1>
          <p class="text-xs text-slate-500 mt-1">Order terms accepted by counterparty. Funds remain safeguarded in EcoLoop Escrow.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <!-- Left: Payment Method & Delivery Address -->
          <div class="md:col-span-7 space-y-6">
            <!-- Delivery Destination -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 class="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
                <span>1. Delivery Destination</span>
                <span class="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Buyer Protected</span>
              </h3>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Delivery City & State</label>
                  <input type="text" id="chk-city" value="Guwahati, Assam" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Approximate Industrial Area (Visible to Seller)</label>
                  <input type="text" id="chk-approx" value="Beltola Industrial Hub" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Exact Unloading Facility / Warehouse <span class="text-rose-600 font-normal">(Shared only with verified driver)</span>
                  </label>
                  <input type="text" id="chk-exact" value="Warehouse 12, Beltola-Basistha Link Rd, Guwahati, Assam 781028" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium">
                </div>
              </div>
            </div>

            <!-- Payment Methods -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 class="font-bold text-slate-900 text-sm mb-4">2. Select Payment Method</h3>

              <div class="space-y-3" id="pay-methods">
                <label class="flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 cursor-pointer text-xs pay-opt">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="pay_method" value="upi" checked class="text-emerald-600 focus:ring-emerald-500">
                    <div>
                      <span class="font-bold text-slate-900 text-sm block">UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                      <span class="text-slate-500">Instant Escrow Lock & Zero Processing Surcharge</span>
                    </div>
                  </div>
                  <span class="font-bold font-mono text-emerald-700">Instant</span>
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer text-xs pay-opt">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="pay_method" value="card" class="text-emerald-600 focus:ring-emerald-500">
                    <div>
                      <span class="font-bold text-slate-900 text-sm block">Corporate Credit / Debit Card</span>
                      <span class="text-slate-500">Visa, Mastercard, RuPay Corporate Cards</span>
                    </div>
                  </div>
                  <span class="font-mono text-slate-500">256-Bit</span>
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer text-xs pay-opt">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="pay_method" value="netbanking" class="text-emerald-600 focus:ring-emerald-500">
                    <div>
                      <span class="font-bold text-slate-900 text-sm block">Corporate Net Banking</span>
                      <span class="text-slate-500">HDFC, ICICI, SBI, Axis, Kotak Enterprise Banking</span>
                    </div>
                  </div>
                  <span class="font-mono text-slate-500">RTGS/NEFT</span>
                </label>
              </div>

              <!-- UPI VPA input container -->
              <div id="vpa-container" class="mt-4 pt-4 border-t border-slate-100">
                <label class="block text-xs font-bold text-slate-700 mb-1">Enter Business UPI ID</label>
                <input type="text" id="vpa-input" value="packright@okhdfcbank" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono">
              </div>
            </div>
          </div>

          <!-- Right: Order Cost Breakdown & Confirm -->
          <div class="md:col-span-5 space-y-4">
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 class="font-bold text-slate-900 text-sm mb-4 pb-3 border-b border-slate-100">Order Summary</h3>

              <div class="space-y-3 text-xs">
                <div>
                  <span class="text-slate-400 block">Material</span>
                  <strong class="text-slate-800 text-sm block">${pr.listing_title}</strong>
                  <span class="text-slate-500">${pr.requested_quantity} ${pr.unit} @ ₹${pr.offer_price}/${pr.unit}</span>
                </div>

                <div class="pt-3 border-t border-slate-100 space-y-2">
                  <div class="flex justify-between text-slate-600">
                    <span>Material Amount</span>
                    <span class="font-mono font-bold">₹${materialAmount.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>EcoLoop Escrow Fee (5%)</span>
                    <span class="font-mono font-bold">₹${platformFee.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>EcoLoop Green Fleet Logistics</span>
                    <span class="font-mono font-bold">₹${logisticsFee.toFixed(2)}</span>
                  </div>
                  <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline text-slate-900">
                    <span class="font-extrabold text-sm">Grand Total</span>
                    <span class="font-extrabold text-xl text-emerald-700 font-mono">₹${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Escrow Guarantee Badge -->
              <div class="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                <span class="font-bold block">🛡️ EcoLoop Escrow Guarantee:</span>
                <p>Seller only receives payout after you verify the physical material and share your 6-digit delivery OTP with the driver.</p>
              </div>

              <button id="btn-confirm-pay" class="w-full mt-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition">
                Pay ₹${grandTotal.toFixed(2)} & Dispatch Logistics
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Radio styles
    const payOptions = content.querySelectorAll('.pay-opt');
    content.querySelectorAll('input[name="pay_method"]').forEach(radio => {
      radio.onchange = () => {
        payOptions.forEach(opt => opt.classList.replace('border-emerald-600', 'border-slate-200'));
        radio.closest('.pay-opt').classList.replace('border-slate-200', 'border-emerald-600');
      };
    });

    const confirmBtn = content.querySelector('#btn-confirm-pay');
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Authorizing Escrow Gateway...";

      try {
        // 1. Create order
        const createOrderRes = await API.createOrder({
          purchase_request_id: pr.id,
          listing_id: pr.listing_id,
          quantity: pr.requested_quantity,
          unit_price: pr.offer_price,
          delivery_method: pr.delivery_preference,
          delivery_city: "Guwahati",
          delivery_approx_area: content.querySelector('#chk-approx').value.trim(),
          delivery_exact_address: content.querySelector('#chk-exact').value.trim()
        });

        if (!createOrderRes.success) {
          throw new Error("Failed to create order");
        }

        const orderId = createOrderRes.order_id;
        const selectedMethod = content.querySelector('input[name="pay_method"]:checked').value;
        const vpa = content.querySelector('#vpa-input').value.trim();

        // 2. Process payment
        const payRes = await API.processPayment(orderId, selectedMethod, vpa);
        if (payRes.success) {
          Toast.show(`Payment of ₹${grandTotal} confirmed! Live logistics assigned.`, "success");
          window.location.hash = `#tracking/${payRes.order_number}`;
        }
      } catch (err) {
        Toast.show(err.message, "error");
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Pay ₹${grandTotal.toFixed(2)} & Dispatch Logistics`;
      }
    };

  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
