import { Link, NavLink, Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Layout() {
  const { user, dispatch } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">Quiz Game</Link>
        <nav>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/attempts">Attempts</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="actions">
          <button aria-label="Toggle dark mode" className="icon-button" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <button onClick={() => dispatch({ type: 'LOGOUT' })}>Log out</button>
          ) : (
            <Link className="button-link" to="/login">Log in</Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

