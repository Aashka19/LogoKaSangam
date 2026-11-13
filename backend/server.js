require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const catalogRoutes = require("./routes/catalogRoutes");
const groupRoutes = require("./routes/groupRoutes");
const matchRoutes = require("./routes/matchRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Group Travel Matcher Backend is running!" });
});
app.use("/api/catalog", catalogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/matches", matchRoutes);

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : error.name === "ValidationError" ? 400 : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? "An unexpected server error occurred." : error.message });
});

async function startServer() {
  await connectDB();
  const port = Number(process.env.PORT) || 5001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(
      process.env.MONGO_URI
        ? "Backend startup failed; check MongoDB connectivity and credentials."
        : error.message
    );
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
