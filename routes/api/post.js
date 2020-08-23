const express = require("express");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { remove } = require("../../models/Post");

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

// @route       GET /api/post
// @desc        Get all posts
// @Access      Public
router.get("/", async (req, res) => {
  try {
    const post = await Post.find({}).sort("-date");
    return res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error!");
  }
});

// @route       GET /api/post/:post_id
// @desc        Get post by ID
// @Access      Public
router.get("/:post_id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    console.log(post);
    if (!post) return res.status(401).json({ msg: "No post found!" });
    return res.json(post);
  } catch (err) {
    if (err.kind == "ObjectId")
      return res.status(400).json({ msg: "No post found!" });

    console.error(err.message);
    return res.status(500).send("Server error!");
  }
});

// @route       DELETE /api/post/:post_id
// @desc        Delete Post by ID
// @Access      Private

router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(400).json({ msg: "No post found!" });
    if (post.user.toString() !== req.user.id)
      return res
        .status(401)
        .json({ msg: "You are not authorized to do that!!!!" });

    await post.remove();
    return res.json({ msg: "Post removed successfully!" });
  } catch (err) {
    if (err.kind == "ObjectId")
      return res.status(401).json({ msg: "No post found!" });

    console.error(err.message);
    return res.status(500).send("Server error!");
  }
});

// @route       PUT /api/post/like/:post_id
// @desc        Like a post
// @Access      Private

router.put("/like/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    console.log(post.likes);
    if (
      post.likes.filter((item) => item.user.toString() == req.user.id)
        .length !== 0
    )
      return res.status(400).json({ msg: "You already liked this post!" });

    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.status(200).json({ msg: "Post liked!" });
  } catch (err) {
    if (err.kind == "ObjectId")
      return res.status(401).json({ msg: "No post found!" });

    console.error(err.message);
    return res.status(500).send("Server error!");
  }
});

// @route       PUT /api/post/unlike/:post_id
// @desc        Unlike a post
// @Access      Private

router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    console.log(post.likes);
    if (
      post.likes.filter((item) => item.user.toString() == req.user.id).length ==
      0
    )
      return res.status(400).json({ msg: "You didn't like this post yet!" });

    const removeIndex = post.likes
      .map((item) => item.user)
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.status(200).json({ msg: "Post unliked!" });
  } catch (err) {
    if (err.kind == "ObjectId")
      return res.status(401).json({ msg: "No post found!" });

    console.error(err.message);
    return res.status(500).send("Server error!");
  }
});

// @route       PUT /api/post/comment/:post_id
// @desc        Add comment to post
// @Access      Private

router.put(
  "/comment/:post_id",
  [auth, check("text", "Comment's text is required!").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.post_id);
      const commentingUser = await User.findById(req.user.id);
      const { text, date } = req.body;
      const commentObject = {
        text,
        user: req.user.id,
        name: commentingUser.name,
        avatar: commentingUser.avatar,
        date,
      };

      post.comment.unshift(commentObject);
      await post.save();
      return res.json(post);
    } catch (err) {
      if (err.kind == "ObjectId")
        return res.status(401).json({ msg: "No post found!" });

      console.error(err.message);
      return res.status(500).send("Server error!");
    }
  }
);

// @route       DELETE /api/post/comment/:post_id
// @desc        Delete comment on post
// @Access      Private

router.delete("/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    const commentsId = post.comment.map((comment) => comment.id);

    if (!post || !commentsId.includes(req.params.comment_id)) {
      return res.status(400).json({ msg: "No post or comment found" });
    }
    if (!(!req.user.id == post.user && !commentsId.includes(req.user.id)))
      return res.status(401).json({ msg: "You're not authorized to do that!" });

    const removeIndex = commentsId.indexOf(req.params.comment_id);
    post.comment.splice(removeIndex, 1);
    await post.save();

    return res.status(200).json({ msg: "Comment deleted!" });
  } catch (err) {
    if (err.kind == "ObjectId")
      return res.status(400).json({ msg: "No post found!" });

    console.error(err.message);
    return res.status(500).send("Server error!");
  }
});
module.exports = router;
