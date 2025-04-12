import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import { addQuiz, addUserToQuiz } from "../controllers/quiz.controller.js";

const router = express.Router();

router.post("/add", auth, isAdmin, addQuiz);
router.post("/add/user", auth, addUserToQuiz);
export default router;
