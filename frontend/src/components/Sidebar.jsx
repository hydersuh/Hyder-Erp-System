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
  FaSignOutAlt,
  FaChartLine,
  FaBook,
  FaPercent,
  FaMoneyBill,
  FaMoneyBillWave,
  FaPlug,
  FaEnvelope,
  FaCog,
  FaDatabase,
} from "react-icons/fa";
import { menuCategories, getFilteredMenuCategories } from "./menuCategories";

const Sidebar = ({ userRole, onLogout, user }) => {
  const filteredCategories = getFilteredMenuCategories(userRole);

  // Icon mapping for categories
  const categoryIcons = {
    FaDatabase: FaDatabase,
    FaMoneyBillWave: FaMoneyBillWave,
    FaChartLine: FaChartLine,
    FaFileInvoice: FaFileInvoice,
    FaBoxes: FaBoxes,
    FaCog: FaCog,
    FaHome: FaHome,
  };

  // Icon mapping for menu items
  const iconMap = {
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
    FaPercent,
    FaMoneyBill,
    FaMoneyBillWave,
    FaPlug,
    FaEnvelope,
    FaCog,
    FaDatabase,
  };

  const getIcon = (iconName) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="w-5 h-5 mr-3" /> : null;
  };

  const getCategoryIcon = (iconName) => {
    const Icon = categoryIcons[iconName];
    return Icon ? <Icon className="w-4 h-4 mr-2" /> : null;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold flex items-center">
          <FaChartLine className="mr-2 text-primary-400" />
          ERP System
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Enterprise Resource Planning
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              {/* Category Header */}
              <div
                className="px-3 py-2 text-xs font-semibold text-gray-400 uppercasetracking-wider flex items-center"
              >
                {getCategoryIcon(category.icon)}

                {category.name}
              </div>

              {/* Category Items */}
              <div className="space-y-1">
                {category.items.map((item) => {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? "bg-primary-600 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`
                      }
                    >
                      {getIcon(item.icon)}
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center mb-3">
          <div
            className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center"
          >
            <span className="text-sm font-bold">
              {user?.FullName?.charAt(0) || "U"}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.FullName}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.Role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200"
        >
          <FaSignOutAlt className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
