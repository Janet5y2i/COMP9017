import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import quiz_api from '../api/quiz_api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leaderboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    quiz_api.getLeaderBoard()
      .then(res => {
        setData(res);
        console.log(res);
      })
      .catch(error => {
        setData(null);
        console.error(error);
      });
  }, []);

  return (
    <section className="page flex flex-col items-center">
      <FontAwesomeIcon icon={faTrophy} className='text-7xl mb-5 text-yellow-500' />
      <h1 className="text-3xl font-bold text-accent">
        Leaderboard
      </h1>

      {data ?
        data.length > 0 ?
          <ul className='w-full text-center'>


            <li className='w-full font-bold mt-3 mb-5 flex items-center'>
              <span className='w-[15%] inline-block'>Rank</span>
              <span className='w-[65%] inline-block'>Username</span>
              <span className='w-[20%] inline-block'>Highest Score Achieved</span>
            </li>

            {data.map((entry, index) => (
              <li key={`user${index}`} className='w-full bg-line py-4 my-3 rounded-xl shadow transform-anim hover:scale-x-102 hover:scale-y-105 hover:font-bold'>
                <span className='w-[15%] inline-block'>{index + 1}</span>
                <span className='w-[65%] inline-block'>{entry.user.username}</span>
                <span className='w-[20%] inline-block'>{entry.maxUserScore}</span>
              </li>
            ))}
          </ul> :

          // No user has played -> No leaderboard data
          <div className='my-5'>
            <p>No user has attempted the quiz. Maybe you can be the first to try?</p>
          </div> :

        // Error case, cannot get leaderboard data
        <LoadingSpinner size={"10"} />
      }
    </section>
  );
}

