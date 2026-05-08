import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp, faSquarePollVertical } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import Confetti from 'react-confetti';

export default function QuizResult({ result }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <Confetti recycle={false} gravity={0.25} />
      <FontAwesomeIcon icon={faSquarePollVertical} className='text-7xl mb-5 text-accent' />
      <h1 className="text-3xl font-bold">Quiz Result</h1>
      <h2 className='font-bold text-xl'>
        Total score:
      </h2>
      <span className='font-bold text-8xl my-8'>
        {result.score}
      </span>

      <div className='flex gap-5'>
        <a className="button-link" href="/leaderboard">
          Leaderboard
        </a>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>

      {/* Drop down box for question results */}
      <div className='flex justify-between w-full bg-line p-3 items-center rounded-xl mb-3 mt-8 hover:shaded active:shaded-extra cursor-pointer font-bold' onClick={() => setShowAnswer(!showAnswer)}>
        <p>Show result per question</p>
        <FontAwesomeIcon icon={showAnswer ? faAngleDown : faAngleUp} />
      </div>

      <ul hidden={!showAnswer} className='w-full px-5 mt-2 bg-line py-5 rounded-xl'>
        {result.answers.map((answer, index) => (
          <li key={`q${index}`} className='flex my-3 items-center'>
            <p className='font-bold'>Question {index + 1} </p>
            <div className='grow border-b border-dashed mx-2 h-3'></div>
            <FontAwesomeIcon
              icon={answer.isCorrect ? faCircleCheck : faCircleXmark}
              className={`text-lg ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}
            />
          </li>
        ))}
      </ul>

    </div>
  );
}