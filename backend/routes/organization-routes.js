
const express = require("express");

const {
  registerOrganization,
} = require("../controllers/organization-controller");

const router = express.Router();

router.post("/register", registerOrganization);

module.exports = router;
