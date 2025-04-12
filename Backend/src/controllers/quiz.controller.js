import { Quiz } from "../models/quiz.model.js";
import { User } from "../models/user.model.js"; // Adjust the path as needed
import mongoose from "mongoose";
import { Question } from "../models/question.model.js";

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
