const PDFDocument = require('pdfkit');

const createPassPdfBuffer = (pass, visitor, appointment, host) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fontSize(20).text('VISITOR PASS', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Pass number: ${pass.passNumber}`);
  doc.text(`Visitor: ${visitor.name}`);
  doc.text(`Email: ${visitor.email || 'Not provided'}`);
  doc.text(`Phone: ${visitor.phone}`);
  doc.text(`Host: ${host?.name || 'Employee'}`);
  doc.text(`Purpose: ${appointment.purpose}`);
  doc.text(`Appointment: ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}`);
  doc.text(`Valid from: ${new Date(pass.validFrom).toLocaleString()}`);
  doc.text(`Valid until: ${new Date(pass.validUntil).toLocaleString()}`);
  doc.moveDown();
  doc.fontSize(9).text('Present this pass to Security at the entrance. Pass validity is subject to verification.', { align: 'center' });
  doc.end();
});

module.exports = { createPassPdfBuffer };
