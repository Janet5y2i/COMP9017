import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import quiz_api from '../api/quiz_api';

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
      // TODO use table here with table headers
        <ul className='w-full'>
          {data.map((entry, index) => (
            <li key={`user${index}`} className='w-full'>
              <div className='flex justify-between'>
                <span>{index + 1}</span>
                <span>{entry.user.username}</span>
                <span>{entry.maxUserScore}</span>
              </div>
            </li>
          ))}
        </ul> :

        // Error case, cannot get leaderboard data
        <div className='my-3'>
          <p>Could not get leaderboard data. Please try again later.</p>
        </div>}
    </section>
  );
}

