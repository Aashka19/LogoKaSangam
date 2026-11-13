const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/group");
const User = require("../models/user");
const { cities, interestIds } = require("../lib/data");
const {
  evaluateMatch,
  httpError,
  normalizeInterest,
  normalizePreference,
  validateDates,
} = require("../lib/travel");

const router = express.Router();

router.post("/search", async (req, res) => {
  const { userId, city, checkIn, checkOut, budget, interests, genderPreference } = req.body;
  if (!mongoose.isValidObjectId(userId)) throw httpError("A valid user ID is required.");
  if (!cities.includes(city)) throw httpError("Choose one of the supported destinations (Tokyo, Kyoto, Osaka, Dubai, Abu Dhabi).");
  validateDates(checkIn, checkOut);
  if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) throw httpError("Budget must be greater than zero.");
  
  const rawInterests = Array.isArray(interests) ? interests : [];
  const normalizedInterests = [...new Set(rawInterests.map(normalizeInterest))];
  if (normalizedInterests.some((interest) => !interestIds.has(interest))) {
    throw httpError("Choose interests from the available list.");
  }
  if (normalizedInterests.length < 2) throw httpError("Choose at least two interests to find matches.");

  const seeker = await User.findById(userId);
  if (!seeker) throw httpError("User not found.", 404);

  const seekerPreference = normalizePreference(
    genderPreference || seeker.genderPreference,
    seeker.gender
  );
  if (!["any", "female_only", "male_only"].includes(seekerPreference)) {
    throw httpError("Choose a valid travel companion preference.");
  }

  const groups = await Group.find({ city })
    .populate("ownerId", "name gender genderPreference interests age homeCity")
    .populate("memberIds", "name gender homeCity");

  const matches = [];
  const criteria = {
    city,
    checkIn,
    checkOut,
    budget: Number(budget),
    interests: normalizedInterests,
    genderPreference: seekerPreference,
  };

  for (const group of groups) {
    const owner = group.ownerId;
    if (!owner || group.booking || group.memberIds.some((member) => String(member._id || member) === String(seeker._id))) {
      continue;
    }
    const availableSeats = group.groupSize - group.memberIds.length;
    if (availableSeats < 1) continue;

    const eligibility = evaluateMatch(group, seeker, criteria);
    if (!eligibility) continue;
    const { overlap, lowerBudget, budgetDifference, sharedInterests } = eligibility;

    const memberGenders = group.memberIds.map((m) => (m.gender || "").toLowerCase());
    const isAllFemale = memberGenders.every((g) => g === "female");
    const isAllMale = memberGenders.every((g) => g === "male");
    const genderComposition = isAllFemale ? "Female only" : isAllMale ? "Male only" : "Mixed";

    const reasons = [
      `Same destination: ${group.city}`,
      `${overlap} overlapping nights (${group.checkIn} to ${group.checkOut})`,
      `Budget within 40% (diff: ₹${Math.round(budgetDifference).toLocaleString("en-IN")})`,
      `${sharedInterests.length} shared interests with host`,
      "Travel preferences are compatible",
      `${availableSeats} ${availableSeats === 1 ? "seat" : "seats"} available`,
    ];

    const budgetFit = 1 - budgetDifference / (lowerBudget || 1);
    const score = sharedInterests.length * 100 + overlap * 10 + budgetFit * 10;
    const compatibilityPercent = Math.min(
      99,
      Math.round(
        (Math.min(sharedInterests.length, 4) / 4) * 40 +
        (Math.min(overlap, 5) / 5) * 35 +
        budgetFit * 25
      )
    );

    matches.push({
      id: String(group._id),
      name: group.name,
      city: group.city,
      checkIn: group.checkIn,
      checkOut: group.checkOut,
      ownerId: String(owner._id),
      ownerName: owner.name,
      ownerGender: owner.gender,
      ownerAge: owner.age,
      memberCount: group.memberIds.length,
      groupSize: group.groupSize,
      budget: group.budget,
      sharedInterests,
      genderComposition,
      compatibilityPercent,
      reasons,
      myRequestStatus: group.requests?.find((request) => String(request.userId) === String(seeker._id))?.status || "",
      score,
    });
  }

  // Tie-breaking: score desc, then earliest check-in, then larger group size
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.checkIn !== b.checkIn) return a.checkIn.localeCompare(b.checkIn);
    return b.groupSize - a.groupSize;
  });

  res.json({ matches: matches.map(({ score, ...match }) => match) });
});

module.exports = router;
