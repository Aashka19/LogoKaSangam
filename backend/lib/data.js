const fs = require("node:fs");
const path = require("node:path");

const readData = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", relativePath), "utf8"));

const destinations = readData("catalog/destinations.json");
const interests = readData("problem-3/interests.json");
const hotels = readData("catalog/hotels.json");
const rooms = readData("catalog/rooms.json");
const availability = readData("catalog/availability.json");

const cities = destinations.countries.flatMap((country) => country.cities.map((city) => city.name));
const interestIds = new Set(interests.map((interest) => interest.interest));

module.exports = { availability, cities, hotels, interestIds, interests, rooms };
