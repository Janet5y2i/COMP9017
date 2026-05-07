export default function QuizResult({ result }) {
  return (
    <div className="flex flex-col">
      <h1>Quiz Result</h1>
      <h2>
        Total score:
      </h2>
      <span>{result.score}</span>

      <div>
        <button onClick={() => window.location.reload()}>Try again</button>
        <a className="button-link" href="/leaderboard">Leaderboard</a>
      </div>

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