const fs = require("fs/promises");

const createError = require("../utils/create-error");
const { upload } = require("../utils/cloudinary-service");
const prisma = require("../models/prisma");
const { checkUserIdSchema } = require("../validators/user-validator");
const {
  AUTH_USER,
  UNKNOW,
  STATUS_ACCEPTED,
  FRIEND,
  REQUESTER,
  RECEIVER,
} = require("../config/constants");

const getTargetUserStatusWithAuthUser = async (targetUserId, authUserId) => {
  if (targetUserId === authUserId) {
    return AUTH_USER;
  }

  const relationship = await prisma.friend.findFirst({
    where: {
      // หา 2 ฝั่ง ฝั่งreq กับ res
      OR: [
        { requesterId: targetUserId, receiverId: authUserId },
        { requesterId: authUserId, receiverId: targetUserId },
      ],
    },
  });
  // check null
  if (!relationship) {
    return UNKNOW;
  }

  if (relationship.status === STATUS_ACCEPTED) {
    return FRIEND;
  }
  if (relationship.requesterId === authUserId) {
    return REQUESTER;
  }
  return RECEIVER;
};

const getTargetUserFriends = async (targetUserId) => {
  // STARTS : ACCEPTED AND (REQUESTER_ID = targetUserId Or RECEIVER_ID = targetUserId)
  const relationships = await prisma.friend.findMany({
    where: {
      status: STATUS_ACCEPTED,
      OR: [{ requesterId: targetUserId }, { requesterId: targetUserId }],
    },
    // include เอาค่าไหนบ้าง
    select: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          profileImage: true,
          coverImage: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          profileImage: true,
          coverImage: true,
        },
      },
    },
  });
  // console.log(relationships);
  // [ { id, firstName, lastName } ]
  const friends = relationships.map((el) =>
    el.requester.id === targetUserId ? el.receiver : el.requester
  );
  // console.log(friends)
  return friends
};

exports.updateProfile = async (req, res, next) => {
  try {
    //req file  *ต้องส่งรูปมา ถ้าไม่ส่งมาให้ส่งไปหน้า  error
    if (!req.files) {
      return next(createError("profile image or cover image is requried"));
    }
    // อัพโหลดได้ 2 รูป ในทีเดียว
    const response = {};

    // รูปที่ส่งมาkey ชื่อ profileImage มีค่าไหม
    if (req.files.profileImage) {
      const url = await upload(req.files.profileImage[0].path);
      response.profileImage = url;

      await prisma.user.update({
        data: {
          profileImage: url,
        },
        where: {
          id: req.user.id,
        },
      });
    }

    if (req.files.coverImage) {
      const url = await upload(req.files.coverImage[0].path);
      response.coverImage = url;

      await prisma.user.update({
        data: {
          coverImage: url,
        },
        where: {
          id: req.user.id,
        },
      });
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  } finally {
    if (req.files.profileImage) {
      fs.unlink(req.files.profileImage[0].path);
    }
    if (req.files.coverImage) {
      fs.unlink(req.files.coverImage[0].path);
    }
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { error } = checkUserIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    // เจ้าของ profile
    const userId = +req.params.userId;
    // return null ถ้าหาไม่เจอ
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    let status = null;
    let friends = null
    if (user) {
      delete user.password;
      status = await getTargetUserStatusWithAuthUser(userId, req.user.id);
      
      friends = await getTargetUserFriends(userId);
    }

    // ส่งไป frontend
    res.status(200).json({ user, status,friends });
  } catch (err) {
    next(err);
  }
};
