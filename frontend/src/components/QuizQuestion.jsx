import { useState } from "react";

export default function QuizQuestion({
  question,
  qIdx,
  onButtonClick,
  isLastQuestion
}) {
  const [answered, setAnswered] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Question {qIdx + 1}
      </h1>
      <p className="my-5 text-xl">
        {question.text}
      </p>

      {/* Question image */}
      <div className="flex flex-col items-center w-full">
        {question.imageUrl ? <img src={question.imageUrl} className="w-[70%]" /> : ""}
      </div>

      <div className="my-5">
        {/* Quiz options */}
        {question.options.map(
          (option, idx) => {
            // A radio option for each answer
            return (
              <label key={`q${qIdx}-${idx}`} className="activeShaded block p-4 bg-surface my-3 border-muted border-2 rounded-xl transform-anim hover:border-accent hover:text-accent-contrast hover:bg-accent hover:scale-102 has-checked:bg-accent has-checked:border-accent has-checked:text-accent-contrast">
                <input type="radio" id={`q${qIdx}-${idx}`} name={`q${qIdx}`} value={idx} onChange={() => setAnswered(true)} className="hidden" />
                {option}
              </label>
            );
          }
        )}
      </div>

      <div className="text-right">
        <button
          type={isLastQuestion ? "submit" : "button"}
          onClick={isLastQuestion ? null : onButtonClick}
          disabled={!answered}
        >
          {isLastQuestion ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}