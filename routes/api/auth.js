const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const User = require("../../models/User");

//      @route GET api/auth
//      @desc Test Auth
//      @access public

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json(user);
  } catch (err) {
    if (err) throw err;
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
