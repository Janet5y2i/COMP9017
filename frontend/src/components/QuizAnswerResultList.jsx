import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-regular-svg-icons';

export default function QuizAnswerResultList({ hidden, answers }) {
  return (
    <ul hidden={hidden} className='w-full px-5 mt-2 bg-line py-5 rounded-xl'>
      {answers.map((answer, index) => (
        <li key={`q${index}`} className='flex my-3 items-center'>
          <p className='font-bold'>Question {index + 1} </p>
          <div className='grow border-b border-dashed mx-2 h-3'></div>

          <span className={`px-2 py-1 rounded text-xs font-bold ${answer.isCorrect
            ? 'bg-green-100 text-green-700 dark:text-green-100 dark:bg-green-700'
            : 'bg-red-100 text-red-700 dark:text-red-100 dark:bg-red-700'
            }`}>
            <FontAwesomeIcon
              icon={answer.isCorrect ? faCircleCheck : faCircleXmark}
              className="mr-1"
            />
            {answer.isCorrect ? 'CORRECT' : 'INCORRECT'}
          </span>
        </li>
      ))}
    </ul>
  )
}