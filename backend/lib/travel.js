const MIN_DATE = "2027-04-01";
const MAX_DATE = "2027-04-20";

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function validateDates(checkIn, checkOut) {
  if (!validDate(checkIn) || !validDate(checkOut) || checkIn < MIN_DATE ||
      checkOut > MAX_DATE || checkOut <= checkIn) {
    const error = new Error(`Dates must be YYYY-MM-DD between ${MIN_DATE} and ${MAX_DATE}, with check-out after check-in.`);
    error.status = 400;
    throw error;
  }
}

function nightsBetween(start, end) {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
}

function stayNights(start, end) {
  const nights = [];
  for (let time = Date.parse(`${start}T00:00:00Z`); time < Date.parse(`${end}T00:00:00Z`); time += 86400000) {
    nights.push(new Date(time).toISOString().slice(0, 10));
  }
  return nights;
}

function overlappingNights(aStart, aEnd, bStart, bEnd) {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  return end > start ? nightsBetween(start, end) : 0;
}

function preferenceAllows(preference, gender) {
  if (preference === "any") return true;
  if (preference === "female_only") return gender === "female";
  if (preference === "male_only") return gender === "male";
  return false;
}

function evaluateMatch(group, seeker, criteria) {
  const owner = group.ownerId;
  if (!owner || String(owner._id || owner) === String(seeker._id)) return null;
  if (group.city !== criteria.city) return null;

  const overlap = overlappingNights(criteria.checkIn, criteria.checkOut, group.checkIn, group.checkOut);
  if (overlap < 2) return null;

  const lowerBudget = Math.min(Number(criteria.budget), group.budget);
  const budgetDifference = Math.abs(Number(criteria.budget) - group.budget);
  if (budgetDifference > lowerBudget * 0.4) return null;

  const sharedInterests = criteria.interests.filter((interest) => owner.interests.includes(interest));
  if (sharedInterests.length < 2) return null;
  if (
    !preferenceAllows(criteria.genderPreference || seeker.genderPreference, owner.gender) ||
    !preferenceAllows(owner.genderPreference, seeker.gender)
  ) return null;

  return { overlap, budgetDifference, lowerBudget, sharedInterests };
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = {
  MAX_DATE,
  MIN_DATE,
  httpError,
  evaluateMatch,
  nightsBetween,
  overlappingNights,
  preferenceAllows,
  stayNights,
  validateDates,
};
