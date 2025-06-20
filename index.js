import express from "express";
import "dotenv/config";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 9000;

const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const server = async () => {
  try {
    await client.connect();

    const database = client.db("carrier-code");

    await client.db("admin").command({ ping: 1 });
    console.log("database connected successfully.");
  } finally {
    //// await client.close()
  }
};

server().catch(console.dir);

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
