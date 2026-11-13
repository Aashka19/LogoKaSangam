const crypto = require("node:crypto");
const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/group");
const User = require("../models/user");
const { availability, cities, hotels, interestIds, rooms } = require("../lib/data");
const { evaluateMatch, httpError, stayNights, validateDates } = require("../lib/travel");

const router = express.Router();
const availabilityByRoomAndDate = new Map(
  availability.map((entry) => [`${entry.room_id}:${entry.date}`, entry.rooms_left])
);

function validId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw httpError(`A valid ${label} ID is required.`);
  return id;
}

async function findGroup(id) {
  validId(id, "group");
  const group = await Group.findById(id);
  if (!group) throw httpError("Group not found.", 404);
  return group;
}

async function memberGroup(id, userId) {
  validId(userId, "user");
  const group = await findGroup(id);
  if (!group.memberIds.some((memberId) => String(memberId) === String(userId))) {
    throw httpError("Only group members can access this trip.", 403);
  }
  return group;
}

function optionsFor(city, checkIn, checkOut, memberCount) {
  validateDates(checkIn, checkOut);
  const nights = stayNights(checkIn, checkOut);
  const available = [];

  for (const hotel of hotels.filter((item) => item.city === city)) {
    for (const room of rooms.filter((item) => item.hotel_id === hotel.hotel_id && item.max_adults >= memberCount)) {
      const hasAvailability = nights.every(
        (date) => (availabilityByRoomAndDate.get(`${room.room_id}:${date}`) || 0) > 0
      );
      if (!hasAvailability) continue;

      const totalPrice = room.price_per_night.amount * nights.length;
      available.push({
        hotelId: hotel.hotel_id,
        hotelName: hotel.name,
        roomId: room.room_id,
        roomType: room.name,
        stars: hotel.stars,
        rating: hotel.rating,
        area: hotel.area,
        nights: nights.length,
        totalPrice,
        perPerson: Math.round(totalPrice / memberCount),
      });
    }
  }
  return available.sort((a, b) => a.totalPrice - b.totalPrice);
}

function serializeGroup(group, userId) {
  const user = String(userId);
  const isOwner = String(group.ownerId) === user;
  const requests = group.requests || [];
  return {
    id: String(group._id),
    name: group.name,
    ownerId: String(group.ownerId),
    members: group.memberIds.map((member) => ({
      id: String(member._id || member),
      name: member.name || "Traveller",
      homeCity: member.homeCity || "",
      gender: member.gender || "",
    })),
    memberCount: group.memberIds.length,
    city: group.city,
    checkIn: group.checkIn,
    checkOut: group.checkOut,
    groupSize: group.groupSize,
    budget: group.budget,
    interests: group.interests,
    itinerary: group.itinerary,
    ownerGender: group.memberIds.find((member) => String(member._id || member) === String(group.ownerId))?.gender || "",
    genderPreference: group.memberIds.find((member) => String(member._id || member) === String(group.ownerId))?.genderPreference || "any",
    myRequestStatus: requests.find((request) => String(request.userId) === user)?.status || "",
    pendingCount: isOwner ? requests.filter((request) => request.status === "pending").length : 0,
    savedOptions: group.savedOptions.map((option) => ({
      id: String(option._id),
      hotelId: option.hotelId,
      roomId: option.roomId,
      hotelName: option.hotelName,
      roomType: option.roomType,
      totalPrice: option.totalPrice,
      perPerson: Math.round(option.totalPrice / group.memberIds.length),
      nights: option.nights,
      checkIn: option.checkIn,
      checkOut: option.checkOut,
    })),
    booking: group.booking,
  };
}

router.post("/", async (req, res) => {
  const { name, city, checkIn, checkOut, groupSize, budget, interests = [], itinerary = "", ownerId } = req.body;
  validId(ownerId, "user");
  const owner = await User.findById(ownerId);
  if (!owner) throw httpError("User not found.", 404);
  if (!name?.trim()) throw httpError("Group name is required.");
  if (!cities.includes(city)) throw httpError("Choose one of the supported destinations.");
  validateDates(checkIn, checkOut);
  if (!Number.isInteger(Number(groupSize)) || Number(groupSize) < 1 || Number(groupSize) > 4) {
    throw httpError("Group size must be between 1 and 4, including the owner.");
  }
  if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) throw httpError("Budget must be greater than zero.");
  if (!Array.isArray(interests) || interests.some((interest) => !interestIds.has(interest))) {
    throw httpError("Choose interests from the available list.");
  }

  const group = await Group.create({
    name: name.trim(),
    ownerId: owner._id,
    memberIds: [owner._id],
    city,
    checkIn,
    checkOut,
    groupSize: Number(groupSize),
    budget: Number(budget),
    interests,
    itinerary: String(itinerary).trim(),
  });
  res.status(201).json({ id: String(group._id), _id: String(group._id), name: group.name });
});

