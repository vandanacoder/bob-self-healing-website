import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { BrokenModeProvider } from './BrokenModeContext.jsx';
import './App.css';

export default function App() {
  return (
    <BrokenModeProvider>
    <BrowserRouter>
      <header className="site-header">
        <span className="site-title">🩹 Self-Healing Site</span>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Trigger Errors
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
        </nav>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </BrowserRouter>
    </BrokenModeProvider>
  );
}
