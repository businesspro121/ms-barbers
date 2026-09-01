// MS Barbers — booking page logic
// Talks directly to Supabase (auth + database) from the browser using the
// public anon key, which is safe to expose: every table it can touch is
// locked down by the Row Level Security policies in supabase/schema.sql, so
// a signed-in user can only ever read or write their own rows. The one
// operation that needs a real secret (creating a Stripe SetupIntent) is
// delegated to the create-setup-intent Edge Function instead of happening here.

const cfg = window.MS_BARBERS_CONFIG || {};
const isConfigured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT");

const notConfigured = document.getElementById("notConfigured");
const signedOutView = document.getElementById("signedOutView");
const signedInView = document.getElementById("signedInView");

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------------- Nav (same behavior as the rest of the site) ---------------- */
const nav = document.getElementById("nav");
const navBurger = document.getElementById("navBurger");
window.addEventListener("scroll", () => nav.classList.toggle("is-scrolled", window.scrollY > 20), { passive: true });
navBurger?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navBurger.setAttribute("aria-expanded", String(isOpen));
});

if (!isConfigured) {
  notConfigured.hidden = false;
} else {
  runApp();
}

async function runApp() {
  const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const stripe = window.Stripe ? window.Stripe(cfg.STRIPE_PUBLISHABLE_KEY) : null;
  let cardElement = null;
  let currentUser = null;

  const { data: { session } } = await supabase.auth.getSession();
  render(session?.user ?? null);

  supabase.auth.onAuthStateChange((_event, session) => render(session?.user ?? null));

  async function render(user) {
    currentUser = user;
    if (!user) {
      signedOutView.hidden = false;
      signedInView.hidden = true;
      return;
    }
    signedOutView.hidden = true;
    signedInView.hidden = false;
    await loadProfile(user);
    await loadCardStatus(user);
    await loadBookings(user);
  }

  /* ---------------- Sign in / sign up ---------------- */
  document.getElementById("googleSignInBtn").addEventListener("click", async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  });

  const authForm = document.getElementById("emailAuthForm");
  const authError = document.getElementById("authError");
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const action = e.submitter?.dataset.action || "signin";
    const email = authForm.email.value.trim();
    const password = authForm.password.value;
    authError.hidden = true;

    const { error } =
      action === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      authError.textContent = error.message;
      authError.hidden = false;
    }
  });

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
  });

  /* ---------------- Profile ---------------- */
  async function loadProfile(user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    document.getElementById("welcomeName").textContent = profile?.full_name
      ? `Welcome back, ${profile.full_name.split(" ")[0]}`
      : "Welcome";
    const form = document.getElementById("profileForm");
    form.full_name.value = profile?.full_name || "";
    form.age.value = profile?.age ?? "";
    form.preferred_cut_type.value = profile?.preferred_cut_type || "Classic Haircut";
  }

  const profileForm = document.getElementById("profileForm");
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const savedEl = document.getElementById("profileSaved");
    savedEl.hidden = true;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name.value.trim(),
        age: profileForm.age.value ? Number(profileForm.age.value) : null,
        preferred_cut_type: profileForm.preferred_cut_type.value,
      })
      .eq("id", currentUser.id);
    if (!error) {
      savedEl.hidden = false;
      document.getElementById("welcomeName").textContent = `Welcome back, ${profileForm.full_name.value.split(" ")[0]}`;
    }
  });

  /* ---------------- Card on file (Stripe, no charge) ---------------- */
  async function loadCardStatus(user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    const statusEl = document.getElementById("cardOnFileStatus");
    statusEl.textContent = profile?.stripe_customer_id
      ? "A card is on file for your account."
      : "No card saved yet.";
  }

  if (stripe) {
    const elements = stripe.elements();
    cardElement = elements.create("card", {
      style: { base: { color: "#faf9f7", fontFamily: "Montserrat, sans-serif", "::placeholder": { color: "#a8a29e" } } },
    });
    cardElement.mount("#cardElement");
  }

  document.getElementById("saveCardBtn").addEventListener("click", async () => {
    const cardError = document.getElementById("cardError");
    cardError.hidden = true;
    if (!stripe || !cardElement) {
      cardError.textContent = "Payments aren't set up yet.";
      cardError.hidden = false;
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${cfg.SUPABASE_FUNCTIONS_URL}/create-setup-intent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const { clientSecret, error: fnError } = await res.json();
    if (fnError || !clientSecret) {
      cardError.textContent = fnError || "Could not start card setup.";
      cardError.hidden = false;
      return;
    }
    const { error } = await stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardElement } });
    if (error) {
      cardError.textContent = error.message;
      cardError.hidden = false;
    } else {
      document.getElementById("cardOnFileStatus").textContent = "Card saved.";
    }
  });

  /* ---------------- Bookings ---------------- */
  const bookingForm = document.getElementById("bookingForm");
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("bookings").insert({
      user_id: currentUser.id,
      cut_type: bookingForm.cut_type.value,
      requested_at: new Date(bookingForm.requested_at.value).toISOString(),
      notes: bookingForm.notes.value.trim() || null,
    });
    if (!error) {
      bookingForm.reset();
      await loadBookings(currentUser);
    }
  });

  async function loadBookings(user) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false });

    const list = document.getElementById("bookingsList");
    const empty = document.getElementById("bookingsEmpty");
    list.innerHTML = "";

    if (!bookings || bookings.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    for (const booking of bookings) {
      const li = document.createElement("li");
      const when = new Date(booking.requested_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      li.innerHTML = `
        <span>${booking.cut_type} — ${when}</span>
        <span class="booking-status booking-status--${booking.status}">${booking.status}</span>
      `;
      list.appendChild(li);
    }
  }
}
