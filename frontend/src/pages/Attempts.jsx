import React from 'react';
import api from '../api/api.js';
import { useState, useEffect } from 'react';


export default function Attempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await api.get('/quiz/attempts/me');

        if (res.data.success) {
          setAttempts(res.data);
        } else {
          alert('No attempts found.');
        }
      } catch (error) {
        alert('Could not fetch attempts data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);
  return (
    <section className="page">
      <h1>Past Attempts</h1>
      <div>
          {attempts.map((item) =>(
            <div className="max-w-sm rounded overflow-hidden shadow-lg">
              <div className="px-6 py-4">
                <div class="font-bold text-xl mb-2">{item.timestamps}</div>
                <p class="text-gray-700 text-base">Score: {item.score}</p>
                {item.answers.forEach(s => (
                  <p class="text-gray-700 text-base">Question: {s}</p>
                ))}

              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

