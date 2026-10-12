require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user-model');
const Organization = require('../models/organization-model');

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
      const organizationName = process.env.ADMIN_ORGANIZATION_NAME || 'Default Organization';
      const slug = organizationName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default-organization';
      const organization = await Organization.findOneAndUpdate(
        { slug },
        {
          name: organizationName,
          slug,
          type: process.env.ADMIN_ORGANIZATION_TYPE || 'other',
          email,
          status: 'active',
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      await User.create({ name: process.env.ADMIN_NAME, email, password, role: 'admin', organizationId: organization._id });
      console.log(`Admin created: ${email}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
