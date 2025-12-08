/**
 * Servicio de notificaciones para dominios personalizados
 * Envía notificaciones por email cuando se añade o verifica un dominio
 */

interface DomainNotificationData {
  userEmail: string;
  userName: string;
  domainId: string;
  domain: string;
  status: 'added' | 'verified';
}

/**
 * Envía una notificación por email al webhook de Make.com
 * @param data Datos del dominio y usuario para la notificación
 */
export async function sendDomainNotification(data: DomainNotificationData): Promise<void> {
  try {
    const webhookUrl = 'https://hook.eu2.make.com/cihkqitnkkwd3lv6md151glodc2ahhdr';
    
    // Map status to specific action
    const action = data.status === 'added' ? 'cus_domain_added' : 'cus_domain_verified';

    const payload = {
      action: action,
      userEmail: data.userEmail,
      userName: data.userName,
      domainId: data.domainId,
      domain: data.domain,
      status: data.status,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': process.env.WEBHOOK_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error sending domain notification:', {
        status: response.status,
        statusText: response.statusText,
        payload
      });
    } else {
      console.log('Domain notification sent successfully:', {
        action: action,
        domain: data.domain,
        userEmail: data.userEmail
      });
    }
  } catch (error) {
    console.error('Failed to send domain notification:', error, {
      payload: data
    });
    // No lanzamos el error para que no afecte el flujo principal
  }
}