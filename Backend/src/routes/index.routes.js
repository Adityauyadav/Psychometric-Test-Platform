import express from "express";
import userRoutes from "./user.routes.js";
import quizRoutes from "./quiz.routes.js";

const router = express.Router();

// Mount the user routes under the "/user" path
router.use("/user", userRoutes);
router.use("/quiz", quizRoutes);

export default router;
