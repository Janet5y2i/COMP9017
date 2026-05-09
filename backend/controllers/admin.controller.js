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
    const filters = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }

    if (search.length > 0) {
      filters.text = { $regex: search, $options: 'i' };
    }

    const questions = await Question.find(filters).sort({ createdAt: -1 });

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
    const { data, error } = normalizeBulkImportPayload(req.body);

    if (error) {
      return fail(res, error, 400);
    }

    const seenTexts = new Set();
    const existingQuestions = await Question.find({
      text: { $in: data.map((question) => question.text) }
    }).select('text');
    const existingTexts = new Set(
      existingQuestions.map((question) => question.text.trim().toLowerCase())
    );
    const skipped = [];
    const importableQuestions = [];

    data.forEach((question, index) => {
      const normalizedText = question.text.trim().toLowerCase();

      if (seenTexts.has(normalizedText)) {
        skipped.push({
          index,
          text: question.text,
          reason: 'Duplicate question text inside the import payload.'
        });
        return;
      }

      if (existingTexts.has(normalizedText)) {
        skipped.push({
          index,
          text: question.text,
          reason: 'Question text already exists in the database.'
        });
        return;
      }

      seenTexts.add(normalizedText);
      importableQuestions.push(question);
    });

    const createdQuestions =
      importableQuestions.length > 0 ? await Question.insertMany(importableQuestions) : [];

    return ok(
      res,
      {
        importedCount: createdQuestions.length,
        skippedCount: skipped.length,
        questions: createdQuestions.map(formatQuestion),
        skipped
      },
      createdQuestions.length > 0 ? 201 : 200
    );
  } catch (error) {
    return next(error);
  }
}
