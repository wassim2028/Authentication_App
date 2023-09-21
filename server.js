require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/dbConnnect");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const corsOptions = require("./config/corsOptions");
const PORT = process.env.PORT || 5000;
connectDB();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));

app.all("*", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "404.html"));
});

mongoose.connection.once("open", () => {
  console.log("connected on mongo DB");
  app.listen(PORT, () => {
    console.log(`server running to port ${PORT}`);
  });
});
mongoose.connection.on("error", (error) => {
  console.log(error);
});
