const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

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

//      @route POST api/auth
//      @desc Log user in
//      @access public

router.post(
  "/",
  [
    check("email", "Email is invalid!").isEmail(),
    check("password", "Password is required!").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log(req.body);
      //Check for credentials
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ error: "Invalid Credential!" });
      }

      const compare = bcrypt.compare(password, user.password);

      if (!compare) {
        return res.status(400).json({ error: "Invalid Credential!" });
      }

      //Return a JWT if credentials matched
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 3600000,
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: "Server error!", error: err });
    }
  }
);
module.exports = router;
