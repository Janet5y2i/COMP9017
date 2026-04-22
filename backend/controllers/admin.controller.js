import { fail } from '../utils/envelope.js';

export async function listQuestions(req, res, next) {
  try {
    // TODO(admin): list questions with filters/search if useful.
    return fail(res, 'TODO: implement admin question listing.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    // TODO(admin): validate and create one question.
    return fail(res, 'TODO: implement create question.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    // TODO(admin): validate and update question by id.
    return fail(res, 'TODO: implement update question.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    // TODO(admin): delete question by id.
    return fail(res, 'TODO: implement delete question.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function toggleQuestion(req, res, next) {
  try {
    // TODO(admin): toggle active/inactive status.
    return fail(res, 'TODO: implement toggle question.', 501);
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

