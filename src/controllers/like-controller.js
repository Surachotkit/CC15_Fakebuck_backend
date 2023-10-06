const prisma = require("../models/prisma");
const createError = require("../utils/create-error");
const { checkPostIdSchema } = require("../validators/post-validator");

exports.toggleLike = async (req, res, next) => {
  try {
    const { value, error } = checkPostIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    // ป้องกัน กด like ที่ 2000 
    const existPost = await prisma.post.findUnique({
        // โพส มีไหม
        where:{
            id: value.postId
        }
    })
    
    if(!existPost){
        return next(createError('post does not exist', 400))
    }

    // user id -- post
    const existLike = await prisma.like.findFirst({
      where: {
        userId: req.user.id,
        postId: value.postId,
      },
    });
    // ถ้า like มีค่า
    // - ให้ลบ table like
    // - อัพเดท table post -- totalLike ลดลงไป 1

    if (existLike) {
      // ลบ id ที่หาเจอ
      await prisma.like.delete({
        where: {
          id: existLike.id,
        },
      });
      // กรณีที่ like มีค่า ให้อัพเดท totalLike ลดลงไป 1
      await prisma.post.update({
        data: {
          totalLike: {
            decrement: 1,
          },
        },
        where: {
          id: value.postId,
        },
      });
      return res.status(200).json({ message: "unlike" });
    }
    // ถ้า like ยังไม่มี ให้ update
    await prisma.like.create({
        data: {
            userId: req.user.id,
            postId: value.postId
        }
    })
    // เพิ่ม ให้อัพเดท totalLike เพิ่มไป 1
    await prisma.post.update({
        data: {
            totalLike: {
                increment: 1
            },
        },
        where:{
            id: value.postId
        }
    })
    res.status(200).json({ message: "like" });
  } catch (err) {
    next(err);
  }
};
