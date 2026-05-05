import { useState } from "react";

export default function QuizQuestion({
  question,
  qIdx,
  handleQuizSubmit,
  isLastQuestion
}) {
  const [answered, setAnswered] = useState(false);

  return (
    <>
      <h1 className="text-3xl font-bold">
        Question {qIdx + 1}
      </h1>
      <p className="my-5 text-xl">
        {question.text}
      </p>

      <div>
        {/* Quiz options */}
        {question.options.map(
          (option, idx) => {
            // A radio option for each answer
            return (
              <label key={`q${qIdx}-${idx}`} className="block p-4 bg-surface my-3 border-muted border-2 rounded-xl hover:border-accent hover:text-accent-contrast hover:bg-accent has-checked:bg-accent has-checked:border-accent has-checked:text-accent-contrast">
                <input type="radio" id={`q${qIdx}-${idx}`} name={`q${qIdx}`} value={idx} onChange={() => setAnswered(true)} className="hidden" />
                {option}
              </label>
            );
          }
        )}
      </div>

      <div className="text-right">
      <button type="submit" onClick={handleQuizSubmit} disabled={!answered}>{isLastQuestion ? "Submit" : "Next"}</button>
      </div>
    </>
  );
}