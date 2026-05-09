import { z } from 'zod';

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
    imageUrl: z
      .union([z.string().trim().url('Image URL must be a valid URL.'), z.literal('')])
      .optional(),
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

const bulkImportSchema = z.union([
  z.array(questionInputSchema),
  z.object({ questions: z.array(questionInputSchema) })
]);

function buildNormalizedQuestion(parsedData, mode = 'create') {
  return {
    text: parsedData.text.trim(),
    options: parsedData.options.map((option) => option.trim()),
    correctAnswer: parsedData.correctAnswer.trim(),
    imageUrl: parsedData.imageUrl?.trim() || undefined,
    ...(mode === 'create' ? { isActive: parsedData.isActive ?? true } : {}),
    ...(mode === 'update' && typeof parsedData.isActive === 'boolean'
      ? { isActive: parsedData.isActive }
      : {})
  };
}

export function normalizeQuestionInput(payload, mode = 'create') {
  const parsed = questionInputSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Invalid question payload.',
      issues: parsed.error.issues
    };
  }

  return { data: buildNormalizedQuestion(parsed.data, mode) };
}

export function normalizeBulkImportPayload(payload) {
  const parsed = bulkImportSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Invalid bulk import payload.',
      issues: parsed.error.issues
    };
  }

  const questions = Array.isArray(parsed.data) ? parsed.data : parsed.data.questions;

  return {
    data: questions.map((question) => buildNormalizedQuestion(question, 'create'))
  };
}
