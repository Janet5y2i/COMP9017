import mongoose from 'mongoose';
import { z } from 'zod';
import Question from '../models/Question.js';
import { fail, ok } from '../utils/envelope.js';

const optionSchema = z
  .string()
  .trim()
  .min(1, 'Each answer option is required.')
  .max(200, 'Each answer option must be 200 characters or fewer.');

const questionInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(10, 'Question text must be at least 10 characters.')
      .max(500, 'Question text must be 500 characters or fewer.'),
    options: z.array(optionSchema).length(4, 'A question must have exactly four options.'),
    correctAnswer: optionSchema,
    imageUrl: z.union([z.string().trim().url('Image URL must be a valid URL.'), z.literal('')]).optional(),
    isActive: z.boolean().optional()
  })
  .superRefine((value, context) => {
    const normalizedOptions = value.options.map((option) => option.trim());
    const uniqueOptions = new Set(normalizedOptions);

    if (uniqueOptions.size !== normalizedOptions.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Answer options must be unique.',
        path: ['options']
      });
    }

    if (!normalizedOptions.includes(value.correctAnswer.trim())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Correct answer must match one of the four options.',
        path: ['correctAnswer']
      });
    }
  });

function normalizeQuestionInput(payload, mode = 'create') {
  const parsed = questionInputSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid question payload.' };
  }

  return {
    data: {
      text: parsed.data.text.trim(),
      options: parsed.data.options.map((option) => option.trim()),
      correctAnswer: parsed.data.correctAnswer.trim(),
      imageUrl: parsed.data.imageUrl?.trim() || undefined,
      ...(mode === 'create' ? { isActive: parsed.data.isActive ?? true } : {}),
      ...(mode === 'update' && typeof parsed.data.isActive === 'boolean'
        ? { isActive: parsed.data.isActive }
        : {})
    }
  };
}

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