router.get("/:id", async (req, res) => {
  const group = await memberGroup(req.params.id, req.query.userId);
  await group.populate("memberIds", "name homeCity gender genderPreference interests");
  res.json(serializeGroup(group, req.query.userId));
});

router.post("/:id/interest", async (req, res) => {
  const group = await findGroup(req.params.id);
  const userId = validId(req.body.userId, "user");
  const requestedInterests = Array.isArray(req.body.interests) ? [...new Set(req.body.interests)] : [];
  const criteria = {
    city: req.body.city,
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    budget: Number(req.body.budget),
    interests: requestedInterests,
    genderPreference: req.body.genderPreference,
  };
  validateDates(criteria.checkIn, criteria.checkOut);
  if (criteria.interests.length < 2 || criteria.interests.some((interest) => !interestIds.has(interest))) {
    throw httpError("At least two valid interests are required to request a match.");
  }
  if (!Number.isFinite(criteria.budget) || criteria.budget <= 0) throw httpError("Budget must be greater than zero.");
  if (!["any", "female_only", "male_only"].includes(criteria.genderPreference)) {
    throw httpError("Choose a valid travel companion preference.");
  }
  const user = await User.findById(userId);
  if (!user) throw httpError("User not found.", 404);
  if (group.booking) throw httpError("This group is locked because it has a booking.", 409);
  if (group.memberIds.some((memberId) => String(memberId) === String(user._id))) {
    throw httpError("You are already a group member.", 409);
  }
  if (group.memberIds.length >= group.groupSize) throw httpError("This group is full.", 409);
  const owner = await User.findById(group.ownerId);
  if (!owner || !evaluateMatch({ ...group.toObject(), ownerId: owner }, user, criteria)) {
    throw httpError("This group does not meet the matching requirements.", 409);
  }

  const existing = group.requests.find((request) => String(request.userId) === String(user._id));
  if (existing?.status === "pending") throw httpError("Your request is already pending.", 409);
  if (existing?.status === "approved") throw httpError("You are already a group member.", 409);
  if (existing) {
    existing.status = "pending";
    existing.createdAt = new Date();
    existing.criteria = criteria;
  } else {
    group.requests.push({ userId: user._id, status: "pending", criteria });
  }
  await group.save();
  res.status(201).json({ status: "pending" });
});

router.get("/:id/requests", async (req, res) => {
  const group = await findGroup(req.params.id);
  const userId = validId(req.query.userId, "user");
  if (String(group.ownerId) !== String(userId)) throw httpError("Only the group owner can view requests.", 403);

  const pending = group.requests.filter((request) => request.status === "pending");
  const users = await User.find({ _id: { $in: pending.map((request) => request.userId) } });
  const byId = new Map(users.map((user) => [String(user._id), user]));
  const owner = await User.findById(group.ownerId);
  res.json({
    requests: pending.map((request) => {
      const user = byId.get(String(request.userId));
      return {
        id: String(request._id),
        userId: String(request.userId),
        name: user?.name || "Traveller",
        homeCity: user?.homeCity || "",
        sharedInterests: (user?.interests || []).filter((interest) => owner.interests.includes(interest)),
      };
    }),
  });
});

