import express from "express";
import { auth, isAdmin } from "../middlewares/auth.js";
import {
  addQuiz,
  addUserToQuiz,
  addQuestion,
  getQuizQuestions,
  addUserScoreToQuestion,
} from "../controllers/quiz.controller.js";

const router = express.Router();

router.post("/add", auth, isAdmin, addQuiz);
router.post("/add/user", auth, addUserToQuiz);
router.post("/add/question", auth, addQuestion);
router.get("/all/questions", auth, getQuizQuestions);
router.post("/add/score", auth, addUserScoreToQuestion);
export default router;
