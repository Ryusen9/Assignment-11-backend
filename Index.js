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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const userCollection = client
      .db("MarathonMate")
      .collection("userCollection");
    const marathonEventCollection = client
      .db("MarathonMate")
      .collection("marathonEvent");
    const userApplicationsCollection = client
      .db("MarathonMate")
      .collection("userApplications");
    //!user collection setup
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.get("/usersInfo", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    app.get("/userApplications", async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { applicantEmail: userEmail };
      const applications = await userApplicationsCollection
        .find(query)
        .toArray();
      res.send(applications);
    });

    app.post("/userApplications", async (req, res) => {
      const newApplication = req.body;
      const result = await userApplicationsCollection.insertOne(newApplication);
      res.send(result);
    });

    // !Marathon Event
    app.get("/marathonEvents", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let events;
      if (limit > 0) {
        events = await marathonEventCollection.find().limit(limit).toArray();
      } else {
        events = await marathonEventCollection
          .find()
          .skip((page - 1) * size)
          .limit(size)
          .toArray();
      }
      res.send(events);
    });
    app.post("/marathonEvents", async (req, res) => {
      const newEvent = req.body;
      const result = await marathonEventCollection.insertOne(newEvent);
      res.send(result);
    });
    app.get("/eventCount", async (req, res) => {
      const count = await marathonEventCollection.estimatedDocumentCount();
      res.send({ count });
    });
    app.get("/event/:id", async (req, res) => {
      const id = req.params.id;
      const result = await marathonEventCollection.findOne({
        _id: new ObjectId(id),
      });
      result ? res.send(result) : res.status(404).send("No Event found");
    });
    app.get("/myMarathon", async (req, res) => {
      const userEmail = req.query.userEmail;
      const result = await marathonEventCollection
        .find({
          userEmail: userEmail,
        })
        .toArray();
      res.send(result);
    });
    app.delete("/myMarathon", async (req, res) => {
      const userEmail = req.query.userEmail;
      const id = req.query.id;
      const result = await marathonEventCollection.deleteOne({
        _id: new ObjectId(id),
        userEmail: userEmail,
      });
      res.send(result);
    });
    app.patch("/myMarathon", async (req, res) => {
      const userEmail = req.query.userEmail;
      const id = req.query.id;
      const updatedEvent = req.body;
      const result = await marathonEventCollection.updateOne(
        {
          _id: new ObjectId(id),
          userEmail: userEmail,
        },
        { $set: updatedEvent }
      );
      res.send(result);
    });
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
