import { CriticalAlert } from './notification-service';

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export interface EmailConfig {
    enabled: boolean;
    adminEmails: string[];
    fromEmail: string;
    smtpConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
}

class EmailNotificationService {
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        this.config = config;
    }

    // Generate email template for critical warning
    private generateCriticalWarningTemplate(alert: CriticalAlert): EmailTemplate {
        const { userId, message, metadata } = alert;

        return {
            subject: `🚨 Critical Warning Alert - User ${userId}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚨 Critical Warning Alert</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #dc2626;">Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Message:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${message}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${alert.timestamp.toISOString()}</td>
              </tr>
              ${metadata?.warningId ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Warning ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata.warningId}</td>
              </tr>
              ` : ''}
              ${metadata?.category ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata.category}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
              <p style="margin: 0; color: #991b1b;">
                <strong>Action Required:</strong> This critical warning requires immediate admin attention. 
                Please review the user's account and take appropriate action.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/admin/users/${userId}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review User Account
              </a>
            </div>
          </div>
        </div>
      `,
            text: `
🚨 CRITICAL WARNING ALERT

User ID: ${userId}
Message: ${message}
Timestamp: ${alert.timestamp.toISOString()}
${metadata?.warningId ? `Warning ID: ${metadata.warningId}\n` : ''}
${metadata?.category ? `Category: ${metadata.category}\n` : ''}

ACTION REQUIRED: This critical warning requires immediate admin attention.
Please review the user's account at: ${process.env.NEXTAUTH_URL}/admin/users/${userId}
      `.trim(),
        };
    }

    // Generate email template for warning threshold
    private generateWarningThresholdTemplate(alert: CriticalAlert): EmailTemplate {
        const { userId, message, metadata } = alert;
        const severity = metadata?.threshold === 'critical' ? 'Critical' : 'High';

        return {
            subject: `⚠️ ${severity} Warning Threshold Alert - User ${userId}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${severity === 'Critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ ${severity} Warning Threshold Alert</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: ${severity === 'Critical' ? '#dc2626' : '#f59e0b'};">Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Total Warnings:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata?.totalCount || 'N/A'}</td>
              </tr>
              ${metadata?.criticalCount ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Critical Warnings:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata.criticalCount}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${alert.timestamp.toISOString()}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: ${severity === 'Critical' ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${severity === 'Critical' ? '#dc2626' : '#f59e0b'};">
              <p style="margin: 0; color: ${severity === 'Critical' ? '#991b1b' : '#92400e'};">
                <strong>Recommendation:</strong> ${message}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/admin/users/${userId}" 
                 style="background-color: ${severity === 'Critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review User Warnings
              </a>
            </div>
          </div>
        </div>
      `,
            text: `
⚠️ ${severity.toUpperCase()} WARNING THRESHOLD ALERT

User ID: ${userId}
Total Warnings: ${metadata?.totalCount || 'N/A'}
${metadata?.criticalCount ? `Critical Warnings: ${metadata.criticalCount}\n` : ''}
Timestamp: ${alert.timestamp.toISOString()}

RECOMMENDATION: ${message}
Review user warnings at: ${process.env.NEXTAUTH_URL}/admin/users/${userId}
      `.trim(),
        };
    }

    // Generate email template for suspicious activity
    private generateSuspiciousActivityTemplate(alert: CriticalAlert): EmailTemplate {
        const { userId, message, metadata } = alert;

        return {
            subject: `🔍 Suspicious Activity Alert - User ${userId}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🔍 Suspicious Activity Alert</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #7c3aed;">Activity Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Activity:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata?.activityType || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Active Warnings:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata?.warningCount || 0}</td>
              </tr>
              ${metadata?.criticalWarnings ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Critical Warnings:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata.criticalWarnings}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${alert.timestamp.toISOString()}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #7c3aed;">
              <p style="margin: 0; color: #374151;">
                <strong>Alert:</strong> ${message}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/admin/users/${userId}" 
                 style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Investigate Activity
              </a>
            </div>
          </div>
        </div>
      `,
            text: `
🔍 SUSPICIOUS ACTIVITY ALERT

User ID: ${userId}
Activity: ${metadata?.activityType || 'Unknown'}
Active Warnings: ${metadata?.warningCount || 0}
${metadata?.criticalWarnings ? `Critical Warnings: ${metadata.criticalWarnings}\n` : ''}
Timestamp: ${alert.timestamp.toISOString()}

ALERT: ${message}
Investigate at: ${process.env.NEXTAUTH_URL}/admin/users/${userId}
      `.trim(),
        };
    }

    // Generate email template for disabled user access attempt
    private generateDisabledAccessTemplate(alert: CriticalAlert): EmailTemplate {
        const { userId, message, metadata } = alert;

        return {
            subject: `🚫 Disabled User Access Attempt - User ${userId}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚫 Disabled User Access Attempt</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #ef4444;">Access Attempt Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userId}</td>
              </tr>
              ${metadata?.userEmail ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata.userEmail}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Attempt Type:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${metadata?.attemptType || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${alert.timestamp.toISOString()}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b;">
                <strong>Security Alert:</strong> ${message}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/admin/users/${userId}" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review User Account
              </a>
            </div>
          </div>
        </div>
      `,
            text: `
🚫 DISABLED USER ACCESS ATTEMPT

User ID: ${userId}
${metadata?.userEmail ? `Email: ${metadata.userEmail}\n` : ''}
Attempt Type: ${metadata?.attemptType || 'Unknown'}
Timestamp: ${alert.timestamp.toISOString()}

SECURITY ALERT: ${message}
Review account at: ${process.env.NEXTAUTH_URL}/admin/users/${userId}
      `.trim(),
        };
    }

    // Generate email template based on alert type
    generateEmailTemplate(alert: CriticalAlert): EmailTemplate {
        switch (alert.type) {
            case 'critical_warning':
                return this.generateCriticalWarningTemplate(alert);
            case 'warning_threshold':
                return this.generateWarningThresholdTemplate(alert);
            case 'suspicious_activity':
                return this.generateSuspiciousActivityTemplate(alert);
            case 'disabled_access_attempt':
                return this.generateDisabledAccessTemplate(alert);
            default:
                throw new Error(`Unknown alert type: ${alert.type}`);
        }
    }

    // Send email notification (placeholder - implement with your email service)
    async sendEmailNotification(alert: CriticalAlert): Promise<boolean> {
        if (!this.config.enabled || this.config.adminEmails.length === 0) {
            return false;
        }

        try {
            const template = this.generateEmailTemplate(alert);

            // TODO: Implement actual email sending logic here
            // This could use nodemailer, SendGrid, AWS SES, etc.
            console.log('Email notification would be sent:', {
                to: this.config.adminEmails,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });

            // For now, just log the email content
            return true;
        } catch (error) {
            console.error('Failed to send email notification:', error);
            return false;
        }
    }

    // Update email configuration
    updateConfig(newConfig: Partial<EmailConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current configuration
    getConfig(): EmailConfig {
        return { ...this.config };
    }
}

export default EmailNotificationService;