const nodemailer = require('nodemailer');
const { createPassPdfBuffer } = require('./pass-document-service');

const isSmtpConfigured = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && MAIL_FROM);
};

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

const sendVisitorPassEmail = async ({ pass, visitor, appointment, host }) => {
  if (!visitor.email) return { status: 'skipped_no_email', message: 'Visitor has no email address' };
  if (!isSmtpConfigured()) {
    return { status: 'not_configured', message: 'SMTP settings are missing; configure SMTP to send email' };
  }

  const pdf = await createPassPdfBuffer(pass, visitor, appointment, host);
  await createTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: visitor.email,
    subject: `Your visitor pass: ${pass.passNumber}`,
    text: `Hello ${visitor.name},\n\nYour visitor pass ${pass.passNumber} is ready. Please find the PDF pass attached and present it to Security when you arrive.\n\nHost: ${host?.name || 'Employee'}\nPurpose: ${appointment.purpose}\nAppointment: ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}\n`,
    attachments: [{ filename: `${pass.passNumber}.pdf`, content: pdf }],
  });
  return { status: 'sent', message: 'Pass email sent successfully' };
};

const sendOtpEmail = async ({ email, name, code, expiresInMinutes }) => {
  if (!isSmtpConfigured()) {
    // Without SMTP the code is only printed to the server log, which keeps local development usable
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_OTP_CODES === 'true') {
      console.log(`[OTP] Verification code for ${email}: ${code}`);
      return { status: 'logged', message: 'SMTP is not configured; the code was written to the server log' };
    }
    return { status: 'not_configured', message: 'SMTP settings are missing; configure SMTP to send email' };
  }

  await createTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `Your verification code: ${code}`,
    text: `Hello ${name || 'there'},\n\nYour Visitor Pass verification code is ${code}.\nIt expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can ignore this email.\n`,
  });
  return { status: 'sent', message: 'Verification code sent' };
};

module.exports = { sendVisitorPassEmail, sendOtpEmail };
