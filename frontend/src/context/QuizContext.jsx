import { createContext, useContext, useMemo, useReducer } from 'react';

const QuizContext = createContext(null);

const initialState = {
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  status: 'idle',
  result: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'QUIZ_LOADED':
      return { ...initialState, questions: action.payload.questions, status: 'ready' };
    case 'ANSWER_SELECTED':
      return {
        ...state,
        selectedAnswers: {
          ...state.selectedAnswers,
          [action.payload.questionId]: action.payload.selectedAnswer
        }
      };
    case 'NEXT_QUESTION':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'QUIZ_SUBMITTED':
      return { ...state, status: 'completed', result: action.payload };
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error('useQuiz must be used inside QuizProvider');
  }

  return context;
}

