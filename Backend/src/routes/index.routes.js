import express from "express";
import userRoutes from "./user.routes.js"; // Import your user routes here

const router = express.Router();

// Mount the user routes under the "/user" path
router.use("/user", userRoutes);

export default router;
