import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="auth-card">
      <h1>SWD392 AI Oral Examination</h1>
      <p className="muted">Please sign in to continue.</p>
      <div className="stack">
        <input className="input" placeholder="Username" />
        <input className="input" type="password" placeholder="Password" />
        <button type="button" className="btn">
          Login
        </button>
        <Link to="/404">Forgot password?</Link>
      </div>
    </div>
  );
}
