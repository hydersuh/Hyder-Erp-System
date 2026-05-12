import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import SubMain from "./components/SubMain";
import FinancialStatements from "./components/FinancialStatements";
import ChartOfAccounts from "./components/ChartOfAccounts";
import TrialBalance from "./components/TrialBalance";
import Users from "./components/Users";
import Customers from "./components/Customers";
import Vendors from "./components/Vendors";
import Items from "./components/Items";
// import Invoices from "./components/Invoices";
// import Bills from "./components/Bills";
// import Payments from "./components/Payments";
import api from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ERP System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole={user.Role} onLogout={handleLogout} user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/main" element={<Main />} />
              <Route path="/submain" element={<SubMain />} />
              <Route path="/financials" element={<FinancialStatements />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/trialbalance" element={<TrialBalance />} />
              <Route path="/users" element={<Users />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/items" element={<Items />} />
              {/* <Route path="/invoices" element={<Invoices />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/payments" element={<Payments />} />   */}
              {/* <Route path="*" element={<Navigate to="/" />} /> */}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
