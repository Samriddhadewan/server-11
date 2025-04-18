const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@phassignment.y94e1.mongodb.net/?appName=phAssignment`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db("assignment11");
    const postCollection = db.collection("posts");
    const requestCollection = db.collection("requests");


    // add volunteer need post here 
    app.post("/add-post", async (req, res) => {
      const jobData = req.body;
      const result = await postCollection.insertOne(jobData);
      res.send(result)
    });

    // get all the posted jobs here 
    app.get("/posts", async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    });

    // get a single post by id 
    app.get("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    // const add request here 
    app.post("/add-request", async (req, res) => {
      const requestData = req.body;
      
      const query = { email : requestData.email, postId: requestData.postId };
      const existingRequest = await requestCollection.findOne(query);
      if(existingRequest) {
        return res.status(400).send({ message: "You have already applied for this campaign" });
      }
      const result = await requestCollection.insertOne(requestData);

      
      const filter = {_id : new ObjectId(requestData.postId)};
      const updateDoc = {
        $inc : {
          request_count : 1}
      }

      const updateRequestCount = await postCollection.updateOne(filter, updateDoc);


      res.send(result);
    });

    // get my posted jobs here 
    app.get("/posts/:email", async (req, res) => {
      const email = req.params.email;
      const query = { 'organizer.email': email };
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    // update a post here 
    app.put("/update-post/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateData
      }
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
    app.get("/requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });
    // delete request here 




    app.delete("/delete-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const filter = { _id: new ObjectId(id) };
      const postId = req.query.postId;  
      const postQuery = { _id: new ObjectId(postId) };
      const updateDoc = {
        $inc: {
          request_count: -1
        }
      }
      const updateRequestCount = await postCollection.updateOne(postQuery, updateDoc);
      
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
