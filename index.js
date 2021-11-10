const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4500;
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://user_nahid_1:xj2ALBJoe5ECz5fR@cluster0.4v0cg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"; // mongodb configuration
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); // create new Mongodb Client

async function run() {
  try {
    await client.connect();
    const database = client.db("products");
    const productCollection = database.collection("products");

    app.get("/products", async (req, res) => {
      console.log("request listening to to hello server");
      const result = await productCollection.find().toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(() => console.dir);

app.get("/", (req, res) => {
  // test api
  res.send("assignment-12  server ");
});

app.listen(4500, () => {
  console.log("Listening server port :", port);
});
