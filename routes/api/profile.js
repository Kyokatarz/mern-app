const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { json } = require("express");

// @route       GET api/profile/me
// @desc
// @Access      public

router.get("/me", auth, async (req, res) => {
  try {
    //Get a profile from userID, bring in avatar and name
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["avatar", "name"]);

    if (!profile) {
      return res.status(400).json({ msg: "No profile found with this user!" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route       POST api/profile/
// @desc        Create or update user profile
// @Access      Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required!").not().isEmpty(),
      check("skills", "Skills are required!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build a profile object
    const profileObject = {};
    profileObject.user = req.user.id;
    if (company) profileObject.company = company;
    if (website) profileObject.website = website;
    if (location) profileObject.location = location;
    if (bio) profileObject.bio = bio;
    if (status) profileObject.status = status;
    if (githubusername) profileObject.githubusername = githubusername;
    if (skills) {
      profileObject.skills = skills.split(",").map((item) => item.trim());
    }

    //Build a social object
    profileObject.social = {};
    if (youtube) profileObject.social.youtube = youtube;
    if (facebook) profileObject.social.facebook = facebook;
    if (twitter) profileObject.social.twitter = twitter;
    if (instagram) profileObject.social.instagram = instagram;
    if (linkedin) profileObject.social.linkedin = linkedin;

    try {
      profile = await Profile.findOne({ user: req.body.id });
      if (profile) {
        //Update existing profile
        profile = await Profile.findOneAndUpdate(
          {
            user: req.user.id,
          },
          { $set: profileObject },
          { new: true }
        );
        return res.json(profile);
      } else {
        //Create a new profile

        const profile = new Profile(profileObject);
        await profile.save();
        return res.json(profile);
      }
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Server error!" });
    }
  }
);

// @route       GET api/profile/
// @desc        Get all profiles
// @Access      Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error!" });
  }
});

// @route       GET api/profile/user/:user_id
// @desc        Get profile by user_id
// @Access      Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ error: "Can't find profile with provided userId!" });
    } else {
      return res.status(200).json(profile);
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res
        .status(400)
        .json({ error: "Can't find profile with provided userId!" });
    }

    return res.status(500).json({ msg: "Server error!" });
  }
});

module.exports = router;
