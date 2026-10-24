import nodemailer from 'nodemailer';

const required = ['SMTP_USER', 'SMTP_APP_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export async function sendAuthEmail({ to, subject, text, html }) {
  if (missing.length) {
    throw new Error(`Configuração SMTP ausente: ${missing.join(', ')}`);
  }
  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
