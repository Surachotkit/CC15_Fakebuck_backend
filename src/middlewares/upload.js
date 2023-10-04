const multer = require("multer");

// เก็บไฟล์ไว้ไหน  และไฟล์ชื่ออะไร  //รับ parameter เป็น obj
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  // ชื่อไฟล์ date.now  อัพเดทเรื่อยๆ เวลา ณ ปัจจุบัน
  filename: (req, file, cb) => {
    // console.log(file)
    const split = file.originalname.split('.')
    cb(null, '' + Date.now()+ Math.round(Math.random() * 1000000) + '.' + split[split.length - 1]);
  },
});

const update = multer({ storage: storage });
module.exports = update
