import 'server-only'
import nodemailer from 'nodemailer'

export async function sendInvitationEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const user = process.env.GMAIL_SMTP_USER
  const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD
  if (!user || !appPassword) throw new Error('Gmail SMTP is not configured.')

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user, pass: appPassword },
  })
  await transporter.sendMail({ from: `NSTRU Vision <${user}>`, to, subject, html })
}
