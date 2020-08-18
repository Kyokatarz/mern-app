const express = require("express");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

//Connect to Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Routing
app.use("/api/users", require("./routes/api/users"));

app.listen(PORT, () => {
  console.log(`Listening on PORT: ${PORT}`);
});
