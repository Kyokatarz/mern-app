const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/User");
//  @route    POST api/users
//  @desc     Register user
//  @access   public
router.post(
  "/",
  [
    check("name", "Name cannot be empty").not().isEmpty(),
    check("email", "Please enter a valid email.").isEmail(),
    check(
      "password",
      "Password length must be more than 6 characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    //Check if there is any validation error
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors });
    }

    const { name, email, password } = req.body;

    //Check if user exists
    let user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json([{ msg: "Email already exists!" }]);
    }

    try {
      //Look for Gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      //Create a new user instance (not saved yet).
      user = new User({
        name: name,
        email: email,
        avatar: avatar,
        password: password,
      });

      //Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //Save user to database.
      await user.save();
      console.log("User registered!");

      //Send back a JSONWebToken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw new Error(err.message);
          res.json({ token: token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }

  //
);

module.exports = router;
