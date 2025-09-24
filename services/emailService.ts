// services/emailService.ts
export const sendAlertEmail = async (to: string[], subject: string, text: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log("📧 Email Preview:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", text);
    return;
  }
  
  // Envoi réel en production
  // ... code Nodemailer ...
};
