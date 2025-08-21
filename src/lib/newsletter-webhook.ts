/**
 * Newsletter webhook integration
 * Sends subscription/unsubscription events to external webhook
 */

interface NewsletterWebhookData {
  action: 'subscribe' | 'unsubscribe';
  name: string;
  email: string;
}

const WEBHOOK_URL =
  'https://hook.eu2.make.com/389gtp6bvdbnw877wgaihka8kr3ykssk';

/**
 * Sends newsletter subscription/unsubscription data to webhook
 * @param data - The subscription data to send
 * @returns Promise<boolean> - Success status
 */
export async function sendNewsletterWebhook(
  data: NewsletterWebhookData
): Promise<boolean> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: data.action,
        name: data.name,
        email: data.email,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(
        'Newsletter webhook failed:',
        response.status,
        response.statusText
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending newsletter webhook:', error);
    return false;
  }
}

/**
 * Helper function to send subscription webhook
 */
export async function sendSubscriptionWebhook(
  name: string,
  email: string
): Promise<boolean> {
  return sendNewsletterWebhook({
    action: 'subscribe',
    name,
    email,
  });
}

/**
 * Helper function to send unsubscription webhook
 */
export async function sendUnsubscriptionWebhook(
  name: string,
  email: string
): Promise<boolean> {
  return sendNewsletterWebhook({
    action: 'unsubscribe',
    name,
    email,
  });
}
