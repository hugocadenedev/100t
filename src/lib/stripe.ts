import "server-only";

import Stripe from "stripe";

// Lazy singleton — the Stripe client is only created when first used at runtime,
// not at build time, to avoid module-load errors when env vars are absent.
let _client: Stripe | undefined;

function getClient(): Stripe {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "La variable d'environnement STRIPE_SECRET_KEY n'est pas définie.",
      );
    }
    _client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _client;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
