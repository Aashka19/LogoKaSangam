
const express = require("express");
const router = express.Router();

const User = require("../models/User");

// POST /api/users - Signup
router.post("/", async (req, res) => {
  try {
    const { name, age, gender, homeCity, interests, genderPreference } = req.body;

    const user = new User({
      name,
      age,
      gender,
      homeCity,
      interests,
      genderPreference
    });

    const savedUser = await user.save();

    res.status(201).json(savedUser);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


// GET /api/users/:id - Get user details
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


module.exports = router;
