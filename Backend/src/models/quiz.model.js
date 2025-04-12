import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    quizName: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    takenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);
