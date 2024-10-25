const pool = require("./../utils/dbconnect");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const catchAsync = require("./../mildlewares/catchAsync");
const sendMail = require("./../mildlewares/sendmail");
const AppError = require("./../mildlewares/appError");
const jwt = require("jsonwebtoken");

exports.routeProtector = catchAsync(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let jwtToken;
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    return next(new AppError("invalid JWT Token,please login again", 401));
  } else {
    jwt.verify(jwtToken, "srikanth", (err, payload) => {
      if (err) {
        return new AppError("invalid JWT Token, please login Again", 401);
      }
      req.id = payload.id;
      req.email = payload.email;
      next();
    });
  }
});

exports.userRegister = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await pool.query(`select * from users where email=$1`, [email]);
  if (user.rows.length > 0) {
    return next(new AppError("User Already Exits"), 404);
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verificationCode = await crypto.randomBytes(32).toString("hex");
  const hashedVerificationcode = await crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");
  const verificationCodeValidity = new Date(Date.now() + 1 * 60 * 60 * 1000);
  const query = `insert into users (name,email,password,verification_code,verification_code_validity) values ($1,$2,$3,$4,$5)`;
  await pool.query(query, [
    name,
    email,
    hashPassword,
    hashedVerificationcode,
    verificationCodeValidity,
  ]);
  const verificationLink = `http://localhost:3000/admitspot/assignment/${email}/${verificationCode}`;

  await sendMail({
    email: email,
    subject: "user register please verify your email",
    message: `Please verfy your mail by clicking this likn:${verificationLink}`,
  });

  res.status(200).send({
    status: "Success",
    message: "verification code sent to your mail please check your mail",
  });
});

exports.verifyMail = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { id } = req.params;
  const hashedVerficationCode = crypto
    .createHash("sha256")
    .update(id)
    .digest("hex");
  const user = await pool.query(
    `select * from users where email=$1 and verification_code=$2 and verification_code_validity > NOW()`,
    [email, hashedVerficationCode]
  );
  if (user.rows.length === 0) {
    return next(new AppError("invalid or expired verfication code", 400));
  }
  // Marking  email as verified
  const updateQuery =
    "UPDATE users SET email_verified = TRUE, verification_code = NULL,verification_code_validity=NULL WHERE email = $1";
  await pool.query(updateQuery, [email]);
  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

exports.userLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(password);
  const userVerification = await pool.query(
    `select * from users where email=$1`,
    [email]
  );
  if (userVerification.rows.length === 0) {
    return next(new AppError("user not found please sign up", 404));
  }
  const isPasswordMatch = await bcrypt.compare(
    password,
    userVerification.rows[0].password
  );
  if (!isPasswordMatch) {
    return next(new AppError("passowrd is not match please try again", 404));
  }
  const payload = {
    id: userVerification.rows[0].id,
    email: userVerification.rows[0].email,
  };
  const token = jwt.sign(payload, "srikanth");
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (result.rows.length === 0) {
    return next(new AppError("No user found with that email", 404));
  }
  const user = result.rows[0];

  // Generate a reset code
  const resetCode = crypto.randomBytes(32).toString("hex");
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Update user with reset code
  const query = "UPDATE users SET reset_code = $1 WHERE email = $2";
  await pool.query(query, [hashedResetCode, email]);

  // Send reset email
  const resetLink = `http://localhost:3000/api/v1/users/reset-password/${resetCode}`;
  await sendMail({
    email,
    subject: "Password Reset",
    message: `Reset your password by clicking the following link: ${resetLink}`,
  });

  res.status(200).json({
    status: "success",
    message: "Reset code sent to email",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const hashedResetCode = crypto.createHash("sha256").update(id).digest("hex");

  // Find user by reset code
  const result = await pool.query("SELECT * FROM users WHERE reset_code = $1", [
    hashedResetCode,
  ]);
  if (result.rows.length === 0) {
    return next(new AppError("Invalid reset code", 400));
  }

  // Hash the new password and update the user
  const hashPassword = await bcrypt.hash(newPassword, 12);
  const query =
    "UPDATE users SET password = $1, reset_code = NULL WHERE reset_code = $2";
  await pool.query(query, [hashPassword, hashedResetCode]);

  res.status(200).json({
    status: "success",
    message: "Password reset successful",
  });
});
