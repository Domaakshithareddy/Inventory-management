import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Companies from "./pages/Companies";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Shops from "./pages/Shops";
import AppRoutes from "./pages/Routes";
import Bills from "./pages/Bills";
import Expenses from "./pages/Expenses";
import FreeProducts from "./pages/FreeProducts";
import Reports from "./pages/Reports";
import CounterSales from "./pages/CounterSales";
import Breakage from "./pages/Breakage";

function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "256px", flex: 1, minHeight: "100vh", background: "#F5F5F5" }}>
        <Navbar />
        <main style={{ paddingTop: "56px", padding: "56px 24px 24px 24px" }}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute><Layout><Companies /></Layout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute><Layout><Purchases /></Layout></ProtectedRoute>} />
          <Route path="/shops" element={<ProtectedRoute><Layout><Shops /></Layout></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute><Layout><AppRoutes /></Layout></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><Layout><Bills /></Layout></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
          <Route path="/free-products" element={<ProtectedRoute><Layout><FreeProducts /></Layout></ProtectedRoute>} />
          <Route path="/counter-sales" element={<ProtectedRoute><Layout><CounterSales /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/breakage" element={<ProtectedRoute><Layout><Breakage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}