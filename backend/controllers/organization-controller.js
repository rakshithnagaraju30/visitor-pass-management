
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Organization = require("../models/organization-model");
const User = require("../models/user-model");

const createSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const registerOrganization = async (req, res) => {
  const { organizationName, organizationType, name, email, password } =
    req.body;

  if (
    !organizationName?.trim() ||
    !organizationType ||
    !name?.trim() ||
    !email?.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "All registration fields are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured' });
  }

  const allowedTypes = [
    "school",
    "office",
    "government",
    "hospital",
    "other",
  ];

  if (!allowedTypes.includes(organizationType)) {
    return res.status(400).json({
      message: "Invalid organization type",
    });
  }

  let session;

  try {
    // Check before starting the transaction for a clear response.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const baseSlug = createSlug(organizationName);

    if (!baseSlug) {
      return res.status(400).json({
        message: "Please provide a valid organization name",
      });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Ensure each organization has a unique slug.
    let slug = baseSlug;
    let suffix = 1;

    while (
      await Organization.exists({ slug }).session(session)
    ) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const [organization] = await Organization.create(
      [
        {
          name: organizationName.trim(),
          slug,
          type: organizationType,
          email: normalizedEmail,
        },
      ],
      { session }
    );

    // The role is assigned by the backend, never by req.body.
    const [admin] = await User.create(
      [
        {
          name: name.trim(),
          email: normalizedEmail,
          password: passwordHash,
          role: "admin",
          organizationId: organization._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const token = jwt.sign(
      {
        userId: admin._id.toString(),
        organizationId: organization._id.toString(),
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Organization and admin account created successfully",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        organizationId: organization._id,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type,
        status: organization.status,
      },
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account or organization identifier already exists",
      });
    }

    console.error("Organization registration failed:", error);

    return res.status(500).json({
      message: "Unable to register organization",
    });
  } finally {
    await session?.endSession();
  }
};

module.exports = { registerOrganization };
