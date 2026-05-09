import mongoose from 'mongoose';
import Question from '../models/Question.js';
import {
  normalizeBulkImportPayload,
  normalizeQuestionInput
} from '../utils/adminQuestionValidation.js';
import { fail, ok } from '../utils/envelope.js';

function formatQuestion(question) {
  return {
    id: question._id.toString(),
    text: question.text,
    options: question.options,
    correctAnswer: question.correctAnswer,
    imageUrl: question.imageUrl || '',
    isActive: question.isActive,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

function isValidQuestionId(id) {
  return mongoose.isValidObjectId(id);
}

export async function listQuestions(req, res, next) {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });

    return ok(res, { questions: questions.map(formatQuestion) });
  } catch (error) {
    return next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { data, error } = normalizeQuestionInput(req.body, 'create');

    if (error) {
      return fail(res, error, 400);
    }

    const question = await Question.create(data);
    return ok(res, { question: formatQuestion(question) }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    if (!isValidQuestionId(req.params.id)) {
      return fail(res, 'Invalid question id.', 400);
    }

    const { data, error } = normalizeQuestionInput(req.body, 'update');

    if (error) {
      return fail(res, error, 400);
    }

    const question = await Question.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });

    if (!question) {
      return fail(res, 'Question not found.', 404);
    }

    return ok(res, { question: formatQuestion(question) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    if (!isValidQuestionId(req.params.id)) {
      return fail(res, 'Invalid question id.', 400);
    }

    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return fail(res, 'Question not found.', 404);
    }

    return ok(res, { deletedQuestionId: req.params.id });
  } catch (error) {
    return next(error);
  }
}

export async function toggleQuestion(req, res, next) {
  try {
    if (!isValidQuestionId(req.params.id)) {
      return fail(res, 'Invalid question id.', 400);
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return fail(res, 'Question not found.', 404);
    }

    question.isActive = !question.isActive;
    await question.save();

    return ok(res, {
      question: formatQuestion(question),
      message: `Question ${question.isActive ? 'activated' : 'deactivated'}.`
    });
  } catch (error) {
    return next(error);
  }
}

export async function bulkImportQuestions(req, res, next) {
  try {
    // TODO(admin): parse JSON array, validate each question, insert valid questions.
    return fail(res, 'TODO: implement bulk import.', 501);
  } catch (error) {
    return next(error);
  }
}
