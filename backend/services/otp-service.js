const crypto = require('crypto');
const Otp = require('../models/otp-model');
const { sendOtpEmail } = require('./email-service');

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// Issue a fresh 6-digit code, replacing any earlier one for the same email and purpose
const issueOtp = async ({ email, name, purpose }) => {
  const existing = await Otp.findOne({ email, purpose });
  if (existing) {
    const secondsSinceSent = (Date.now() - existing.sentAt.getTime()) / 1000;
    if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
      const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceSent);
      return { status: 'cooldown', retryAfter, message: `Please wait ${retryAfter} seconds before requesting a new code` };
    }
  }

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  await Otp.findOneAndUpdate(
    { email, purpose },
    { codeHash: hashCode(code), attempts: 0, sentAt: new Date(), expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    return await sendOtpEmail({ email, name, code, expiresInMinutes: OTP_TTL_MINUTES });
  } catch (error) {
    console.error('OTP email failed:', error.message);
    return { status: 'failed', message: 'The verification email could not be sent' };
  }
};

// Returns { ok: true } on success, otherwise { ok: false, message }
const verifyOtp = async ({ email, purpose, code }) => {
  const otp = await Otp.findOne({ email, purpose });
  if (!otp || otp.expiresAt < new Date()) {
    return { ok: false, message: 'The code has expired. Please request a new one' };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: 'Too many incorrect attempts. Please request a new code' };
  }

  const expected = Buffer.from(otp.codeHash, 'hex');
  const received = Buffer.from(hashCode(String(code || '').trim()), 'hex');
  if (!crypto.timingSafeEqual(expected, received)) {
    otp.attempts += 1;
    await otp.save();
    const remaining = MAX_ATTEMPTS - otp.attempts;
    return { ok: false, message: remaining > 0 ? `Incorrect code. ${remaining} attempt(s) left` : 'Too many incorrect attempts. Please request a new code' };
  }

  await otp.deleteOne();
  return { ok: true };
};

module.exports = { issueOtp, verifyOtp, OTP_TTL_MINUTES };
