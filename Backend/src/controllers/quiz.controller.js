import { Quiz } from "../models/quiz.model.js";
import { User } from "../models/user.model.js"; // Adjust the path as needed
import mongoose from "mongoose";
import { Question } from "../models/question.model.js";
import axios from "axios";

export const addQuiz = async (req, res) => {
  try {
    // Extract quiz name from request body
    const { quizName } = req.body;

    // Validate required fields
    if (!quizName) {
      return res.status(400).json({
        success: false,
        message: "Quiz name is required",
      });
    }

    // Validate that the user is authenticated
    // This assumes the auth middleware has been applied to this route
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if a quiz with the same name already exists for this user
    const existingQuiz = await Quiz.findOne({
      quizName: { $regex: new RegExp(`^${quizName}$`, "i") }, // Case-insensitive match
      createdBy: req.user._id,
    });

    if (existingQuiz) {
      return res.status(409).json({
        success: false,
        message: "You already have a quiz with this name",
      });
    }

    // Create a new quiz
    const newQuiz = new Quiz({
      quizName,
      createdBy: req.user._id,
      takenBy: [], // Initialize with empty array
    });

    // Save the quiz to the database
    await newQuiz.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz: {
        _id: newQuiz._id,
        quizName: newQuiz.quizName,
        createdBy: newQuiz.createdBy,
        createdAt: newQuiz.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in addQuiz controller:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the quiz",
    });
  }
};

export const addUserToQuiz = async (req, res) => {
  try {
    // Extract quizId from URL params or request body
    const quizId = req.query.quizId || req.body.quizId;

    // Extract userId from request body or use authenticated user
    // This allows admins to add other users to quizzes if needed
    let userId = req.body.userId;

    // If userId is not provided, use the authenticated user's ID
    if (!userId && req.user) {
      userId = req.user._id;
    }

    // Validate required parameters
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate that quizId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format",
      });
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Check if the quiz exists
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is already in the takenBy array
    if (quiz.takenBy.includes(userId)) {
      return res.status(409).json({
        success: false,
        message: "User has already been added to this quiz",
      });
    }

    // Add the user to the takenBy array
    quiz.takenBy.push(userId);

    // Save the updated quiz
    await quiz.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "User added to quiz successfully",
      quiz: {
        _id: quiz._id,
        quizName: quiz.quizName,
        takenBy: quiz.takenBy,
      },
    });
  } catch (error) {
    console.error("Error in addUserToQuiz controller:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding user to quiz",
    });
  }
};

export const addQuestion = async (req, res) => {
  try {
    // Extract question data from request body
    const { question, goodAns, badAns, quizId, userAns } = req.body;

    // Validate required fields
    if (!question || !goodAns || !badAns || !quizId || !userAns) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: question, goodAns, badAns, quizId userAns",
      });
    }

    // Validate that quizId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format",
      });
    }

    // Check if the quiz exists
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // If the authenticated user is not the creator of the quiz and not an admin, deny access
    // This assumes the auth middleware has been applied and req.user contains user info
    if (req.user && quiz.createdBy.toString() !== req.user._id.toString()) {
      // Check if user is admin (assuming userType 1 is admin)
      const USER_TYPE_ADMIN = 1;
      if (req.user.userType !== USER_TYPE_ADMIN) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add questions to this quiz",
        });
      }
    }

    // Check if a similar question already exists in this quiz
    // This is a basic check that can be enhanced based on your requirements
    const existingQuestion = await Question.findOne({
      question: { $regex: new RegExp(`^${question.trim()}$`, "i") }, // Case-insensitive match
      quizId: quizId,
    });

    if (existingQuestion) {
      return res.status(409).json({
        success: false,
        message: "A similar question already exists in this quiz",
      });
    }

    // Create a new question
    const newQuestion = new Question({
      question,
      goodAns,
      badAns,
      userAns,
      quizId,
      takenBy: [], // Initialize with empty array
    });

    // Save the question to the database
    await newQuestion.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      question: {
        _id: newQuestion._id,
        question: newQuestion.question,
        goodAns: newQuestion.goodAns,
        badAns: newQuestion.badAns,
        quizId: newQuestion.quizId,
        createdAt: newQuestion.createdAt,
        userAns: newQuestion.userAns,
      },
    });
  } catch (error) {
    console.error("Error in addQuestion controller:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding the question",
    });
  }
};

export const getQuizQuestions = async (req, res) => {
  try {
    // Extract quizId from URL params or query params
    const quizId = req.params.quizId || req.query.quizId;

    // Validate quizId
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID is required",
      });
    }

    // Validate that quizId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format",
      });
    }

    // Check if the quiz exists
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Extract query parameters for sorting and pagination
    const sort = req.query.sort || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;

    // Build the sort object
    const sortObj = {};
    sortObj[sort] = order;

    // Build the query
    let query = Question.find({ quizId });

    // Apply sorting
    query = query.sort(sortObj);

    // Apply pagination if limit is provided
    if (limit) {
      query = query.skip(skip).limit(limit);
    }

    // Execute the query
    const questions = await query.exec();

    // If no questions found
    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No questions found for this quiz",
        questions: [],
        count: 0,
        quiz: {
          _id: quiz._id,
          quizName: quiz.quizName,
        },
      });
    }

    // Count total questions for this quiz (useful for pagination)
    const totalCount = await Question.countDocuments({ quizId });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Questions retrieved successfully",
      questions: questions.map((q) => ({
        _id: q._id,
        question: q.question,
        goodAns: q.goodAns,
        badAns: q.badAns,
        createdAt: q.createdAt,
      })),
      count: totalCount,
      quiz: {
        _id: quiz._id,
        quizName: quiz.quizName,
      },
    });
  } catch (error) {
    console.error("Error in getQuizQuestions controller:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching questions",
    });
  }
};

export const addUserScoreToQuestion = async (req, res) => {
  try {
    // Extract data from request body
    const { questionId } = req.body;

    // Get userId from request body or use authenticated user's ID
    let userId = req.body.userId;

    // If userId is not provided, use the authenticated user's ID
    if (!userId && req.user) {
      userId = req.user._id;
    }

    // Validate required fields
    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    // Check if the question exists
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const scoreGot = await axios.post(
      `${process.env.NLP_URL}/evaluate`,
      {
        good: question.goodAns,
        bad: question.badAns,
        user: question.userAns,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const score = scoreGot.data.score;
    console.log("scoreGot", scoreGot);
    console.log("score", score);
    if (score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        message: "Score is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate that questionId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format",
      });
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Validate that score is a number
    if (typeof score !== "number") {
      return res.status(400).json({
        success: false,
        message: "Score must be a number",
      });
    }

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is already in the takenBy array
    const existingEntry = question.takenBy.find(
      (entry) => entry.user.toString() === userId.toString()
    );

    if (existingEntry) {
      // Update the existing score
      existingEntry.score = score;

      await question.save();

      return res.status(200).json({
        success: true,
        message: "User's score updated successfully",
        questionId: question._id,
        userId: userId,
        score: score,
        updated: true,
      });
    }

    // Add the user to the takenBy array with their score
    question.takenBy.push({
      user: userId,
      score: score,
    });

    // Save the updated question
    await question.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "User's score added successfully",
      questionId: question._id,
      userId: userId,
      score: score,
      updated: false,
    });
  } catch (error) {
    console.error("Error in addUserScoreToQuestion controller:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding user score to question",
    });
  }
};
