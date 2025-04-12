import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./configs/db.js";

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT;

app.get("/", async (req, res) => {
  return res.status(200).json({ message: "Backend Is Up And Runing" });
});

try {
  app.listen(port, () => {
    connectDB;
    console.log(`Server started on:- http://localhost:${port}`);
  });
} catch (error) {
  console.log("Failed to start the server");
}
