// MS Barbers — create-setup-intent
// Deploy with: supabase functions deploy create-setup-intent
// Set the secret first:  supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//
// This is the ONE piece of the booking system that has to run on a server
// instead of in the browser: creating a Stripe SetupIntent requires Stripe's
// *secret* key, which must never be shipped in the site's public JS. This
// function holds that secret, and the browser only ever sees the short-lived
// "client secret" it hands back — never the account's real secret key, and
// never a card number (Stripe.js collects the card directly in the
// customer's browser and sends it straight to Stripe).
//
// What this does NOT do: charge the card. A SetupIntent only saves a payment
// method against the customer's Stripe Customer record for later use.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.9.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Identify the caller from their Supabase auth token — never trust a
    // user id passed in the request body, always derive it from the token.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reuse an existing Stripe customer for this user, or create one.
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id as string | null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", user.id);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: "off_session",
    });

    return new Response(JSON.stringify({ clientSecret: setupIntent.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Could not start card setup" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
