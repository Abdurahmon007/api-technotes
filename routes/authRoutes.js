const express = require("express");
const router = express.Router();
const loginLimiter = require("../midlleware/loginLimiter.js");
const authController = require("../controllers/authController.js");
router.route("/").post(loginLimiter, authController.login);
router.route("/refresh").get(authController.refresh);
router.route("/logout").post(authController.logout);

module.exports = router;
