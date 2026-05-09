import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api/api.js';

const questionFormSchema = z.object({
  text: z.string().trim().min(10, 'Question text must be at least 10 characters.').max(500),
  imageUrl: z.union([z.string().trim().url('Enter a valid image URL.'), z.literal('')]),
  optionA: z.string().trim().min(1, 'Option A is required.').max(200),
  optionB: z.string().trim().min(1, 'Option B is required.').max(200),
  optionC: z.string().trim().min(1, 'Option C is required.').max(200),
  optionD: z.string().trim().min(1, 'Option D is required.').max(200),
  correctAnswerIndex: z.coerce.number().int().min(0).max(3)
});

const emptyValues = {
  text: '',
  imageUrl: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswerIndex: 0
};

const defaultImportText = `[
  {
    "text": "Which image format supports transparency?",
    "options": ["PNG", "JPEG", "BMP", "TIFF"],
    "correctAnswer": "PNG",
    "imageUrl": "https://example.com/sample-image.png",
    "isActive": true
  }
]`;

function buildPayload(values) {
  const options = [values.optionA, values.optionB, values.optionC, values.optionD].map((option) =>
    option.trim()
  );

  return {
    text: values.text.trim(),
    imageUrl: values.imageUrl.trim(),
    options,
    correctAnswer: options[values.correctAnswerIndex]
  };
}

