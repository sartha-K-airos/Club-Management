// src/update-event-register.js
const fs = require('fs');
let html = fs.readFileSync('event-register.html', 'utf8');

// 1. Ensure Razorpay script in head
if (!html.includes('checkout.razorpay.com/v1/checkout.js')) {
  html = html.replace('</head>', '  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>\n</head>');
}

// 2. Make DOMContentLoaded async and await API.ready()
html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\n      DB.seed();",
  "document.addEventListener('DOMContentLoaded', async () => {\n      await API.ready();"
);
html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\r\n      DB.seed();",
  "document.addEventListener('DOMContentLoaded', async () => {\r\n      await API.ready();"
);

// 3. Replace the registration submission and payment functions
const oldSnippetStart = "// Handle Registration Form Submit";
const oldSnippetEnd = "function showConfirmedPass(reg, ev) {";

const newSnippet = `// Handle Registration Form Submit
      document.getElementById('eventRegForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const roll = document.getElementById('regRoll').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const dept = document.getElementById('regDept').value;
        const year = document.getElementById('regYear').value;
        const expectations = document.getElementById('regExpectations').value.trim();

        const currentUser = Auth.getCurrentUser();
        pendingFormData = {
          eventId: currentEvent.id,
          studentId: currentUser ? currentUser.id : 1,
          studentName: name,
          email: email,
          rollNo: roll,
          branch: dept,
          year: year,
          phone: phone,
          expectations: expectations
        };

        const isPaidEvent = !!(currentEvent && currentEvent.isPaid && currentEvent.price > 0);

        // If Paid Event: Initiate Order & Payment Gateway
        if (isPaidEvent) {
          const cardNameEl = document.getElementById('cardNameInput');
          if (cardNameEl) cardNameEl.value = name;
          await handlePaidPayment();
        } else {
          // Free Event: Direct Server Registration
          await handleFreeRegistration();
        }
      });
    });

    // ─── Real Payment Gateway & Registration Integration ──────────────────────
    let activeOrderId = null;

    async function handlePaidPayment() {
      const submitBtn = document.getElementById('submitRegBtn');
      UI.setButtonLoading(submitBtn, true);

      try {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            eventId: currentEvent.id,
            userId: pendingFormData.studentId
          })
        });

        const orderData = await orderRes.json();
        UI.setButtonLoading(submitBtn, false);

        if (!orderRes.ok) {
          UI.showToast(orderData.error || 'Failed to initialize payment gateway order.', 'error');
          return;
        }

        activeOrderId = orderData.orderId;

        // If real Razorpay key is configured and Razorpay library is loaded
        if (!orderData.isDemo && typeof Razorpay !== 'undefined') {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'MITS StudentHub',
            description: \`Event Pass: \${currentEvent.title}\`,
            order_id: orderData.orderId,
            handler: async function (response) {
              await verifyAndCompletePayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentMethod: 'Razorpay Online Gateway'
              });
            },
            prefill: {
              name: pendingFormData.studentName,
              email: pendingFormData.email,
              contact: pendingFormData.phone
            },
            theme: { color: '#4a1c84' }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        } else {
          // Open interactive test payment gateway modal
          openPayModal();
        }
      } catch (err) {
        UI.setButtonLoading(submitBtn, false);
        UI.showToast('Payment initialization error. Check connection.', 'error');
      }
    }

    function openPayModal() {
      const modal = document.getElementById('payModal');
      modal.style.display = 'flex';
    }

    function closePayModal() {
      const modal = document.getElementById('payModal');
      modal.style.display = 'none';
      document.getElementById('payProcessingOverlay').style.display = 'none';
    }

    function switchPayTab(tab) {
      selectedPayMethod = tab;
      document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(\`tabBtn\${tab.charAt(0).toUpperCase() + tab.slice(1)}\`).classList.add('active');

      document.getElementById('tabContentUpi').style.display = tab === 'upi' ? 'block' : 'none';
      document.getElementById('tabContentCard').style.display = tab === 'card' ? 'block' : 'none';
      document.getElementById('tabContentNet').style.display = tab === 'net' ? 'block' : 'none';
    }

    function selectBank(el, name) {
      document.querySelectorAll('.bank-pill').forEach(p => p.classList.remove('selected'));
      el.classList.add('selected');
      selectedBankName = name;
    }

    async function processPayment() {
      if (!pendingFormData) return;

      const overlay = document.getElementById('payProcessingOverlay');
      overlay.style.display = 'flex';

      let methodDesc = 'UPI';
      if (selectedPayMethod === 'upi') {
        const upiId = document.getElementById('upiIdInput').value.trim() || 'student@okhdfcbank';
        methodDesc = \`UPI (\${upiId})\`;
      } else if (selectedPayMethod === 'card') {
        const num = document.getElementById('cardNumberInput').value.trim();
        const last4 = num.slice(-4) || '8892';
        methodDesc = \`Card (•••• \${last4})\`;
      } else if (selectedPayMethod === 'net') {
        const otherBank = document.getElementById('bankSelectDropdown').value;
        methodDesc = \`Net Banking (\${otherBank || selectedBankName})\`;
      }

      setTimeout(async () => {
        closePayModal();
        const fakePaymentId = \`pay_\${Math.random().toString(36).substring(2, 12)}\`;
        await verifyAndCompletePayment({
          razorpay_order_id: activeOrderId || \`order_test_\${Date.now()}\`,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: 'VERIFIED',
          paymentMethod: methodDesc
        });
      }, 1000);
    }

    async function verifyAndCompletePayment(gatewayResult) {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            razorpay_order_id: gatewayResult.razorpay_order_id,
            razorpay_payment_id: gatewayResult.razorpay_payment_id,
            razorpay_signature: gatewayResult.razorpay_signature,
            registrationData: {
              ...pendingFormData,
              amountPaid: currentEvent.price,
              paymentMethod: gatewayResult.paymentMethod
            }
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          UI.showToast(data.error || 'Payment verification failed.', 'error');
          return;
        }

        UI.showToast(\`🎉 Payment of ₹\${currentEvent.price} verified! Entry pass issued.\`, 'success');
        showConfirmedPass(data.registration, currentEvent, data.qrDataUrl);
      } catch (e) {
        UI.showToast('Verification request failed. Contact administration.', 'error');
      }
    }

    async function handleFreeRegistration() {
      const submitBtn = document.getElementById('submitRegBtn');
      UI.setButtonLoading(submitBtn, true);

      try {
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            ...pendingFormData,
            isPaid: false,
            amountPaid: 0,
            paymentStatus: 'FREE',
            paymentMethod: 'Complimentary Free Pass'
          })
        });

        const data = await res.json();
        UI.setButtonLoading(submitBtn, false);

        if (!res.ok) {
          UI.showToast(data.error || 'Registration failed.', 'info');
          if (data.registration) {
            showConfirmedPass(data.registration, currentEvent, data.qrDataUrl);
          }
          return;
        }

        UI.showToast('🎉 Free registration confirmed! Entry pass generated.', 'success');
        showConfirmedPass(data.registration, currentEvent, data.qrDataUrl);
      } catch (err) {
        UI.setButtonLoading(submitBtn, false);
        UI.showToast('Failed to complete registration.', 'error');
      }
    }

    function showConfirmedPass(reg, ev, serverQrUrl) {`;

const startIndex = html.indexOf(oldSnippetStart);
const endIndex = html.indexOf(oldSnippetEnd) + oldSnippetEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  html = html.substring(0, startIndex) + newSnippet + html.substring(endIndex);
  
  // Update QR image assignment in showConfirmedPass
  html = html.replace(
    "document.getElementById('passQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrPayload)}`;",
    "if (serverQrUrl) {\n        document.getElementById('passQrImg').src = serverQrUrl;\n      } else {\n        document.getElementById('passQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(reg.passToken || reg.registrationCode)}`;\n      }"
  );

  fs.writeFileSync('event-register.html', html, 'utf8');
  console.log('event-register.html updated successfully with real payment & QR code generation');
} else {
  console.error('Could not find anchor points in event-register.html');
}

