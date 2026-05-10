import { useEffect, useState } from "react";
import quiz_api from "../api/quiz_api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Attempts() {
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);

  // Get attempt data when load page
  useEffect(() => {
    quiz_api.getAttemptHistory()
      .then(res => {
        console.log(res);
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

  if (!scores) {
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
          <li className='w-full font-bold mt-3 mb-5'>
            <span className='w-[35%] inline-block'>
              Score
            </span>
            <span className='w-[65%] inline-block'>
              Attempted At
            </span>
          </li>

          {scores.map(score => (
            <li className='w-full bg-line py-4 my-3 rounded-xl shadow transform-anim hover:scale-x-102 hover:scale-y-105 hover:font-bold'>
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

