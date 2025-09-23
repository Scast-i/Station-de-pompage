// services/emailService.ts
export const sendEmail = async (to: string[], subject: string, text: string) => {
  console.log("📧 Email Preview:")
  console.log("To:", to)
  console.log("Subject:", subject)
  console.log("Body:", text)
  return true // Always return success for demo
}