router.post("/:id/requests/:requestId/:action", async (req, res) => {
  const group = await findGroup(req.params.id);
  const ownerId = validId(req.body.userId, "user");
  if (String(group.ownerId) !== String(ownerId)) throw httpError("Only the group owner can decide requests.", 403);
  if (!mongoose.isValidObjectId(req.params.requestId)) throw httpError("A valid request ID is required.");
  if (!["approve", "reject"].includes(req.params.action)) throw httpError("Action must be approve or reject.");

  const request = group.requests.id(req.params.requestId);
  if (!request || request.status !== "pending") throw httpError("Pending request not found.", 404);
  if (req.params.action === "reject") {
    request.status = "rejected";
    await group.save();
    return res.json({ status: "rejected" });
  }

  if (group.booking) throw httpError("This group is locked because it has a booking.", 409);
  if (group.memberIds.length >= group.groupSize) throw httpError("This group is full.", 409);
  const requester = await User.findById(request.userId);
  const owner = await User.findById(group.ownerId);
  if (!requester || !owner || !evaluateMatch({ ...group.toObject(), ownerId: owner }, requester, request.criteria)) {
    throw httpError("The request no longer meets the matching requirements.", 409);
  }
  const updated = await Group.findOneAndUpdate(
    {
      _id: group._id,
      ownerId,
      booking: null,
      "requests._id": request._id,
      "requests.status": "pending",
      $expr: { $lt: [{ $size: "$memberIds" }, "$groupSize"] },
    },
    {
      $addToSet: { memberIds: request.userId },
      $set: { "requests.$.status": "approved" },
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw httpError("The group changed or became full before this request could be approved.", 409);
  res.json({ status: "approved" });
});

router.get("/:id/hotels", async (req, res) => {
  const group = await memberGroup(req.params.id, req.query.userId);
  const { checkIn, checkOut } = req.query;
  const hotelOptions = optionsFor(group.city, checkIn, checkOut, group.memberIds.length);
  res.json({ hotels: hotelOptions });
});

router.post("/:id/saved-options", async (req, res) => {
  const group = await memberGroup(req.params.id, req.body.userId);
  if (group.booking) throw httpError("This group is locked because it has a booking.", 409);
  const checkIn = req.body.checkIn || group.checkIn;
  const checkOut = req.body.checkOut || group.checkOut;
  const option = optionsFor(group.city, checkIn, checkOut, group.memberIds.length).find(
    (item) => item.hotelId === req.body.hotelId && item.roomId === req.body.roomId
  );
  if (!option) throw httpError("That room is not available for the group and dates selected.", 409);
  if (group.savedOptions.some((saved) => saved.hotelId === option.hotelId && saved.roomId === option.roomId &&
      saved.checkIn === checkIn && saved.checkOut === checkOut)) {
    throw httpError("This hotel option is already saved.", 409);
  }
  group.savedOptions.push({ ...option, checkIn, checkOut, savedBy: req.body.userId });
  await group.save();
  res.status(201).json({ id: String(group.savedOptions[group.savedOptions.length - 1]._id) });
});

router.delete("/:id/saved-options/:optionId", async (req, res) => {
  const group = await memberGroup(req.params.id, req.query.userId);
  if (group.booking) throw httpError("This group is locked because it has a booking.", 409);
  const option = group.savedOptions.id(req.params.optionId);
  if (!option) throw httpError("Saved option not found.", 404);
  option.deleteOne();
  await group.save();
  res.json({ removed: true });
});

router.post("/:id/book", async (req, res) => {
  const group = await memberGroup(req.params.id, req.body.userId);
  if (group.booking) throw httpError("This group already has a booking.", 409);
  const option = group.savedOptions.id(req.body.optionId);
  if (!option) throw httpError("Save a hotel option before booking.", 404);
  const availableOption = optionsFor(group.city, option.checkIn, option.checkOut, group.memberIds.length).find(
    (item) => item.hotelId === option.hotelId && item.roomId === option.roomId
  );
  if (!availableOption) throw httpError("This room is no longer available for the group size and dates.", 409);
  const booking = {
    id: `BOOK-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    hotelName: option.hotelName,
    roomType: option.roomType,
    totalPrice: availableOption.totalPrice,
    perPerson: availableOption.perPerson,
    nights: availableOption.nights,
    checkIn: option.checkIn,
    checkOut: option.checkOut,
    createdAt: new Date(),
  };
  const updated = await Group.findOneAndUpdate(
    { _id: group._id, booking: null, "savedOptions._id": option._id },
    { $set: { booking } },
    { new: true }
  );
  if (!updated) throw httpError("This group was booked by another member.", 409);
  res.status(201).json({ booking: updated.booking });
});

router.get("/:id/messages", async (req, res) => {
  const group = await memberGroup(req.params.id, req.query.userId);
  res.json({
    messages: group.messages.map((message) => ({
      id: String(message._id),
      userId: String(message.userId),
      userName: message.userName,
      text: message.text,
      createdAt: message.createdAt,
    })),
  });
});

router.post("/:id/messages", async (req, res) => {
  const group = await memberGroup(req.params.id, req.body.userId);
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (!text) throw httpError("Suggestion cannot be empty.");
  if (text.length > 1000) throw httpError("Suggestion must be 1000 characters or fewer.");
  const user = await User.findById(req.body.userId);
  if (!user) throw httpError("User not found.", 404);
  group.messages.push({ userId: user._id, userName: user.name, text });
  await group.save();
  const message = group.messages[group.messages.length - 1];
  res.status(201).json({ id: String(message._id), userId: String(user._id), userName: user.name, text });
});

module.exports = router;
