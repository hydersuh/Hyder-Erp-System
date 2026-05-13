const menuCategories = [
  {
    id: "system_miscellaneous",
    name: "System & Miscellaneous",
    icon: "FaHome",
    items: [
      {
        path: "/",
        label: "Dashboard",
        icon: "FaHome",
        roles: ["admin", "user"],
      },
      {
        path: "/documents",
        label: "Documents",
        icon: "FaFileAlt",
        roles: ["admin", "user"],
      },
    ],
  },
  {
    id: "core_master_data",
    name: "Core Master Data",
    icon: "FaDatabase",
    items: [
      {
        path: "/customers",
        label: "Customers",
        icon: "FaUserFriends",
        roles: ["admin", "user"],
      },
      {
        path: "/vendors",
        label: "Vendors",
        icon: "FaTruck",
        roles: ["admin", "user"],
      },
      {
        path: "/items",
        label: "Items",
        icon: "FaBoxes",
        roles: ["admin", "user"],
      },
    ],
  },
  {
    id: "financial_transactions",
    name: "Financial Transactions",
    icon: "FaMoneyBillWave",
    items: [
      {
        path: "/invoices",
        label: "Invoices",
        icon: "FaFileInvoice",
        roles: ["admin", "user"],
      },
      {
        path: "/bills",
        label: "Bills",
        icon: "FaFileAlt",
        roles: ["admin", "user"],
      },
      {
        path: "/payments",
        label: "Payments",
        icon: "FaCreditCard",
        roles: ["admin", "user"],
      },
      {
        path: "/journalentries",
        label: "Journal Entries",
        icon: "FaBook",
        roles: ["admin", "user"],
      },
    ],
  },
  {
    id: "accounting_chart",
    name: "Accounting & Chart of Accounts",
    icon: "FaChartLine",
    items: [
      {
        path: "/main",
        label: "Main Accounts",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
      {
        path: "/submain",
        label: "Sub Main",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
      {
        path: "/groups",
        label: "Groups",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
      {
        path: "/subgroups",
        label: "Sub Groups",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
      {
        path: "/ledgers",
        label: "Ledgers",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
    ],
  },
  {
    id: "financial_reports",
    name: "Financial Reports",
    icon: "FaFileInvoice",
    items: [
      {
        path: "/trialbalance",
        label: "Trial Balance",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
      {
        path: "/financials",
        label: "Financial Statements",
        icon: "FaChartLine",
        roles: ["admin", "user"],
      },
    ],
  },
  {
    id: "inventory_management",
    name: "Inventory Management",
    icon: "FaBoxes",
    items: [
      {
        path: "/inventory/transactions",
        label: "Inventory Transactions",
        icon: "FaBoxes",
        roles: ["admin", "user"],
      },
    ],
  },

  {
    id: "configuration_settings",
    name: "Configuration & Settings",
    icon: "FaCog",
    items: [
      { path: "/users", label: "Users", icon: "FaUsers", roles: ["admin"] },
      {
        path: "/taxrates",
        label: "Tax Rates",
        icon: "FaPercent",
        roles: ["admin"],
      },
      {
        path: "/currencies",
        label: "Currencies",
        icon: "FaMoneyBill",
        roles: ["admin"],
      },
      {
        path: "/webhooks",
        label: "Webhooks",
        icon: "FaPlug",
        roles: ["admin"],
      },
      {
        path: "/email-templates",
        label: "Email Templates",
        icon: "FaEnvelope",
        roles: ["admin"],
      },
      {
        path: "/report-configs",
        label: "Report Configurations",
        icon: "FaCog",
        roles: ["admin"],
      },
    ],
  },
];

// Helper function to filter menu by user role
const getFilteredMenuCategories = (userRole) => {
  return menuCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((category) => category.items.length > 0);
};

// Helper function to get flat filtered menu items (backward compatible)
const getFilteredMenuItems = (userRole) => {
  const filtered = [];

  menuCategories.forEach((category) => {
    category.items.forEach((item) => {
      if (item.roles.includes(userRole)) {
        filtered.push(item);
      }
    });
  });
  return filtered;
};

export { menuCategories, getFilteredMenuCategories, getFilteredMenuItems };
