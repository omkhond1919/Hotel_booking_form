
let selectedRoom = null;
let roomPrice    = 0;


const today    = new Date().toISOString().split("T")[0];
const checkin  = document.getElementById("checkin");
const checkout = document.getElementById("checkout");

checkin.setAttribute("min", today);
checkout.setAttribute("min", today);

checkin.addEventListener("change", () => {
  checkout.value = "";
  checkout.setAttribute("min", checkin.value);
});


function selectRoom(name, price) {
  selectedRoom = name;
  roomPrice    = price;
  document.querySelectorAll(".room-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("card-" + name).classList.add("selected");
  document.getElementById("roomError").textContent = "";
}


function clearErrors(...ids) {
  ids.forEach(id => {
    document.getElementById(id)?.classList.remove("input-error");
    const err = document.getElementById(id + "Error");
    if (err) err.textContent = "";
  });
}

function setError(id, msg) {
  document.getElementById(id)?.classList.add("input-error");
  const err = document.getElementById(id + "Error");
  if (err) err.textContent = msg;
  return true;
}


function validateStep(step) {
  let hasError = false;

  if (step === 1) {
    clearErrors("fullname", "email", "phone");
    if (!document.getElementById("fullname").value.trim())
      hasError = setError("fullname", "Full name is required.");
    const email = document.getElementById("email").value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      hasError = setError("email", "Enter a valid email.");
    if (document.getElementById("phone").value.replace(/\D/g, "").length < 10)
      hasError = setError("phone", "Enter a valid 10-digit number.");
  }

  if (step === 2) {
    clearErrors("checkin", "checkout", "guests");
    if (!selectedRoom) {
      document.getElementById("roomError").textContent = "Please select a room type.";
      hasError = true;
    }
    const ci = checkin.value, co = checkout.value;
    if (!ci) hasError = setError("checkin", "Select a check-in date.");
    if (!co) hasError = setError("checkout", "Select a check-out date.");
    if (ci && co && new Date(co) <= new Date(ci))
      hasError = setError("checkout", "Must be after check-in.");
    const g = document.getElementById("guests").value;
    if (!g || g < 1 || g > 10)
      hasError = setError("guests", "Between 1 and 10.");
  }

  return !hasError;
}


function goToStep(n) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById("step" + n).classList.add("active");

  ["seg1", "seg2", "seg3"].forEach((id, i) => {
    const seg = document.getElementById(id);
    seg.classList.remove("active", "done");
    if (i + 1 < n)      seg.classList.add("done");
    else if (i + 1 === n) seg.classList.add("active");
  });
}

function nextStep(from) {
  if (!validateStep(from)) return;
  if (from === 2) buildSummary();
  goToStep(from + 1);
}

function prevStep(from) {
  goToStep(from - 1);
}


function fmt(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}

function nightCount() {
  const ci = checkin.value, co = checkout.value;
  if (!ci || !co) return 0;
  return Math.round((new Date(co) - new Date(ci)) / 86400000);
}

function genBookingId() {
  return "HB-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Date.now().toString().slice(-4);
}


function buildSummary() {
  const nights = nightCount();
  const total  = nights * roomPrice;

  const rows = [
    ["Guest",     document.getElementById("fullname").value.trim()],
    ["Email",     document.getElementById("email").value.trim()],
    ["Room",      selectedRoom],
    ["Check-in",  fmt(checkin.value)],
    ["Check-out", fmt(checkout.value)],
    ["Duration",  nights + " night" + (nights !== 1 ? "s" : "")],
    ["Guests",    document.getElementById("guests").value],
  ];

  const requests = document.getElementById("requests").value.trim();
  if (requests) rows.push(["Requests", requests]);

  document.getElementById("summaryBlock").innerHTML =
    rows.map(([k, v]) =>
      `<div class="summary-row"><span class="key">${k}</span><span class="val">${v}</span></div>`
    ).join("") +
    `<div class="summary-row total">
       <span class="key">Total Estimate</span>
       <span class="val">₹${total.toLocaleString('en-IN')}</span>
     </div>`;
}


function closeSuccess() {
  document.getElementById("successOverlay").classList.remove("visible");
  selectedRoom = null;
  roomPrice    = 0;
  document.querySelectorAll(".room-card").forEach(c => c.classList.remove("selected"));
  goToStep(1);
}


document.getElementById("bookingForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const btn    = document.getElementById("submitBtn");
  btn.textContent = "Processing…";
  btn.disabled    = true;

  setTimeout(() => {
    const nights = nightCount();
    const total  = nights * roomPrice;
    const bId    = genBookingId();

    document.getElementById("bookingId").textContent = bId;

    document.getElementById("successDetails").innerHTML = [
      ["Guest",    document.getElementById("fullname").value.trim()],
      ["Room",     selectedRoom + " Room"],
      ["Check-in", fmt(checkin.value)],
      ["Check-out",fmt(checkout.value)],
      ["Nights",   nights],
      ["Total",    "₹" + total.toLocaleString('en-IN')],
    ].map(([k, v]) =>
      `<div class="success-detail-row"><span class="k">${k}</span><span class="v">${v}</span></div>`
    ).join("");

    this.reset();
    btn.textContent = "Confirm Booking";
    btn.disabled    = false;

    document.getElementById("successOverlay").classList.add("visible");
  }, 1400);
});
