const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookie_parser = require("cookie-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config;
const port = process.env.PORT || 3500;

const app = express();

//!middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5175"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//!root route
app.get('/', async(req, res) => {
    res.send("Server is running for marathon website")
})

app.listen(port, () => {
    console.log(`This server is running on port : ${port}`)
})
