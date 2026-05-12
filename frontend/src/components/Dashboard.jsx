import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaTruck,
  FaFileInvoice,
  FaFileAlt,
  FaDollarSign,
  FaBoxes,
  FaClock,
} from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVendors: 0,
    totalInvoices: 0,
    totalBills: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    lowStockItems: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, invoicesRes, billsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-invoices"),
        api.get("/dashboard/recent-bills"),
      ]);
      setStats(statsRes.data);
      setRecentInvoices(invoicesRes.data);
      setRecentBills(billsRes.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Customers",
      value: stats.totalCustomers,
      icon: FaUsers,
      color: "bg-blue-500",
    },
    {
      title: "Vendors",
      value: stats.totalVendors,
      icon: FaTruck,
      color: "bg-green-500",
    },
    {
      title: "Invoices",
      value: stats.totalInvoices,
      icon: FaFileInvoice,
      color: "bg-purple-500",
    },
    {
      title: "Bills",
      value: stats.totalBills,
      icon: FaFileAlt,
      color: "bg-orange-500",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: FaDollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Expenses",
      value: `$${stats.totalExpenses.toFixed(2)}`,
      icon: FaDollarSign,
      color: "bg-red-500",
    },
    {
      title: "Pending Invoices",
      value: stats.pendingInvoices,
      icon: FaClock,
      color: "bg-yellow-500",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: FaBoxes,
      color: "bg-pink-500",
    },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Invoices and Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Invoices
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Invoice #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.InvoiceID} className="hover:bg-gray-50">
                    <td className="table-cell">{invoice.InvoiceNumber}</td>
                    <td className="table-cell">{invoice.CompanyName}</td>
                    <td className="table-cell">
                      {new Date(invoice.InvoiceDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      ${invoice.TotalAmount?.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.Status)}`}
                      >
                        {invoice.Status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="table-cell text-center text-gray-500"
                    >
                      No recent invoices
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Bills
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Bill #</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBills.map((bill) => (
                  <tr key={bill.BillID} className="hover:bg-gray-50">
                    <td className="table-cell">{bill.BillNumber}</td>
                    <td className="table-cell">{bill.CompanyName}</td>
                    <td className="table-cell">
                      {new Date(bill.BillDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      ${bill.TotalAmount?.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.Status)}`}
                      >
                        {bill.Status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentBills.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="table-cell text-center text-gray-500"
                    >
                      No recent bills
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
