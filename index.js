const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4v0cg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyToken = async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith("Bearer ")) {
    const IdToken = req?.headers?.authorization.split(" ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(IdToken);
      req.decodedEmail = decodedUser.email;
    } catch (err) {
      console.log(err.message);
    }
  }
  next();
};

async function run() {
  try {
    await client.connect();
    const database = client.db("car_shop");
    const usersCollection = database.collection("users");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewCollection = database.collection("reviews");

    // get all product
    app.get("/product/all", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });
    // get all product
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    // get myorder api

    app.get("/myOrder", verifyToken, async (req, res) => {
      const decodedEmail = req.decodedEmail;
      const email = req.query.email;
      if (decodedEmail) {
        const query = { email: email };
        const result = await ordersCollection.find(query).toArray();
        res.send(result);
      } else {
        res.status(401).json({ message: "unathorize User" });
      }
    });

    // delete single order
    app.delete("/order", async (req, res) => {
      const id = req.query.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });

    // get all order or admin
    app.get("/order", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.json(result);
    });
    // update order status
    app.put("/order", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: { status: "shipped" },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.json(result);
    });

    // get product for home page
    app.get("/product/home", async (req, res) => {
      const result = await productsCollection.find({}).limit(6).toArray();
      res.send(result);
    });

    // get product for product page
    app.get("/product/single/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // add a new product to database
    app.post("/addProduct", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.json(result);
    });
    // save user information to database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // save user information to database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const option = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, option);
      res.json(result);
    });

    // make a review api
    app.post("/review", async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.json(result);
    });
    // get all review
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find({}).toArray();
      res.json(result);
    });

    // add a admin
    app.post("/addAdmin", verifyToken, async (req, res) => {
      const email = req.query.email;
      const adderEmail = req.decodedEmail;
      if (adderEmail) {
        const adderInfo = await usersCollection.findOne({ email: adderEmail });
        if (adderInfo.role === "admin") {
          const filter = { email: email };
          const option = { upsert: true };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(
            filter,
            updateDoc,
            option
          );
          res.json(result);
        }
      } else {
        res.status(401).json({ message: "unAthorize user" });
      }
    });

    app.get("/admin", verifyToken, async (req, res) => {
      const decodedEmail = req.decodedEmail;
      const email = req.query.email;
      if (decodedEmail === email) {
        const user = await usersCollection.findOne({ email: email });
        if (user.role === "admin") {
          res.json({ isAdmin: true });
        }
      } else {
        res.json({ isAdmin: false });
      }
    });
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assignment Server Running");
});

app.listen(port, () => {
  console.log("Assignment Server Running", port);
});
