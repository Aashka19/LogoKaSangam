const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    criteria: {
      city: { type: String, default: "" },
      checkIn: { type: String, required: true },
      checkOut: { type: String, required: true },
      budget: { type: Number, required: true },
      interests: { type: [String], default: [] },
      genderPreference: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const savedOptionSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true },
    roomId: { type: String, required: true },
    hotelName: { type: String, required: true },
    roomType: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    perPerson: { type: Number, required: true },
    nights: { type: Number, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const groupSchema = new mongoose.Schema(
  {
    groupId: { type: String, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    city: {
      type: String,
      required: true,
      enum: ["Tokyo", "Kyoto", "Osaka", "Dubai", "Abu Dhabi"],
    },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    groupSize: { type: Number, required: true, min: 1, max: 4 },
    budget: { type: Number, required: true, min: 1 },
    interests: { type: [String], default: [] },
    itinerary: { type: String, default: "" },
    requests: { type: [requestSchema], default: [] },
    savedOptions: { type: [savedOptionSchema], default: [] },
    booking: { type: mongoose.Schema.Types.Mixed, default: null },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Group || mongoose.model("Group", groupSchema);
