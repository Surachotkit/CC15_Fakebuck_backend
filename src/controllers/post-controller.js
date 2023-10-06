const fs = require("fs/promises");
const createError = require("../utils/create-error");
const { upload } = require("../utils/cloudinary-service");
const prisma = require("../models/prisma");
const { STATUS_ACCEPTED } = require("../config/constants");

const getFriendIds = async (targetUserId) => {
  const relationship = await prisma.friend.findMany({
    where: {
      OR: [{ receiverId: targetUserId }, { requesterId: targetUserId }],
      status: STATUS_ACCEPTED,
    },
  });
  // ถ้า
  const friendIds = relationship.map((el) =>
    el.requesterId === targetUserId ? el.receiverId : el.requesterId
  );
  return friendIds;
};

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
      data: data,
    });
    res.status(201).json({ message: "post created" });
  } catch (err) {
    next(err);
    // ลบรูป ใน public
  } finally {
    if (req.file) {
      fs.unlink(req.file.path);
    }
  }
};

// โพสทุกอัน รวมของเพื่อนด้วย
exports.getAllPostIncludeFriendPost = async (req, res, next) => {
  try {
    // id ของเพื่อนทั้งหมด
    // req.user.id ของคนที่ขอ
    const friendIds = await getFriendIds(req.user.id); // [6,12,7]
    // SELECT * FROM posts WHERE userId in (6,12,7)
    const posts = await prisma.post.findMany({
      where: {
        userId: {
          in: [...friendIds, req.user.id],
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
            }
        },

        // เอาแค่ id ที่กด like  **ถ้าอยากได้ชื่อด้วยจะต้องทำ Nested select
        likes: {
            select:{
                userId: true
            }
        }
      }
    });
    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
};


