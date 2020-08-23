const express = require("express");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

const router = express.Router();

// @route       POST /api/post
// @desc        Create a post
// @Access      Private
router.post(
  "/",
  [auth, check("text", "Post text is required!").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
      });

      const post = await newPost.save();
      return res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error!");
    }
  }
);

module.exports = router;
