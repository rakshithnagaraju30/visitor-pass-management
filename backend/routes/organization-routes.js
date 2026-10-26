
const express = require("express");

const {
  registerOrganization, getPublicOrganizations,
} = require("../controllers/organization-controller");

const router = express.Router();

router.post("/register", registerOrganization);

router.get("/public", getPublicOrganizations);

module.exports = router;
