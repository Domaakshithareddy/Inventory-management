import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const allLinks = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/inventory", label: "Inventory", icon: "📦" },
  { to: "/purchases", label: "Purchases", icon: "🛒" },
  { to: "/bills", label: "Bills", icon: "🧾" },
  { to: "/counter-sales", label: "Counter Sales", icon: "🏷️" },
  { to: "/products", label: "Products", icon: "📋" },
  { to: "/companies", label: "Companies", icon: "🏢" },
  { to: "/shops", label: "Shops", icon: "🏪" },
  { to: "/routes", label: "Routes", icon: "🗺️" },
  { to: "/expenses", label: "Expenses", icon: "💸" },
  { to: "/free-products", label: "Free Products", icon: "🎁" },
  { to: "/reports", label: "Reports", icon: "📈" },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div style={{ width: "256px", background: "#111111", minHeight: "100vh", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", zIndex: 20 }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span style={{ color: "#C8102E" }}>INV</span>ENTORY
        </h1>
        <p style={{ color: "#6b7280", fontSize: "11px", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {user?.role === "admin" ? "Admin — All Godowns" : user?.username}
        </p>
      </div>

      <nav style={{ flex: 1, paddingTop: "8px", overflowY: "auto" }}>
        {allLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 24px", fontSize: "14px", textDecoration: "none",
              transition: "all 0.15s",
              background: isActive ? "#C8102E" : "transparent",
              color: isActive ? "white" : "#9ca3af",
              borderRight: isActive ? "4px solid #fca5a5" : "4px solid transparent",
              fontWeight: isActive ? 500 : 400,
            })}
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "16px 24px", borderTop: "1px solid #1f2937" }}>
        <p style={{ color: "#4b5563", fontSize: "11px" }}>© 2026 Inventory System</p>
      </div>
    </div>
  );
}