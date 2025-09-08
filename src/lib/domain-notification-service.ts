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
    const webhookUrl = 'https://hook.eu2.make.com/orrmhmrb3lkol2yoz4vr3geng5enrw95';
    
    const payload = {
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
        status: data.status,
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