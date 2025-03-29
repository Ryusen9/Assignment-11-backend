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
    origin: [
      "http://localhost:5173",
      "http://localhost:5175",
      "https://marathonmate-76eca.web.app",
      "https://marathonmate-76eca.firebaseapp.com",
      "https://assignment-11-backend-three.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
//!cookie verification
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
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
    //!JWT token setup
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    //!user collection setup
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.get("/usersInfo", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.post("/users", verifyToken, async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    app.get("/userApplications", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { applicantEmail: userEmail };
      const applications = await userApplicationsCollection
        .find(query)
        .toArray();
      res.send(applications);
    });

    app.post("/userApplications", verifyToken, async (req, res) => {
      const newApplication = req.body;
      const result = await userApplicationsCollection.insertOne(newApplication);
      res.send(result);
    });

    app.delete("/userApplications", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const marathonId = req.query.marathonId;
      const query = { applicantEmail: userEmail, marathonId: marathonId };
      const result = await userApplicationsCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/userApplications", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const marathonId = req.query.marathonId;
      const updatedInfo = req.body;
      const query = { applicantEmail: userEmail, marathonId: marathonId };
      const result = await userApplicationsCollection.updateOne(query, {
        $set: updatedInfo,
      });
      res.send(result);
    });
    // !Marathon Event
    app.get("/marathonEvents", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;
      const sortOrder = req.query.sortOrder === "newest" ? -1 : 1;
      let query = marathonEventCollection.find();
      if (limit > 0) {
        query = query.limit(limit);
      } else {
        query = query.skip((page - 1) * size).limit(size);
      }
      const events = await query.sort({ createdAt: sortOrder }).toArray();
      res.send(events);
    });
    app.post("/marathonEvents", verifyToken, async (req, res) => {
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
    app.get("/myMarathon", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const result = await marathonEventCollection
        .find({
          userEmail: userEmail,
        })
        .toArray();
      res.send(result);
    });
    app.delete("/myMarathon", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const id = req.query.id;
      const result = await marathonEventCollection.deleteOne({
        _id: new ObjectId(id),
        userEmail: userEmail,
      });
      res.send(result);
    });
    app.patch("/myMarathon", verifyToken, async (req, res) => {
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
