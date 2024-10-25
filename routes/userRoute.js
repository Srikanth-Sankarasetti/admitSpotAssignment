const express = require("express");
const {
  userRegister,
  verifyMail,
  userLogin,
  forgotPassword,
  resetPassword,
} = require("./../controllers/authController");

const { createUserValidation } = require("../mildlewares/userValidationError");

router = express.Router();

router.route("/register").post(createUserValidation, userRegister);

router.route("/register/:id").post(verifyMail);

router.route("/login").post(userLogin);

router.route("/forgetPassword").post(forgotPassword);
router.route("/forgetPassword/:id").post(resetPassword);

module.exports = router;
