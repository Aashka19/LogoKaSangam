const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateMatch, overlappingNights, preferenceAllows, validateDates } = require("../lib/travel");

const seeker = {
  _id: "seeker-1",
  gender: "female",
  genderPreference: "any",
};
const owner = {
  _id: "owner-1",
  gender: "female",
  genderPreference: "female_only",
  interests: ["TEMPLES", "STREET_FOOD", "HIKING"],
};
const group = {
  city: "Kyoto",
  ownerId: owner,
  checkIn: "2027-04-10",
  checkOut: "2027-04-15",
  budget: 60000,
};
const criteria = {
  city: "Kyoto",
  checkIn: "2027-04-11",
  checkOut: "2027-04-16",
  budget: 84000,
  interests: ["TEMPLES", "STREET_FOOD"],
  genderPreference: "any",
};

test("validates the supported trip date window and date order", () => {
  assert.doesNotThrow(() => validateDates("2027-04-01", "2027-04-20"));
  assert.throws(() => validateDates("2027-03-31", "2027-04-02"), /Dates must be/);
  assert.throws(() => validateDates("2027-04-10", "2027-04-10"), /Dates must be/);
});

test("counts shared nights using checkout as an exclusive date", () => {
  assert.equal(overlappingNights("2027-04-10", "2027-04-12", "2027-04-12", "2027-04-15"), 0);
  assert.equal(overlappingNights("2027-04-10", "2027-04-13", "2027-04-11", "2027-04-15"), 2);
});

test("accepts matches at the 40 percent lower-budget threshold", () => {
  assert.deepEqual(evaluateMatch(group, seeker, criteria).sharedInterests, ["TEMPLES", "STREET_FOOD"]);
  assert.equal(evaluateMatch(group, seeker, { ...criteria, budget: 84001 }), null);
});

test("requires exact city, two nights, two interests, and mutual gender preference", () => {
  assert.equal(evaluateMatch(group, seeker, { ...criteria, city: "Tokyo" }), null);
  assert.equal(evaluateMatch(group, seeker, { ...criteria, checkIn: "2027-04-14", checkOut: "2027-04-16" }), null);
  assert.equal(evaluateMatch(group, seeker, { ...criteria, interests: ["TEMPLES"] }), null);
  assert.equal(evaluateMatch(group, { ...seeker, gender: "male" }, criteria), null);
  assert.equal(evaluateMatch(group, seeker, { ...criteria, genderPreference: "male_only" }), null);
});

test("applies supported gender preferences", () => {
  assert.equal(preferenceAllows("any", "other"), true);
  assert.equal(preferenceAllows("female_only", "female"), true);
  assert.equal(preferenceAllows("female_only", "other"), false);
});
