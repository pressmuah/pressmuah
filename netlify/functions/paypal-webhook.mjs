
export const handler = async (event) => {
  // TODO: Verify PayPal webhook and parse event
  console.log('PayPal webhook received');
  return { statusCode: 200, body: 'ok' };
};
