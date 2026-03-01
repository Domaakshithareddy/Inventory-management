import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      <button onClick={onMenuClick} className="text-gray-500 hover:text-primary transition-colors">
        ☰
      </button>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-dark">{user?.username}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{user?.role}</p>
        </div>
        <button onClick={logout} className="btn-outline text-xs px-3 py-1">
          Logout
        </button>
      </div>
    </div>
  );
}