function buildFormValues(question) {
  const correctAnswerIndex = question.options.findIndex((option) => option === question.correctAnswer);

  return {
    text: question.text,
    imageUrl: question.imageUrl || '',
    optionA: question.options[0] || '',
    optionB: question.options[1] || '',
    optionC: question.options[2] || '',
    optionD: question.options[3] || '',
    correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0
  };
}

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingQuestionId, setTogglingQuestionId] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [bulkImportText, setBulkImportText] = useState(defaultImportText);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: emptyValues
  });

  async function loadQuestions() {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/admin/questions');
      setQuestions(response.data.questions);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function onSubmit(values) {
    try {
      setIsSaving(true);
      setError('');
      setFeedback('');

      const payload = buildPayload(values);

      if (editingQuestionId) {
        await api.put(`/admin/questions/${editingQuestionId}`, payload);
        setFeedback('Question updated.');
      } else {
        await api.post('/admin/questions', payload);
        setFeedback('Question created.');
      }

      reset(emptyValues);
      setEditingQuestionId(null);
      await loadQuestions();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(question) {
    setEditingQuestionId(question.id);
    setFeedback('');
    setError('');
    reset(buildFormValues(question));
  }

  function cancelEditing() {
    setEditingQuestionId(null);
    setFeedback('');
    setError('');
    reset(emptyValues);
  }

  async function handleDelete(questionId) {
    const confirmed = window.confirm('Delete this question? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setFeedback('');
      await api.delete(`/admin/questions/${questionId}`);

      if (editingQuestionId === questionId) {
        cancelEditing();
      }

      setFeedback('Question deleted.');
      await loadQuestions();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleToggle(question) {
    const actionLabel = question.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(`Do you want to ${actionLabel} this question?`);

    if (!confirmed) {
      return;
    }

    try {
      setTogglingQuestionId(question.id);
      setError('');
      setFeedback('');

      const response = await api.patch(`/admin/questions/${question.id}/toggle`);
      const updatedQuestion = response.data.question;

      setQuestions((currentQuestions) =>
        currentQuestions.map((currentQuestion) =>
          currentQuestion.id === updatedQuestion.id ? updatedQuestion : currentQuestion
        )
      );
      setFeedback(response.data.message);
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setTogglingQuestionId(null);
    }
  }

  async function handleBulkImport(event) {
    event.preventDefault();

    try {
      setIsImporting(true);
      setError('');
      setFeedback('');

      const parsedPayload = JSON.parse(bulkImportText);
      const response = await api.post('/admin/questions/bulk-import', parsedPayload);

      setFeedback(
        `Imported ${response.data.importedCount} question${response.data.importedCount === 1 ? '' : 's'}.`
      );
      await loadQuestions();
    } catch (importError) {
      if (importError instanceof SyntaxError) {
        setError('Bulk import JSON is not valid. Please check the format and try again.');
      } else {
        setError(importError.message);
      }
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="page border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              Question CRUD
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Create, edit, and delete image-based quiz questions. Active toggle and bulk import can
              layer onto this screen next.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-900/80 dark:bg-teal-950/40 dark:text-teal-100">
            {questions.length} question{questions.length === 1 ? '' : 's'} loaded
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="page border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Existing Questions
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Questions are shown newest first.
              </p>
            </div>
            <button className="button-link secondary" onClick={loadQuestions} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No questions yet. Add your first quiz item from the form.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {questions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/40"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                          {question.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {question.imageUrl ? (
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                            Image question
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                            No image
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {question.text}
                        </h3>
                        {question.imageUrl ? (
                          <a
                            className="mt-2 inline-block text-sm font-medium text-teal-700 underline decoration-teal-300 underline-offset-4 dark:text-teal-300"
                            href={question.imageUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open image URL
                          </a>
                        ) : null}
                      </div>

                      <ol className="grid gap-2 text-sm text-slate-700 dark:text-slate-200">
                        {question.options.map((option) => (
                          <li
                            key={option}
                            className={`rounded-xl border px-3 py-2 ${
                              option === question.correctAnswer
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                            }`}
                          >
                            {option}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="button-link secondary"
                        disabled={togglingQuestionId === question.id}
                        onClick={() => handleToggle(question)}
                        type="button"
                      >
                        {togglingQuestionId === question.id
                          ? 'Updating...'
                          : question.isActive
                            ? 'Set inactive'
                            : 'Set active'}
                      </button>
                      <button
                        className="button-link secondary"
                        onClick={() => startEditing(question)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(question.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="page border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {editingQuestionId ? 'Edit Question' : 'Create Question'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Build one multiple-choice question with four options and one correct answer.
              </p>
            </div>
            {editingQuestionId ? (
              <button className="button-link secondary" onClick={cancelEditing} type="button">
                Cancel
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Question text
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-teal-400 dark:focus:ring-teal-900"
                placeholder="Which image format supports transparency by default?"
                {...register('text')}
              />
              {errors.text ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">{errors.text.message}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Image URL
              </span>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-teal-400 dark:focus:ring-teal-900"
                placeholder="https://example.com/question-image.png"
                {...register('imageUrl')}
              />
              {errors.imageUrl ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  {errors.imageUrl.message}
                </p>
              ) : null}
            </label>

            <div className="grid gap-4">
              {[
                ['optionA', 'Option A'],
                ['optionB', 'Option B'],
                ['optionC', 'Option C'],
                ['optionD', 'Option D']
              ].map(([name, label]) => (
                <label className="block space-y-2" key={name}>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-teal-400 dark:focus:ring-teal-900"
                    {...register(name)}
                  />
                  {errors[name] ? (
                    <p className="text-sm text-rose-600 dark:text-rose-300">
                      {errors[name].message}
                    </p>
                  ) : null}
                </label>
              ))}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Correct answer
              </span>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-teal-400 dark:focus:ring-teal-900"
                {...register('correctAnswerIndex')}
              >
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
                {error}
              </div>
            ) : null}

            {feedback ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
                {feedback}
              </div>
            ) : null}

            <button className="w-full justify-center" disabled={isSaving} type="submit">
              {isSaving
                ? editingQuestionId
                  ? 'Saving changes...'
                  : 'Creating question...'
                : editingQuestionId
                  ? 'Save changes'
                  : 'Create question'}
            </button>
          </form>
        </section>
      </div>

      <section className="page border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Bulk Import</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Paste a JSON array of question objects to import multiple image-based questions at once.
            </p>
          </div>
          <button
            className="button-link secondary"
            onClick={() => setBulkImportText(defaultImportText)}
            type="button"
          >
            Reset sample
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleBulkImport}>
          <textarea
            className="min-h-72 w-full rounded-2xl border border-slate-300 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-black dark:text-slate-50 dark:focus:border-teal-400 dark:focus:ring-teal-900"
            onChange={(event) => setBulkImportText(event.target.value)}
            spellCheck={false}
            value={bulkImportText}
          />

          <div className="flex flex-wrap gap-3">
            <button disabled={isImporting} type="submit">
              {isImporting ? 'Importing questions...' : 'Import questions'}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
