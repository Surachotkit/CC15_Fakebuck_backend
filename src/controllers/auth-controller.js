const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerSchema } = require("../validators/auth-validator");
const prisma = require("../models/prisma");

exports.register = async (req, res, next) => {
  try {
    //validate
    const { value, error } = registerSchema.validate(req.body);

    if (error) {
      return next(error);
    }
    value.password = await bcrypt.hash(value.password, 12);
    // ได้จาก body
    const user = await prisma.user.create({
      // data == value
      data: value,
    });
    const payload = { userId: user.id };
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY || "1q1w1w1we22e2ee2r33r",
      { expiresIn: process.env.JWT_EXPIRE }
    );
    res.status(201).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // const result = loginSchema.validate(req.body)
  } catch (err) {
    next(err);
  }
};
