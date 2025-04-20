const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.port || 5000;
const corsOptions = {
  origin: ["http://localhost:5174", "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@phassignment.y94e1.mongodb.net/?appName=phAssignment`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.user = decoded;
  });
  next();
}



async function run() {
  try {
    const db = client.db("assignment11");
    const postCollection = db.collection("posts");
    const requestCollection = db.collection("requests");

    // jwt token generator
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.JWT_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // clear cookie from browser
    app.get("/logout", (req, res) => {
      res.clearCookie("token", {
        maxAge:0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true });
    });

    // add volunteer need post here
    app.post("/add-post", async (req, res) => {
      const jobData = req.body;
      const result = await postCollection.insertOne(jobData);
      res.send(result);
    });

    // get all the posted jobs here
    app.get("/posts", async (req, res) => {
      const search = req.query.search;
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page);
      console.log(req.query);
      console.log(page, size)
      let query = {
        title: { $regex: search, $options: "i" },
      };
      const result = await postCollection.find(query)
      .skip(page * size)
      .limit(size)
      .toArray();
      res.send(result);
    });

    app.get("/total-posts", async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    })
  

    app.get("/posts-up", async(req, res)=>{
      const result = await postCollection.find().sort({deadline : 1}).limit(6).toArray();
      res.send(result);
    })

    // get a single post by id
    app.get("/post/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    // const add request here
    app.post("/add-request", async (req, res) => {
      const requestData = req.body;

      const query = { email: requestData.email, postId: requestData.postId };
      const existingRequest = await requestCollection.findOne(query);
      if (existingRequest) {
        return res
          .status(400)
          .send({ message: "You have already applied for this campaign" });
      }
      const result = await requestCollection.insertOne(requestData);

      const filter = { _id: new ObjectId(requestData.postId) };
      const updateDoc = {
        $inc: {
          request_count: 1,
        },
      };

      const updateRequestCount = await postCollection.updateOne(
        filter,
        updateDoc
      );

      res.send(result);
    });

    // get my posted jobs here
    app.get("/posts/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.user.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { "organizer.email": email };
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    // update a post here
    app.put("/update-post/:id",  async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateData,
      };
      const result = await postCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // update delete post
    app.delete("/delete-post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });
    // get all the requests by email here
    app.get("/requests/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.user.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: email };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });
    // delete request here

    app.delete("/delete-request/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const filter = { _id: new ObjectId(id) };
      const postId = req.query.postId;
      const postQuery = { _id: new ObjectId(postId) };
      const updateDoc = {
        $inc: {
          request_count: -1,
        },
      };
      const updateRequestCount = await postCollection.updateOne(
        postQuery,
        updateDoc
      );

      const result = await requestCollection.deleteOne(query);
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
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("assignment 11 backend is here");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
