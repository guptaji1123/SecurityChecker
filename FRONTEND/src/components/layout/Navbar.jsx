import { NavLink } from "react-router-dom";

const link = ({ isActive }) =>
  `transition-colors ${isActive ? "text-accent" : "text-muted hover:text-ink"}`;

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-line px-8 py-4">
      <span className="font-bold">5 Minute Security Check</span>
      <div className="flex gap-6">
        <NavLink to="/" end className={link}>Home</NavLink>
        <NavLink to="/scan" className={link}>Scan</NavLink>
      </div>
    </nav>
  );
}