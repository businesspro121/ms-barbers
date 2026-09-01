// MS Barbers — public configuration
//
// These are all PUBLIC keys — safe to ship in client-side JS, the same way
// every website with Google Sign-In or Stripe does it. The Supabase anon key
// only works within the Row Level Security rules in supabase/schema.sql
// (a user can only ever see/edit their own rows). The Stripe key here is the
// *publishable* key, not the secret key — it can only be used to collect
// card details, never to charge or read anything.
//
// Fill these in after you've created your Supabase project and Stripe
// account — see README.md "Setting up accounts and logins" for exact steps.

window.MS_BARBERS_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  STRIPE_PUBLISHABLE_KEY: "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY",
  SUPABASE_FUNCTIONS_URL: "https://YOUR-PROJECT.supabase.co/functions/v1",
};
