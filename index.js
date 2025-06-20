import express from "express";
import "dotenv/config";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

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
    const jobsCollection = database.collection("jobs");

    //? api
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      
      res.json({
        success: true,
        message: "All jobs data.",
        data: result,
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("database connected successfully.");
  } finally {
    //// await client.close()
  }
};

server().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
