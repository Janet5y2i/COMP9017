import { fail, ok } from '../utils/envelope.js';
import z from 'zod';

import Question from "../models/Question.js";
import User from '../models/User.js';
import Score from '../models/Score.js';

export async function getQuiz(req, res, next) {
  try {
    // TODO should choose randomly from the set of active questions
    const questions = await Question.find({});

    return ok(res, questions, 200);
  } catch (error) {
    return next(error);
  }
}

// Expected response body: {[questionId array], [answerIdxArray]}
const QuizAnswer = z.object({
  questions: z.array(z.string().trim().min(1)),
  answers: z.array(z.int().gte(0).lt(4))
}).superRefine((obj, context) => {
  // Require that the numbers of questions and answers are equal
  if (obj.questions.length != obj.answers.length) {
    context.addIssue({
      code: "custom",
      message: "Number of questions and number of answers must be equal",
      path: ["answers"],
    })
  }
})

export async function submitQuiz(req, res, next) {
  try {
    // Validate response body
    const qAns = QuizAnswer.parse(req.body);

    // Get the authenticated user TODO
    const userId = "69faf93ae00a5dec5c874a13";
    const user = await User.findById(userId);

    // Calculate score
    let answers = [];
    let countCorrect = 0;
    for (let i = 0; i < qAns.questions.length; i++) {
      const question = await Question.findById(qAns.questions[i]);
      if (!question) {
        return fail(res, "Invalid question IDs", 400);
      }

      const answerIdx = qAns.answers[i];
      const isCorrect = question.correctAnswer === question.options[answerIdx];

      answers.push({
        questionId: question._id,
        selectedAnswer: question.options[answerIdx],
        isCorrect: isCorrect
      });

      if (isCorrect) countCorrect++;
    }

    // Save a new Score document
    const score = new Score({
      userId: user._id,
      score: countCorrect,
      answers: answers
    });
    const savedScore = await score.save();

    // Return the Score
    return ok(res, savedScore, 200);
  } catch (error) {
    console.log(error)
    return next(error);
  }
}

export async function getMyAttempts(req, res, next) {
  try {
    // Get the authenticated user TODO
    const userId = "69f9f7bdd0a45f8c2ef202c3";
    const user = await User.findById(userId);

    // Find all scores of the player, sorted by timestamp
    const scores = await Score.find({ userId: user._id }).sort({ createdAt: -1 });

    // Return the list of attempts
    return ok(res, scores, 200);
  } catch (error) {
    return next(error);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    // Get all score, group by user, sorted by highest first
    const allScores = await Score.aggregate([
      // Group by userId
      {
        $group: {
          _id: "$userId",
          maxUserScore: { $max: "$score" }
        }
      },
      // Populate with user info
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      // Unwind the lookup populate result
      {
        $unwind: "$user"
      },
      // Reshape the result
      {
        $project: {
          user: 1,
          _id: 0,
          maxUserScore: 1
        }
      },
      // Sort by highest score first
      { $sort: { maxUserScore: -1 } }
    ]);

    return ok(res, allScores, 200);
  } catch (error) {
    return next(error);
  }
}

