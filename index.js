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
    const applicationsCollection =
      database.collection("applications");

    //~ job api

    //? get all jobs
    app.get("/jobs", async (req, res) => {
      const { email } = req.query;
      let query = {};

      if (email) {
        query = { hr_email: email };
      }

      const result = await jobsCollection.find(query).toArray();

      res.json({
        success: true,
        message: "All jobs data.",
        data: result,
      });
    });

    //? get job detail
    app.get("/job/:id", async (req, res) => {
      const { id } = req.params;
      const result = await jobsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.json({
        success: true,
        message: "Job detail for id " + id,
        data: result,
      });
    });

    //? get jobs's application count
    app.get("/jobs/applications", async (req, res) => {
      const { email } = req.query;

      const jobs = await jobsCollection
        .find({ hr_email: email })
        .toArray();

      //: should use aggrigate to use optimum result

      const finalJobs = await Promise.all(
        jobs.map(async (job) => {
          const applicationsQuery = {
            jobId: job._id.toString(),
          };

          const applicationsCount =
            await applicationsCollection.countDocuments(
              applicationsQuery
            );

          job.applicationsCount = applicationsCount;

          return job;
        })
      );

      /* for (const job of jobs) {
        const applicationsQuery = {
          jobId: job._id.toString(),
        };

        const applicationsCount =
          await applicationsCollection.countDocuments(
            applicationsQuery
          );

        job.applicationsCount = applicationsCount;
      } */

      res.json({
        success: true,
        message: "All applications count",
        data: finalJobs,
      });
    });

    //? post a job

    app.post("/jobs", async (req, res) => {
      const job = req.body;

      const result = await jobsCollection.insertOne(job);

      res.json({
        success: true,
        message: "New job created.",
        data: result,
      });
    });

    //~ application api

    //? get user applications
    app.get("/applications", async (req, res) => {
      const { email } = req.query;

      const result = await applicationsCollection
        .find({
          applicant: email,
        })
        .toArray();

      //! bad way to aggrigate
      for (const application of result) {
        const jobId = application.jobId;
        const job = await jobsCollection.findOne({
          _id: new ObjectId(jobId),
        });

        application.job = job;
      }

      res.json({
        success: true,
        message: "All application list",
        data: result,
      });
    });

    //? get job specific applications
    app.get("/applications/job/:id", async (req, res) => {
      const { id } = req.params;

      const query = { jobId: id };

      const result = await applicationsCollection
        .find(query)
        .toArray();

      res.json({
        success: true,
        message: "All application for job",
        data: result,
      });
    });

    //? post a application
    app.post("/applications", async (req, res) => {
      const application = req.body;

      const result = await applicationsCollection.insertOne(
        application
      );

      res.json({
        success: true,
        message: "Successfully applied for the job",
        data: result,
      });
    });

    //? update an application
    app.patch("/applications/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const filter = {
        _id: new ObjectId(id),
      };

      const updatedDoc = {
        $set: {
          status,
        },
      };

      const result = await applicationsCollection.updateOne(
        filter,
        updatedDoc
      );

      res.json({
        success: true,
        message: "Status updated.",
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
