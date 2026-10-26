const crypto = require('crypto');
const QRCode = require('qrcode');
const Pass = require('../models/pass-model');
const { sendVisitorPassEmail } = require('./email-service');

// Create an active pass with a QR code for an approved appointment, then try to email it.
// Email delivery is best-effort and must not block pass issuance.
const issuePassForAppointment = async ({ appointment, visitor, host, organizationId }) => {
  const passNumber = `VPM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const validFrom = new Date(appointment.appointmentDate);
  const [hours, minutes] = String(appointment.appointmentTime || '').split(':').map(Number);
  if (Number.isFinite(hours) && Number.isFinite(minutes)) validFrom.setHours(hours, minutes, 0, 0);
  const validUntil = new Date(validFrom.getTime() + 8 * 60 * 60 * 1000);

  const qrPayload = JSON.stringify({ passNumber, appointmentId: String(appointment._id) });
  const qrCode = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', margin: 1, width: 280 });

  const pass = await Pass.create({
    visitor: visitor._id,
    organizationId,
    appointment: appointment._id,
    passNumber,
    qrCode,
    pdfUrl: `/api/passes/${passNumber}/pdf`,
    validFrom,
    validUntil,
    status: 'active',
    issuedBy: host._id,
    emailStatus: 'pending',
  });

  let email;
  try {
    email = await sendVisitorPassEmail({ pass, visitor, appointment, host });
  } catch (emailError) {
    email = { status: 'failed', message: emailError.message };
  }
  pass.emailStatus = email.status;
  await pass.save();

  return { pass, email };
};

module.exports = { issuePassForAppointment };
