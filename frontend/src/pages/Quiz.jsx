import { useCallback, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDice } from '@fortawesome/free-solid-svg-icons';
import QuizQuestion from "../components/QuizQuestion";
import quiz_api from "../api/quiz_api";
import QuizResult from "../components/QuizResult";

export default function Quiz() {
  const [questions, setQuestion] = useState([]);
  const [quizIdx, setQuizIdx] = useState(-1);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Get the quiz data when first load the quiz page
  const handleStartClick = useCallback(() => {
    quiz_api.getQuizQuestion()
      .then((questions) => {
        // console.log(questions);
        setQuestion(questions);
        setQuizIdx(0);
      })
      .catch((error) => {
        // console.error(error);
        setErrorMsg(error);
      })
  }, []);

  const onButtonClick = useCallback(() => {
    if (quizIdx < questions.length - 1) {
      setQuizIdx(quizIdx + 1);
    }
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formJson = Object.fromEntries(formData.entries());

    let questionIds = [];
    let answers = [];
    for (let i = 0; i < questions.length; i++) {
      questionIds.push(questions[i].id);
      answers.push(Number(formJson[`q${i}`]));
    }

    // Submit answer to API
    quiz_api.submitAnswer(questionIds, answers)
      .then((res) => {
        console.log("QUIZ RESULT:", res);
        setResult(res);
      });
  }, [questions]);


  if (quizIdx < 0) {
    // Quiz starting box
    return (
      // TODO make prettier
      <section className="page flex flex-col items-center">
        <FontAwesomeIcon icon={faDice} className='text-7xl mb-7 text-orange-600' />
        <h1 className="text-3xl font-bold text-accent">Quiz Game</h1>
        <p className="my-5 text-center w-[70%]">
          This is a multiple choice quiz game. Each question have 4 possible answers, with only one correct answer. There is no time limit, and the total score will be displayed at the end. Have fun!
        </p>
        <button onClick={handleStartClick} disabled={!questions}>
          {errorMsg ? "Retry" : "Start now!"}
        </button>
        <p hidden={!errorMsg} className="mt-5">
          Could not load quiz at the moment. Please try again later.
        </p>
      </section>
    );
  }
  else if (0 <= quizIdx && quizIdx < questions.length && !result) {

    return (
      <section className="page">
        <form onSubmit={handleSubmit}>

          {questions.map(
            (quiz, qIdx) => {
              return (
                <div key={`q${qIdx}`} hidden={qIdx !== quizIdx}>
                  <QuizQuestion
                    question={quiz}
                    qIdx={qIdx}
                    onButtonClick={onButtonClick}
                    isLastQuestion={qIdx === questions.length - 1}
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
        <QuizResult result={result} />
      </section>
    );
  }
}

