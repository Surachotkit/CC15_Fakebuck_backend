const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerSchema, loginSchema } = require("../validators/auth-validator");
const prisma = require("../models/prisma");
const createError = require("../utils/create-error");

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
    // สมัครเสร็จ login อัตโนมัติ
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
// login
exports.login = async (req, res, next) => {
  try {
    // value สิ่ง่ที่ return จาก validate
    const { value, error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    // console.log(value);
    // SELECT * FROM user WHERE email = emailOrMobile OR mobile = emailOrMobile //*1condition = 1el ของ array
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: value.emailOrMobile }, { mobile: value.emailOrMobile }],
      },
    });
    if (!user) {
      return next(createError("invalid credential", 400));
    }
    // return T or F  // ตรวจ hash
    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) {
      return next(createError("invalid credential", 400));
    }
    // ถ้า T ให้ gen token  // ทุกรอบที่ล็อคอินจะ gen token และเก็บไว้ใน localstorage
    const payload = { userId: user.id };
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY || "1q1w1w1we22e2ee2r33r",
      { expiresIn: process.env.JWT_EXPIRE }
    );
    // user คือ สิ่งที่ find มาใน table
    // ส่งค่าไปหน้าบ้าน { accessToken, user }

    // del pass ไม่ให้โชว์ใน component
    delete user.password;
    res.status(200).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res, next) => {
  res.status(200).json({ user: req.user });
};
