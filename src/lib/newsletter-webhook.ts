/**
 * Newsletter webhook integration
 * Sends subscription/unsubscription events to external webhook
 */

interface NewsletterWebhookData {
  type: 'subscribe' | 'unsubscribe';
  name: string;
  email: string;
}

const WEBHOOK_URL = 'https://hook.eu2.make.com/cihkqitnkkwd3lv6md151glodc2ahhdr';

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
        'x-make-apikey': process.env.WEBHOOK_API_KEY || '',
      },
      body: JSON.stringify({
        action: 'newsletter',
        type: data.type,
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

    console.log(
      `Newsletter webhook sent successfully: ${data.type} for ${data.email}`
    );
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
    type: 'subscribe',
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
    type: 'unsubscribe',
    name,
    email,
  });
}
