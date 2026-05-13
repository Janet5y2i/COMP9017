import { useCallback, useReducer, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDice } from '@fortawesome/free-solid-svg-icons';
import QuizQuestion from "../components/QuizQuestion";
import quiz_api from "../api/quiz_api";
import QuizResult from "../components/QuizResult";

// Enum for quiz state
const QuizState = {
  STARTING: 0,
  ONGOING: 1,
  DONE: 2
}

const initialState = {
  state: QuizState.STARTING,
  questions: [],
  quizIdx: -1,
  result: null
}

// Return the new quiz state based on received action
function reducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        state: QuizState.ONGOING,
        questions: action.questions,
        quizIdx: 0,
        result: null
      };
    
    case "NEXT_QUESTION":
      return {
        ...state,
        quizIdx: state.quizIdx + 1
      };

    case "FINISH":
      return {
        ...state,
        state: QuizState.DONE,
        result: action.result
      };
    
    default:
      return initialState;
  }
}

export default function Quiz() {
  const [errorMsg, setErrorMsg] = useState(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Get the quiz data when click start button
  const handleStartClick = useCallback(() => {
    quiz_api.getQuizQuestion()
      .then((questions) => {
        dispatch({
          type: "START",
          questions: questions
        });
      })
      .catch((error) => {
        // console.error(error);
        setErrorMsg(error);
      })
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formJson = Object.fromEntries(formData.entries());

    let questionIds = [];
    let answers = [];
    for (let i = 0; i < state.questions.length; i++) {
      questionIds.push(state.questions[i].id);
      answers.push(Number(formJson[`q${i}`]));
    }

    // Submit answer to API
    quiz_api.submitAnswer(questionIds, answers)
      .then((res) => {
        dispatch({
          type: "FINISH",
          result: res
        })
      });
  }, [state]);

  // Quiz page UI based on quiz state
  switch (state.state) {
    case QuizState.STARTING:
      return (
        <section className="page flex flex-col items-center">
          <FontAwesomeIcon icon={faDice} className='text-7xl mb-7 text-orange-600' />
          <h1 className="text-3xl font-bold text-accent">Quiz Game</h1>
          <p className="my-5 text-center w-[70%]">
            This is a multiple choice quiz game. Each question have 4 possible answers, with only one correct answer. There is no time limit, and the total score will be displayed at the end. Have fun!
          </p>
          <button onClick={handleStartClick}>
            {errorMsg ? "Retry" : "Start now!"}
          </button>
          <p hidden={!errorMsg} className="mt-5">
            Could not load quiz at the moment. Please try again later.
          </p>
        </section>
      );

    case QuizState.ONGOING:
      return (
        <section className="page">
          <form onSubmit={handleSubmit}>

            {state.questions.map(
              (quiz, qIdx, arr) => {
                return (
                  <div key={`q${qIdx}`} hidden={qIdx !== state.quizIdx}>
                    <QuizQuestion
                      question={quiz}
                      qIdx={qIdx}
                      nQuestions={arr.length}
                      onButtonClick={() => dispatch({ type: "NEXT_QUESTION" })}
                      isLastQuestion={qIdx === state.questions.length - 1}
                    />
                  </div>
                );
              }
            )}

          </form>
        </section>
      );

    case QuizState.DONE:
      return (
        <section className="page">
          <QuizResult result={state.result} />
        </section>
      );

    default: // Unreachable
      return <div>Unreachable</div>;
  }
}

