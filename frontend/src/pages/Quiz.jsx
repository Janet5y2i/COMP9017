import { useState } from "react";
import QuizQuestion from "../components/QuizQuestion";

const tempQuestions = [
  {
    text: "What is this question? (1)",
    options: [
      "A. aaa",
      "B. bbb",
      "C. ccc",
      "D. ddd"
    ],
    correctAnswer: "A. aaa",
    imageUrl: "",
    isActive: true
  },
  {
    text: "What is this question? (2)",
    options: [
      "A. aaa",
      "B. bbb",
      "C. ccc",
      "D. ddd"
    ],
    correctAnswer: "B. bbb",
    imageUrl: "",
    isActive: true
  },
  {
    text: "What is this question? (3)",
    options: [
      "A. aaa",
      "B. bbb",
      "C. ccc",
      "D. ddd"
    ],
    correctAnswer: "B. bbb",
    imageUrl: "",
    isActive: true
  }
]

export default function Quiz() {
  const [quizIdx, setQuizIdx] = useState(-1);

  const handleQuizSubmit = (event) => {
    event.preventDefault();

    if (quizIdx < tempQuestions.length - 1) {
      setQuizIdx(quizIdx + 1);
      return;
    }

    // Submit answer to API TODO
    console.log("Submit TODO")
  }


  if (quizIdx < 0) {
    return (
      <section className="page">
        <h1>Quiz</h1>
        <button onClick={() => setQuizIdx(0)}>Start</button>
      </section>
    );
  }
  else if (0 <= quizIdx && quizIdx < tempQuestions.length) {

    return (
      <section className="page">
        <form>

          {tempQuestions.map(
            (quiz, qIdx) => {
              return (
                <div key={`q${qIdx}`} hidden={qIdx !== quizIdx}>
                  <QuizQuestion
                    question={quiz}
                    qIdx={qIdx}
                    handleQuizSubmit={handleQuizSubmit}
                    isLastQuestion={qIdx === tempQuestions.length - 1}
                  />
                </div>
              );
            }
          )}

        </form>
      </section>
    );
  }
  else {
    return (
      <section className="page">
        done
      </section>
    );
  }
}

