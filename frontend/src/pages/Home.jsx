import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="page">
      <h1>MERN Quiz Game</h1>
      <p>Project scaffold for COMP5347/COMP4347 Assignment 2.</p>
      <div className="button-row">
        <Link className="button-link" to="/quiz">Start quiz</Link>
        <Link className="button-link secondary" to="/leaderboard">Leaderboard</Link>
      </div>
    </section>
  );
}

