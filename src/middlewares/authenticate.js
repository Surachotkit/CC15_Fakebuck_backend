const createError = require("../utils/create-error");
const jwt = require("jsonwebtoken");
const prisma = require("../models/prisma");

module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    // ถ้าไม่มีค่า (ไม่ได้ส่งสิ่งที่ยืนยันตัวตนมา) หรือ  ขึ้นต้นด้วย Bearer
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(createError("unauthenicated", 401));
    }
    // Bearer xxxxxxx
    // ตัว [0] จะเป็น string เปล่า ตัวหลังจะเป็นก้อน token
    const token = authorization.split(" ")[1];
    // verify token **ถ้าสำเร็จได้ payload ถ้าไม่สำเร็จ จะ throw error วิ่งไปที่ next
    // payload มี key ชื่อ userId
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY || "mmddkk");

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    //ไปหา user ที่ว่า มี payload ในนั้นไหม
    if (!user) {
      return next(createError("unauthenicated", 401));
    }
    delete user.password
    // ไปเพิ่ม key user ที่ไปหามา 
    req.user = user;
    next();
  } catch (err) {
    if(err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError'){
        err.statusCode = 401
    }
    next(err);
  }
};
