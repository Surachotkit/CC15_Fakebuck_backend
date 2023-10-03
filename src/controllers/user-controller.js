exports.updateProfile = async (req, res, next) => {
  try {
    res.status(200).json({ message: "correct" });
  } catch (err) {
    next(err);
  }
};
