import { useCallback, useEffect, useState } from "react";
import quiz_api from "../api/quiz_api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faAngleUp, faAngleDown } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";

// Custom enum to keep track of current history order
const ScoreOrder = {
  SCORE_ASC: 0,
  SCORE_DESC: 1,
  TIME_ASC: 2,
  TIME_DESC: 3,
}

export default function Attempts() {
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);
  const [scoreOrder, setScoreOrder] = useState(ScoreOrder.TIME_DESC);

  const changeOrder = useCallback((clickedType) => {
    // Exit if score not set
    if (!scores) return;

    // Set the score order based on the clicked button,
    // then actually change the score order
    if (clickedType === 'score') { // Clicked order is score-based
      if (scoreOrder === ScoreOrder.SCORE_DESC) {
        setScoreOrder(ScoreOrder.SCORE_ASC);
        setScores(scores.toReversed());
      }
      else {
        // Set the order to score highest to lowest in all other cases
        setScoreOrder(ScoreOrder.SCORE_DESC);
        setScores(scores.toSorted((s1, s2) => s2.score - s1.score));
      }
    }
    else { // Clicked order is time-based
      if (scoreOrder === ScoreOrder.TIME_DESC) {
        setScoreOrder(ScoreOrder.TIME_ASC);
        setScores(scores.toReversed());
      }
      else {
        // Set the order to time highest to lowest in all other cases
        setScoreOrder(ScoreOrder.TIME_DESC);
        setScores(scores.toSorted((s1, s2) => s2.time.getTime() - s1.time.getTime()));
      }
    }
  }, [scoreOrder, scores]);

  // Get attempt data when load page
  useEffect(() => {
    quiz_api.getAttemptHistory()
      .then(res => {
        // console.log(res);
        setUser(res.user);
        setScores(res.scores.map(score => ({
          score: score.score,
          time: new Date(Date.parse(score.createdAt)),
        })));
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  if (!user || !scores) {
    return (
      <section className="page">
        <LoadingSpinner size={"10"} />
      </section>
    )
  }
  else {
    return (
      <section className="page flex flex-col items-center">
        <FontAwesomeIcon icon={faBook} className='text-7xl mb-5 text-amber-700' />
        <h1 className="text-3xl font-bold text-accent">
          Past Attempts for {user.username}
        </h1>

        <ul className="w-full text-center my-3">
          <li className='w-full font-bold mt-3 mb-3'>
            <span className='w-[35%] inline-block transform-anim hover:bg-line py-1 rounded-lg active:shaded' onClick={() => changeOrder('score')}>
              <span className="mr-1">Score</span>
              {scoreOrder === ScoreOrder.SCORE_ASC ?
                <FontAwesomeIcon icon={faAngleUp} />
                : scoreOrder === ScoreOrder.SCORE_DESC ?
                  <FontAwesomeIcon icon={faAngleDown} />
                  : ""}
            </span>
            <span className='w-[65%] inline-block transform-anim hover:bg-line py-1 rounded-lg active:shaded' onClick={() => changeOrder('time')}>
              <span className="mr-1">Attempted At</span>
              {scoreOrder === ScoreOrder.TIME_ASC ?
                <FontAwesomeIcon icon={faAngleUp} />
                : scoreOrder === ScoreOrder.TIME_DESC ?
                  <FontAwesomeIcon icon={faAngleDown} />
                  : ""}
            </span>
          </li>

          {scores.map((score, idx) => (
            <li key={`score-${idx}`} className='w-full bg-line py-4 my-3 rounded-xl shadow transform-anim hover:scale-x-102 hover:scale-y-105 hover:font-bold'>
              <span className='w-[35%] inline-block'>{score.score}</span>
              <span className='w-[65%] inline-block'>
                {score.time.toLocaleString('en-au')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

}

