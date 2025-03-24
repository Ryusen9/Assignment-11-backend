const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
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
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
//!Database connection

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.q4a9c.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("MarathonMate").collection('userCollection')
    //!user collection setup
    app.get("/users" , async(req, res) => {
    const users = await userCollection.find().toArray();
    res.send(users);
    })
    

    app.post("/users", async (req, res) => {
    const newUser = req.body;
    const result = await userCollection.insertOne(newUser);
    res.send(result);
    })
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//!root route
app.get("/", async (req, res) => {
  res.send("Server is running for marathon website");
});

app.listen(port, () => {
  console.log(`This server is running on port : ${port}`);
});
