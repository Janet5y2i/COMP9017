import React from 'react';
import api from '../api/api.js';
import { useState, useEffect } from 'react';
import quiz_api from '../api/quiz_api';


export default function Attempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await api.get('/quiz/attempts/me');
        setAttempts(res.data);


        if (res.data.length === 0){
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
      <h1 className="text-3xl font-bold text-accent">Past Attempts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attempts?.map((item) =>(
            <div key={item._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden">
              <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">
                {new Date(item.createdAt).toLocaleString()}
                </div>
                <p class="text-2xl font-black text-indigo-700">Score: {item.score}</p>
                <div className="p-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Detail Review</h4>
                  <div className="space-y-3">
                  {item.answers.map((s, index) => (
                    <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-gray-400">Q{index + 1}</span>
                          <span className="text-gray-700 font-medium">{s.selectedAnswer}</span>
                        </div>
                        
                        {/* use colored tag to show is correct or not */}
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          s.isCorrect 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {s.isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </span>
                      </div>
                  ))}
                </div>
                </div>


              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

