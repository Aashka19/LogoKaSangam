const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/group");
const User = require("../models/user");
const { cities, interestIds } = require("../lib/data");
const { evaluateMatch, httpError, validateDates } = require("../lib/travel");

const router = express.Router();

router.post("/search", async (req, res) => {
  const { userId, city, checkIn, checkOut, budget, interests, genderPreference } = req.body;
  if (!mongoose.isValidObjectId(userId)) throw httpError("A valid user ID is required.");
  if (!cities.includes(city)) throw httpError("Choose one of the supported destinations.");
  validateDates(checkIn, checkOut);
  if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) throw httpError("Budget must be greater than zero.");
  if (!Array.isArray(interests) || interests.some((interest) => !interestIds.has(interest))) {
    throw httpError("Choose interests from the available list.");
  }
  const uniqueInterests = [...new Set(interests)];
  if (uniqueInterests.length < 2) throw httpError("Choose at least two interests to find matches.");

  const seeker = await User.findById(userId);
  if (!seeker) throw httpError("User not found.", 404);
  const seekerPreference = genderPreference || seeker.genderPreference;
  if (!["any", "female_only", "male_only"].includes(seekerPreference)) {
    throw httpError("Choose a valid travel companion preference.");
  }

  const groups = await Group.find({ city }).populate("ownerId", "name gender genderPreference interests");
  const matches = [];
  const criteria = {
    city,
    checkIn,
    checkOut,
    budget: Number(budget),
    interests: uniqueInterests,
    genderPreference: genderPreference || seeker.genderPreference,
  };

  for (const group of groups) {
    const owner = group.ownerId;
    if (!owner || group.booking || group.memberIds.some((memberId) => String(memberId) === String(seeker._id))) continue;
    const availableSeats = group.groupSize - group.memberIds.length;
    if (availableSeats < 1) continue;

    const eligibility = evaluateMatch(group, seeker, criteria);
    if (!eligibility) continue;
    const { overlap, lowerBudget, budgetDifference, sharedInterests } = eligibility;

    const reasons = [
      `Same destination: ${group.city}`,
      `${overlap} overlapping nights`,
      "Budget is within 40%",
      `${sharedInterests.length} shared interests with the host`,
      "Both travel preferences are compatible",
      `${availableSeats} ${availableSeats === 1 ? "seat" : "seats"} available`,
    ];
    const budgetFit = 1 - budgetDifference / lowerBudget;
    matches.push({
      id: String(group._id),
      name: group.name,
      city: group.city,
      checkIn: group.checkIn,
      checkOut: group.checkOut,
      ownerId: String(owner._id),
      ownerName: owner.name,
      ownerGender: owner.gender,
      memberCount: group.memberIds.length,
      groupSize: group.groupSize,
      budget: group.budget,
      sharedInterests,
      reasons,
      myRequestStatus: group.requests.find((request) => String(request.userId) === String(seeker._id))?.status || "",
      score: sharedInterests.length * 100 + overlap * 10 + budgetFit,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  res.json({ matches: matches.map(({ score, ...match }) => match) });
});

module.exports = router;
