const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    travellerId: { type: String, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 18, default: null },
    gender: { type: String, required: true, enum: ["female", "male", "other"] },
    homeCity: { type: String, required: true, trim: true },
    genderPreference: {
      type: String,
      required: true,
      enum: ["any", "female_only", "male_only"],
      default: "any",
    },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
