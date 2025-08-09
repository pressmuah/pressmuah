
export const handler = async (event) => {
  // TODO: Verify Stripe signature and parse event
  console.log('Stripe webhook received');
  return { statusCode: 200, body: 'ok' };
};
