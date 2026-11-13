const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/group");
const User = require("../models/user");
const { interestIds } = require("../lib/data");
const { httpError } = require("../lib/travel");

const router = express.Router();

function userId(value) {
  if (!mongoose.isValidObjectId(value)) throw httpError("A valid user ID is required.");
  return value;
}

function summary(group, user) {
  const isOwner = String(group.ownerId?._id || group.ownerId) === String(user._id);
  return {
    id: String(group._id),
    name: group.name,
    city: group.city,
    checkIn: group.checkIn,
    checkOut: group.checkOut,
    memberCount: group.memberIds.length,
    groupSize: group.groupSize,
    role: isOwner ? "owner" : "member",
    status: group.booking ? "booked" : isOwner ? "owner" : "approved",
    pendingCount: isOwner ? group.requests.filter((request) => request.status === "pending").length : 0,
  };
}

router.post("/", async (req, res) => {
  const { name, age, gender, homeCity, interests = [], genderPreference = "any" } = req.body;
  if (!name?.trim() || !homeCity?.trim()) throw httpError("Name and home city are required.");
  if (!["female", "male", "other"].includes(gender)) throw httpError("Choose a valid gender.");
  if (!["any", "female_only", "male_only"].includes(genderPreference)) {
    throw httpError("Choose a valid travel companion preference.");
  }
  if (!Array.isArray(interests) || interests.some((interest) => !interestIds.has(interest))) {
    throw httpError("Choose interests from the available list.");
  }
  if (age !== null && age !== undefined && age !== "" && (!Number.isInteger(Number(age)) || Number(age) < 18)) {
    throw httpError("Age must be 18 or older.");
  }

  const user = await User.create({
    name: name.trim(),
    age: age === null || age === undefined || age === "" ? null : Number(age),
    gender,
    homeCity: homeCity.trim(),
    genderPreference,
    interests,
  });
  res.status(201).json({
    _id: String(user._id),
    id: String(user._id),
    name: user.name,
    age: user.age,
    gender: user.gender,
    homeCity: user.homeCity,
    genderPreference: user.genderPreference,
    interests: user.interests,
  });
});

router.get("/:id/groups", async (req, res) => {
  const id = userId(req.params.id);
  const user = await User.findById(id);
  if (!user) throw httpError("User not found.", 404);
  const groups = await Group.find({ memberIds: user._id }).populate("ownerId", "name");
  res.json({ groups: groups.map((group) => summary(group, user)) });
});

router.get("/:id/pending-count", async (req, res) => {
  const id = userId(req.params.id);
  const groups = await Group.find({ ownerId: id }, "requests");
  const count = groups.reduce(
    (total, group) => total + group.requests.filter((request) => request.status === "pending").length,
    0
  );
  res.json({ count });
});

router.get("/:id", async (req, res) => {
  const id = userId(req.params.id);
  const user = await User.findById(id);
  if (!user) throw httpError("User not found.", 404);
  const groups = await Group.find({ memberIds: user._id }).populate("ownerId", "name");
  res.json({
    _id: String(user._id),
    id: String(user._id),
    name: user.name,
    age: user.age,
    gender: user.gender,
    homeCity: user.homeCity,
    genderPreference: user.genderPreference,
    interests: user.interests,
    groups: groups.map((group) => summary(group, user)),
  });
});

module.exports = router;
