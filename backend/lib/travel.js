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

function normalizeGender(g) {
  if (!g) return "other";
  const s = String(g).trim().toLowerCase();
  if (s === "female" || s === "f") return "female";
  if (s === "male" || s === "m") return "male";
  return "other";
}

function normalizePreference(p, subjectGender) {
  if (!p) return "any";
  const s = String(p).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "any" || s === "anyone") return "any";
  if (s === "female_only" || s === "women_only" || s === "female") return "female_only";
  if (s === "male_only" || s === "men_only" || s === "male") return "male_only";
  if (s === "same_gender" || s === "same") {
    const norm = normalizeGender(subjectGender);
    if (norm === "female") return "female_only";
    if (norm === "male") return "male_only";
    return "any";
  }
  return s;
}

function preferenceAllows(preference, targetGender, subjectGender) {
  const pref = normalizePreference(preference, subjectGender);
  const target = normalizeGender(targetGender);
  if (pref === "any") return true;
  if (pref === "female_only") return target === "female";
  if (pref === "male_only") return target === "male";
  return false;
}

function normalizeInterest(interest) {
  return String(interest).trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function evaluateMatch(group, seeker, criteria) {
  const owner = group.ownerId;
  if (!owner || String(owner._id || owner.id || owner) === String(seeker._id || seeker.id)) return null;
  if (group.city !== criteria.city) return null;

  // Rule 1: Dates overlap at least 2 nights
  const overlap = overlappingNights(criteria.checkIn, criteria.checkOut, group.checkIn, group.checkOut);
  if (overlap < 2) return null;

  // Rule 3: Budget difference at most 40% of lower budget
  const groupBudget = Number(group.budget || group.budget_inr);
  const seekerBudget = Number(criteria.budget);
  const lowerBudget = Math.min(seekerBudget, groupBudget);
  const budgetDifference = Math.abs(seekerBudget - groupBudget);
  if (budgetDifference > lowerBudget * 0.4 + 1e-9) return null;

  // Rule 4: Shared interests >= 2 with group owner
  const ownerInterests = (owner.interests || []).map(normalizeInterest);
  const seekerInterests = (criteria.interests || []).map(normalizeInterest);
  const sharedInterests = seekerInterests.filter((interest) => ownerInterests.includes(interest));
  if (sharedInterests.length < 2) return null;

  // Rule 5: Gender preference compatibility
  const seekerGender = normalizeGender(seeker.gender);
  const ownerGender = normalizeGender(owner.gender);
  const seekerPref = criteria.genderPreference || seeker.genderPreference;
  const ownerPref = owner.genderPreference;

  if (
    !preferenceAllows(seekerPref, ownerGender, seekerGender) ||
    !preferenceAllows(ownerPref, seekerGender, ownerGender)
  ) {
    return null;
  }

  // Rule 6: Group size: current members + 1 <= groupSize
  const currentMembers = Array.isArray(group.memberIds) ? group.memberIds.length : (group.memberCount || 1);
  const maxSize = Number(group.groupSize || group.max_size || 4);
  if (currentMembers + 1 > maxSize) return null;

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
  normalizeGender,
  normalizeInterest,
  normalizePreference,
  overlappingNights,
  preferenceAllows,
  stayNights,
  validateDates,
};
