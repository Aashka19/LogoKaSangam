
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    age: {
        type: Number,
        required: true
    },

    gender: {
        type: String,
        required: true,
        enum: ["MALE", "FEMALE"]
    },

    homeCity: {
        type: String,
        required: true
    },

    genderPreference: {
        type: String,
        required: true,
        enum: ["Men Only", "Anyone", "Women Only"]
    },

    interests: {
        type: [String],
        required: true
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
