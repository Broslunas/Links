'use server';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isLoggedIn: boolean;
  userId: string | null;
}

export async function submitContactForm(data: ContactFormData) {
  const webhookUrl = 'https://n8n.broslunas.com/webhook/contacto';

  const payload = {
    referer: 'brl.links',
    ...data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error sending contact webhook:', response.status, response.statusText);
      return { success: false, error: 'Failed to send message' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in contact server action:', error);
    return { success: false, error: 'Internal server error' };
  }
}
