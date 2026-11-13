const express = require("express");
const { cities, interests } = require("../lib/data");

const router = express.Router();

router.get("/cities", (_req, res) => {
  res.json(cities.map((name) => ({ id: name, name })));
});

router.get("/interests", (_req, res) => {
  res.json(interests.map(({ interest, label }) => ({ id: interest, name: label })));
});

module.exports = router;
