import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const allLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/purchases", label: "Purchases" },
  { to: "/bills", label: "Bills" },
  { to: "/counter-sales", label: "Counter Sales" },
  { to: "/cash-flow", label: "Cash Flow" },
  { to: "/products", label: "Products" },
  { to: "/companies", label: "Companies" },
  { to: "/shops", label: "Shops" },
  { to: "/routes", label: "Routes" },
  { to: "/expenses", label: "Expenses" },
  { to: "/free-products", label: "Free Products" },
  { to: "/breakage", label: "Breakage" },
  { to: "/reports", label: "Reports" },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div style={{
      width: "220px",
      background: "#111111",
      minHeight: "100vh",
      position: "fixed",
      left: 0, top: 0,
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
      borderRight: "4px solid #C8102E"
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid #1f1f1f" }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "2rem",
          fontWeight: 800,
          color: "white",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          lineHeight: 1
        }}>
          <span style={{ color: "#C8102E" }}>INV</span>
          <span>ENTORY</span>
        </div>
        <div style={{
          marginTop: "8px",
          background: "#C8102E",
          display: "inline-block",
          padding: "2px 8px"
        }}>
          <p style={{
            color: "white",
            fontSize: "10px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}>
            {user?.role === "admin" ? "Admin" : user?.username}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: "12px", overflowY: "auto" }}>
        {allLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "11px 24px",
              fontSize: "16px",
              textDecoration: "none",
              transition: "all 0.1s",
              background: isActive ? "#C8102E" : "transparent",
              color: isActive ? "white" : "#c0c0c0",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderLeft: isActive ? "4px solid white" : "4px solid transparent",
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #1f1f1f" }}>
        <p style={{
          color: "#333",
          fontSize: "10px",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.05em",
          textTransform: "uppercase"
        }}>
          © 2026 Inventory
        </p>
      </div>
    </div>
  );
}