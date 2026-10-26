const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const Organization = require('../models/organization-model');
const { issueOtp, verifyOtp } = require('../services/otp-service');

const OTP_PURPOSE = 'visitor-registration';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const visitorSession = (user) => ({
  token: jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' }),
  user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
});

const otpResponse = (otpResult) => ({
  delivery: otpResult.status,
  deliveryMessage: otpResult.message,
  ...(otpResult.retryAfter ? { retryAfter: otpResult.retryAfter } : {}),
});

const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const organizationSlug = String(req.body.organizationSlug || '').trim().toLowerCase();
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    if (user.role === 'visitor') {
      if (user.emailVerified === false) {
        const otpResult = await issueOtp({ email, name: user.name, purpose: OTP_PURPOSE });
        return res.status(403).json({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address. We sent you a verification code.',
          email,
          ...otpResponse(otpResult),
        });
      }
      return res.json({ message: 'Login successful', ...visitorSession(user) });
    }
    if (!user.organizationId) return res.status(403).json({ message: 'This account is not assigned to an organization' });
    const organization = await Organization.findById(user.organizationId).select('name slug type status');
    if (!organization || organization.status !== 'active') return res.status(403).json({ message: 'This organization is inactive or suspended' });
    if (organizationSlug && organization.slug !== organizationSlug) {
      return res.status(401).json({ message: 'The account does not belong to that organization' });
    }
    const token = jwt.sign({ userId: user._id, organizationId: user.organizationId.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, organizationId: user.organizationId },
      organization,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const registerVisitor = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone and password are required' });
    }
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Emails are unique across all accounts, including staff
    const existingUser = await User.findOne({ email });
    if (existingUser && !(existingUser.role === 'visitor' && existingUser.emailVerified === false)) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let visitor;
    if (existingUser) {
      // Registration was started but never verified; let the visitor start over with new details
      existingUser.name = name;
      existingUser.phone = phone;
      existingUser.password = hashedPassword;
      visitor = await existingUser.save();
    } else {
      visitor = await User.create({ name, email, phone, password: hashedPassword, role: 'visitor', emailVerified: false });
    }

    const otpResult = await issueOtp({ email, name, purpose: OTP_PURPOSE });

    return res.status(201).json({
      message: 'Registration started. Enter the verification code sent to your email.',
      email: visitor.email,
      ...otpResponse(otpResult),
    });
  } catch (error) {
    console.error('Visitor registration error:', error);
    return res.status(500).json({ message: 'Server error during visitor registration' });
  }
};

const verifyVisitorOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: 'Email and a 6-digit code are required' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured' });

    const user = await User.findOne({ email, role: 'visitor' });
    if (!user) return res.status(404).json({ message: 'No visitor registration found for this email' });
    if (user.emailVerified !== false) return res.status(400).json({ message: 'This email is already verified. Please log in' });

    const result = await verifyOtp({ email, purpose: OTP_PURPOSE, code: otp });
    if (!result.ok) return res.status(400).json({ message: result.message });

    user.emailVerified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully', ...visitorSession(user) });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: 'Unable to verify the code' });
  }
};

const resendVisitorOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email, role: 'visitor' });
    if (!user) return res.status(404).json({ message: 'No visitor registration found for this email' });
    if (user.emailVerified !== false) return res.status(400).json({ message: 'This email is already verified. Please log in' });

    const otpResult = await issueOtp({ email, name: user.name, purpose: OTP_PURPOSE });
    if (otpResult.status === 'cooldown') return res.status(429).json({ message: otpResult.message, retryAfter: otpResult.retryAfter });

    return res.json({ message: 'A new verification code has been sent', ...otpResponse(otpResult) });
  } catch (error) {
    console.error('OTP resend error:', error);
    return res.status(500).json({ message: 'Unable to resend the code' });
  }
};

const me = (req, res) => res.json({ user: req.user });
module.exports = { registerVisitor, verifyVisitorOtp, resendVisitorOtp, login, me };
