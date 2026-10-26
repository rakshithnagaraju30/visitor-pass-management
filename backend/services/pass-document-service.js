
// const PDFDocument = require("pdfkit");
// const QRCode = require("qrcode");

// const createPassPdfBuffer = async (
//   pass,
//   visitor,
//   appointment,
//   host
// ) => {
//   // QR data for backend pass verification
//   const qrData = JSON.stringify({
//     passId: pass._id.toString(),
//     passNumber: pass.passNumber,
//   });

//   const qrBuffer = await QRCode.toBuffer(qrData, {
//     type: "png",
//     width: 300,
//     margin: 2,
//     errorCorrectionLevel: "M",
//   });

//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({
//       size: "A5",
//       margin: 36,
//     });

//     const chunks = [];

//     doc.on("data", (chunk) => chunks.push(chunk));
//     doc.on("end", () => resolve(Buffer.concat(chunks)));
//     doc.on("error", reject);

//     doc.fontSize(20).text("VISITOR PASS", {
//       align: "center",
//     });

//     doc.moveDown(0.5);
//     doc.fontSize(12).text(`Pass number: ${pass.passNumber}`);
//     doc.text(`Visitor: ${visitor.name}`);
//     doc.text(`Email: ${visitor.email || "Not provided"}`);
//     doc.text(`Phone: ${visitor.phone}`);
//     doc.text(`Host: ${host?.name || "Employee"}`);
//     doc.text(`Purpose: ${appointment.purpose}`);
//     doc.text(
//       `Appointment: ${new Date(
//         appointment.appointmentDate
//       ).toLocaleDateString()} at ${appointment.appointmentTime}`
//     );
//     doc.text(
//       `Valid from: ${new Date(pass.validFrom).toLocaleString()}`
//     );
//     doc.text(
//       `Valid until: ${new Date(pass.validUntil).toLocaleString()}`
//     );

//     doc.moveDown();

//     doc.fontSize(10).text("Scan QR code at Security", {
//       align: "center",
//     });

//     doc.moveDown(0.5);

//     // Center the QR code on the A5 page
//     const qrSize = 115;
//     const qrX = (doc.page.width - qrSize) / 2;
//     const qrY = doc.y;

//     doc.image(qrBuffer, qrX, qrY, {
//       width: qrSize,
//       height: qrSize,
//     });

//     doc.y = qrY + qrSize + 12;

//     doc.fontSize(9).text(
//       "Present this pass to Security at the entrance. " +
//         "Pass validity is subject to verification.",
//       { align: "center" }
//     );

//     doc.end();
//   });
// };

// module.exports = { createPassPdfBuffer };

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const createPassPdfBuffer = async (
  pass,
  visitor,
  appointment,
  host
) => {
  const qrData = JSON.stringify({
    passNumber: pass.passNumber,
    visitorId: visitor._id,
    appointmentId: appointment._id,
  });

  const qrBuffer = await QRCode.toBuffer(qrData, {
    type: "png",
    width: 180,
    margin: 1,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margin: 36,
    });

    const chunks = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    doc.fontSize(20).text(
      "VISITOR PASS",
      { align: "center" }
    );

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Pass Number: ${pass.passNumber}`);
    doc.text(`Visitor: ${visitor.name}`);
    doc.text(
      `Email: ${visitor.email || "Not provided"}`
    );
    doc.text(`Phone: ${visitor.phone || "Not provided"}`);

    doc.text(
      `Host: ${host?.name || "Employee"}`
    );

    doc.text(
      `Purpose: ${
        appointment.purpose ||
        appointment.reason ||
        "Not specified"
      }`
    );

    doc.text(
      `Appointment: ${new Date(
        appointment.appointmentDate
      ).toLocaleDateString()} at ${
        appointment.appointmentTime
      }`
    );

    doc.text(
      `Valid From: ${new Date(
        pass.validFrom
      ).toLocaleString()}`
    );

    doc.text(
      `Valid Until: ${new Date(
        pass.validUntil
      ).toLocaleString()}`
    );

    doc.moveDown();

    doc.fontSize(11).text(
      "Scan this QR code at the Security desk:",
      { align: "center" }
    );

    doc.moveDown();

    doc.image(
      qrBuffer,
      {
        fit: [150, 150],
        align: "center",
      }
    );

    doc.moveDown();

    doc.fontSize(9).text(
      "Present this pass to Security at the entrance.",
      { align: "center" }
    );

    doc.end();
  });
};

module.exports = {
  createPassPdfBuffer,
};
