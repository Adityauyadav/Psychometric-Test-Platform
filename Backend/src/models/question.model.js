import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    goodAns: {
      type: String,
      required: true,
      trim: true,
    },
    badAns: {
      type: String,
      required: true,
      trim: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz", // This references the Quiz model
      required: true,
    },
    takenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Note: To ensure that each user only gets one record in the takenBy array,
// additional application logic or plugins may be required.

export const Question = mongoose.model("Question", questionSchema);
