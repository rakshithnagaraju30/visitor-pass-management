const nodemailer = require('nodemailer');
const { createPassPdfBuffer } = require('./pass-document-service');

const sendVisitorPassEmail = async ({ pass, visitor, appointment, host }) => {
  if (!visitor.email) return { status: 'skipped_no_email', message: 'Visitor has no email address' };
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    return { status: 'not_configured', message: 'SMTP settings are missing; configure SMTP to send email' };
  }

  const pdf = await createPassPdfBuffer(pass, visitor, appointment, host);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    requireTLS: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  await transporter.sendMail({
    from: MAIL_FROM,
    to: visitor.email,
    subject: `Your visitor pass: ${pass.passNumber}`,
    text: `Hello ${visitor.name},\n\nYour visitor pass ${pass.passNumber} is ready. Please find the PDF pass attached and present it to Security when you arrive.\n\nHost: ${host?.name || 'Employee'}\nPurpose: ${appointment.purpose}\nAppointment: ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}\n`,
    attachments: [{ filename: `${pass.passNumber}.pdf`, content: pdf }],
  });
  return { status: 'sent', message: 'Pass email sent successfully' };
};
module.exports = { sendVisitorPassEmail };
