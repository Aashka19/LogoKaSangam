const fs = require("node:fs");
const path = require("node:path");
const User = require("../models/user");
const Group = require("../models/group");

async function seedData(force = false) {
  const existingGroups = await Group.countDocuments();
  if (existingGroups > 0 && !force) {
    return { skipped: true, groups: existingGroups };
  }

  const travellersFile = path.join(__dirname, "..", "data", "problem-3", "travellers.json");
  const groupsFile = path.join(__dirname, "..", "data", "problem-3", "groups.json");

  if (!fs.existsSync(travellersFile) || !fs.existsSync(groupsFile)) {
    console.log("Mock data pack files not found; skipping seed.");
    return { skipped: true };
  }

  const rawTravellers = JSON.parse(fs.readFileSync(travellersFile, "utf8"));
  const rawGroups = JSON.parse(fs.readFileSync(groupsFile, "utf8"));

  const userMap = new Map();

  for (const t of rawTravellers) {
    const gender = t.gender.toLowerCase() === "male" ? "male" : "female";
    let genderPreference = "any";
    if (t.gender_preference === "SAME_GENDER") {
      genderPreference = gender === "female" ? "female_only" : "male_only";
    }

    const userData = {
      travellerId: t.traveller_id,
      name: t.name,
      age: t.age || null,
      gender,
      homeCity: t.home_city || "Unknown",
      genderPreference,
      interests: t.interests || [],
    };

    let user = await User.findOne({
      $or: [{ travellerId: t.traveller_id }, { name: t.name }],
    });

    if (user) {
      user.travellerId = t.traveller_id;
      user.age = userData.age;
      user.gender = userData.gender;
      user.homeCity = userData.homeCity;
      user.genderPreference = userData.genderPreference;
      user.interests = userData.interests;
      await user.save();
    } else {
      user = await User.create(userData);
    }

    userMap.set(t.traveller_id, user);
  }

  let seededGroupsCount = 0;
  for (const g of rawGroups) {
    const owner = userMap.get(g.owner_id);
    if (!owner) continue;

    const memberUsers = (g.member_ids || [g.owner_id])
      .map((tid) => userMap.get(tid))
      .filter(Boolean);

    const groupPayload = {
      groupId: g.group_id,
      name: g.name,
      ownerId: owner._id,
      memberIds: memberUsers.map((m) => m._id),
      city: g.city,
      checkIn: g.check_in,
      checkOut: g.check_out,
      groupSize: Number(g.max_size) || 3,
      budget: Number(g.budget_inr) || 60000,
      interests: owner.interests || [],
      itinerary: g.itinerary || "",
    };

    let group = await Group.findOne({
      $or: [{ groupId: g.group_id }, { name: g.name, city: g.city }],
    });

    if (group) {
      Object.assign(group, groupPayload);
      await group.save();
    } else {
      await Group.create(groupPayload);
    }
    seededGroupsCount++;
  }

  console.log(`Seeded ${userMap.size} travellers and ${seededGroupsCount} groups successfully.`);
  return { seeded: true, travellers: userMap.size, groups: seededGroupsCount };
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  const connectDB = require("../config/db");
  const mongoose = require("mongoose");

  connectDB()
    .then(() => seedData(true))
    .then(() => {
      console.log("Seed complete.");
      return mongoose.disconnect();
    })
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}

module.exports = { seedData };
