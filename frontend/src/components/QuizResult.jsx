import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollVertical } from '@fortawesome/free-solid-svg-icons';
import Confetti from 'react-confetti';

export default function QuizResult({ result }) {
  
  return (
    <div className="flex flex-col items-center">
      <Confetti recycle={false} gravity={0.25}/>
      <FontAwesomeIcon icon={faSquarePollVertical} className='text-7xl mb-5 text-accent' />
      <h1 className="text-3xl font-bold">Quiz Result</h1>
      <h2 className='font-bold text-xl'>
        Total score:
      </h2>
      <span className='font-bold text-7xl my-5'>
        {result.score}
      </span>

      <div className='flex gap-5'>
        <a className="button-link" href="/leaderboard">
          Leaderboard
        </a>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>

      {/* TODO drop down box & styling for question results */}
      <ul>
        {result.answers.map((answer, index) => (
          <li key={`q${index}`}>
            <p>Question {index + 1}</p>
            <p>{answer.isCorrect ? "T" : "F"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}