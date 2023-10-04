exports.updateProfile = async (req, res, next) => {
  try {
    //req file
    console.log(req.files)
    res.status(200).json({ message: "correct" });
  } catch (err) {
    next(err);
  }
};
