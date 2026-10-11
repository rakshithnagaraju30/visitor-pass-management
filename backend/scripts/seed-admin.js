require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user-model');

(async () => {
  try {
    if (!process.env.URL || !process.env.ADMIN_NAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('Set URL, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env before seeding.');
    }
    const { setServers } = require("node:dns");
    setServers(["8.8.8.8", "1.1.1.1"]);
    
    await mongoose.connect(process.env.URL);
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
    } else {
      const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await User.create({ name: process.env.ADMIN_NAME, email, password, role: 'admin' });
      console.log(`Admin created: ${email}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
