const { STATUS_PENDING } = require("../config/constants");
const prisma = require("../models/prisma");
const createError = require("../utils/create-error");
const { checkReceiverIdSchema } = require("../validators/user-validator");

exports.requestFriend = async (req, res, next) => {
  try {
    // value -> สิ่งที่ return จาก validate
    const { error, value } = checkReceiverIdSchema.validate(req.params);
    if (error) {
      next(error);
    }
    // เท่ากันไหม ถ้าเท่ากัน คือ ตัวเอง / ขอตัวเองเป็นเพื่อน
    // req.user.id มาจาก middleware
    if (value.receiverId === req.user.id) {
      return next(createError("cannot request yourself", 400));
    }

    // user req id ที่ไม่มีจริง
    const targetUser = await prisma.user.findUnique({
      where: {
        id: value.receiverId,
      },
    });
    if (!targetUser) {
      return next(createError("user does not exist", 400));
    }

    // มีความสัมพันธ์อยู่รึเปล่า
    // reqesterId - คนขอ  | receiverId - คนถูกขอ
    // SELECT * FROM friend WHERE reqesterId = 1 AND receiverId = 2
    // OR requesterId = 2 AND receiverId = 1
    const existRelationship = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, receiverId: value.receiverId },
          { requesterId: value.receiverId, receiverId: req.user.id },
        ],
      },
    });

    if (existRelationship) {
      return next(createError("user already has relationship", 400));
    }
    await prisma.friend.create({
        data: {
            requesterId: req.user.id,
            receiverId: value.receiverId,
            status: STATUS_PENDING
        }
    })

    res.status(201).json({ message: "request has been send" });
  } catch (err) {
    next(err);
  }
};
