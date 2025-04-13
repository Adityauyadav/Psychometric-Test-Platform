import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    resultOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    totalAttempted: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Composite index to ensure uniqueness per user and quiz pair.
resultSchema.index({ quizId: 1, resultOf: 1 }, { unique: true });

export const Result = mongoose.model("Result", resultSchema);
