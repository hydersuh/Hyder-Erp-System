// src/components/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaUserFriends,
  FaTruck,
  FaBoxes,
  FaFileInvoice,
  FaFileAlt,
  FaCreditCard,
  FaChartLine,
  FaBook,
  FaBalanceScale,
  FaMoneyBillWave,
  FaPercent,
  FaPlug,
  FaEnvelope,
  FaCog,
  FaFileAlt as FaDoc,
  FaSearch,
  FaLayerGroup,
  FaBuilding,
  FaHandshake,
} from "react-icons/fa";

const Sidebar = ({ userRole, onLogout, user }) => {
  // Define menu items with categories
  const menuSections = [
    {
      title: "MAIN NAVIGATION",
      items: [
        {
          path: "/",
          label: "Dashboard",
          icon: FaHome,
          roles: ["admin", "user"],
        },
        {
          path: "/dashboard",
          label: "Analytics",
          icon: FaChartLine,
          roles: ["admin", "user"],
        },
      ],
    },
    {
      title: "BUSINESS PARTNERS",
      items: [
        {
          path: "/customers",
          label: "Customers",
          icon: FaUserFriends,
          roles: ["admin", "user"],
        },
        {
          path: "/vendors",
          label: "Vendors",
          icon: FaTruck,
          roles: ["admin", "user"],
        },
        {
          path: "/users",
          label: "System Users",
          icon: FaUsers,
          roles: ["admin"],
        },
      ],
    },
    {
      title: "TRANSACTIONS",
      items: [
        {
          path: "/items",
          label: "Products & Services",
          icon: FaBoxes,
          roles: ["admin", "user"],
        },
        {
          path: "/invoices",
          label: "Sales Invoices",
          icon: FaFileInvoice,
          roles: ["admin", "user"],
        },
        {
          path: "/bills",
          label: "Supplier Bills",
          icon: FaFileAlt,
          roles: ["admin", "user"],
        },
        {
          path: "/payments",
          label: "Payment Tracker",
          icon: FaCreditCard,
          roles: ["admin", "user"],
        },
        {
          path: "/inventory/transactions",
          label: "Stock Movements",
          icon: FaBoxes,
          roles: ["admin", "user"],
        },
      ],
    },
    {
      title: "ACCOUNTING & FINANCE",
      items: [
        {
          path: "/chart-of-accounts",
          label: "Chart of Accounts",
          icon: FaLayerGroup,
          roles: ["admin", "user"],
        },
        {
          path: "/journalentries",
          label: "Journal Entries",
          icon: FaBook,
          roles: ["admin", "user"],
        },
        {
          path: "/trialbalance",
          label: "Trial Balance",
          icon: FaSearch,
          roles: ["admin", "user"],
        },
        {
          path: "/financials",
          label: "IFRS Financials",
          icon: FaBalanceScale,
          roles: ["admin", "user"],
        },
        {
          path: "/taxrates",
          label: "Tax Configurations",
          icon: FaPercent,
          roles: ["admin"],
        },
        {
          path: "/currencies",
          label: "Multi-Currency",
          icon: FaMoneyBillWave,
          roles: ["admin"],
        },
      ],
    },
    {
      title: "SYSTEM & INTEGRATIONS",
      items: [
        {
          path: "/documents",
          label: "Document Vault",
          icon: FaDoc,
          roles: ["admin", "user"],
        },
        {
          path: "/email-templates",
          label: "Email Templates",
          icon: FaEnvelope,
          roles: ["admin"],
        },
        {
          path: "/webhooks",
          label: "API Webhooks",
          icon: FaPlug,
          roles: ["admin"],
        },

        {
          path: "/report-configs",
          label: "Report Builder",
          icon: FaCog,
          roles: ["admin"],
        },
      ],
    },
  ];

  // Helper function to check if user has access to an item
  const hasAccess = (itemRoles) => itemRoles.includes(userRole);
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl">
      {/* Header with new Title */}
      <div className="p-5 border-b border-gray-800 bg-gray-900">
        <h1 className="text-xl font-bold flex items-center">
          <FaBuilding className="mr-2 text-primary-400" />
          <span className="tracking-wide">Nexus ERP</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Enterprise Resource Planning
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
        <nav className="px-3 space-y-6">
          {menuSections.map((section, idx) => {
            // Filter items based on user role
            const visibleItems = section.items.filter((item) =>
              hasAccess(item.roles),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${
                            isActive
                              ? "bg-primary-600 text-white shadow-md"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`
                        }
                      >
                        <Icon
                          className={`w-5 h-5 mr-3 transition-colors ${({ isActive }) => (isActive ? "text-white" : "text-gray-400 group-hover:text-white")}`}
                        />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                        {/* Optional: Add a badge or indicator for active routes */}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center mb-4 p-2 rounded-lg bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-inner">
            <span className="text-sm font-bold uppercase">
              {user?.FullName?.charAt(0) || user?.Username?.charAt(0) || "U"}
            </span>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.FullName || user?.Username}
            </p>

            <p className="text-xs text-gray-400 capitalize">
              {user?.Role || "User"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <FaHandshake className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Secure Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
