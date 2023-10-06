const fs = require('fs/promises')
const createError = require("../utils/create-error");
const { upload } = require("../utils/cloudinary-service");
const prisma = require("../models/prisma");

exports.createPost = async (req, res, next) => {
  try {
    const { message } = req.body;
    // ถ้าไม่มี ข้อความ ไม่มีไฟล์
    // เอาไปเขียนใน Joi ได้ ใน message
    if ((!message || !message.trim()) && !req.file) {
      return next(createError("message or image is required", 400));
    }
    // req.file มีค่าไหม ถ้ามี อัพโหลดไปที่ cloud
    // path ตำแหน่งของรูปภาพ
    const data = { userId: req.user.id };
    if (req.file) {
      // key image จะถูกเพิ่มเข้าไป ถ้า file มีค่า
      data.image = await upload(req.file.path);
    }
    if (message) {
      data.message = message;
    }
    // create post
    await prisma.post.create({
      data: data
    });
    res.status(201).json({ message: "post created" });
  } catch (err) {
    next(err);
    // ลบรูป ใน public
  } finally {
    if(req.file){
        fs.unlink(req.file.path)
    }
  }
};
