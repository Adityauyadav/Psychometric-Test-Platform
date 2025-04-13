import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./configs/db.js";
import mainRoute from "./routes/index.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT;

app.get("/", async (req, res) => {
  return res.status(200).json({ message: "Backend Is Up And Runing" });
});

app.use("/api/v1", mainRoute);

const startServer = async () => {
  try {
    // Connect to the database first
    await connectDB();

    // Then start the server
    app.listen(port, () => {
      console.log(`Server started on:- http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

// Call the function to start the server
startServer();
