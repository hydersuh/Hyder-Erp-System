require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "erp_system_secret_key_2024";

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(cors());
app.use(express.json());

// =====================================================
// DATABASE SETUP
// =====================================================
const dbPath = path.join(__dirname, "erp.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  const initSQL = fs.readFileSync(
    path.join(__dirname, "database", "init.sql"),
    "utf8",
  );
  db.exec(initSQL, (err) => {
    if (err) {
      console.error("Database initialized error:", err);
    } else {
      console.log("Database initialized successfully");

      // Create default admin user
      const adminPassword = bcrypt.hashSync("admin123", 10);
      db.get(
        "SELECT COUNT (*) as count FROM Users WHERE Username = 'admin'",
        (err, row) => {
          if (err) return;
          if (row.count === 0) {
            db.run(
              "INSERT INTO Users (Username, PasswordHash, Email, FullName, Role) VALUES(?, ?, ?, ?, ?)",
              [
                "admin",
                adminPassword,
                "admin@erp.com",
                "System Adminstrator",
                "admin",
              ],
            );
            console.log("Default admin user created");
          }
        },
      );
    }
  });
};

initDatabase();

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  db.get("SELECT * FROM Users WHERE Username = ?", [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    db.run("UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?", [
      user.UserID,
    ]);

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        Email: user.Email,
        FullName: user.FullName,
        Role: user.Role,
      },
    });
  });
});

// =====================================================
// USERS CRUD ENDPOINTS
// =====================================================
app.get("/api/users", authenticateToken, (req, res) => {
  db.all(
    "SELECT UserID, Username, Email, FullName, Role, IsActive, LastLogin, CreatedAt FROM Users",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/users", authenticateToken, (req, res) => {
  const { Username, Password, Email, FullName, Role, IsActive } = req.body;

  if (!Username || !Password || !Email || !FullName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const PasswordHash = bcrypt.hashSync(Password, 10);

  db.run(
    "INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, IsActive) VALUES (?, ?, ?, ?, ?, ?)",
    [
      Username,
      PasswordHash,
      Email,
      FullName,
      Role || "user",
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res
            .status(400)
            .json({ error: "Username or email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ UserID: this.lastID, message: "User created successfully" });
    },
  );
});

app.put("/api/users/:id", authenticateToken, (req, res) => {
  const { FullName, Email, Role, IsActive } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE Users SET FullName = ?, Email = ?, Role = ?, IsActive = ? WHERE UserID = ?",
    [FullName, Email, Role, IsActive, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User updated successfully" });
    },
  );
});

app.delete("/api/users/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Users WHERE UserID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User deleted successfully" });
  });
});

// =====================================================
// ACCOUNTING HIERARCHY ENDPOINTS
// =====================================================
// Main table endpoint
app.get("/api/main", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Main ORDER BY PrimID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/main", authenticateToken, (req, res) => {
  const { PrimName } = req.body;
  db.run("INSERT INTO Main (PrimName) VALUES (?)", [PrimName], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ PrimID: this.lastID, message: "Main record created" });
  });
});

app.put("/api/main/:id", authenticateToken, (req, res) => {
  const { PrimName } = req.body;
  const { id } = req.params;
  db.run(
    "UPDATE Main SET PrimName = ?, LastUpdate = CURRENT_TIMESTAMP WHERE PrimID = ?",
    [PrimName, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Main record updated" });
    },
  );
});

app.delete("/api/main/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Main WHERE PrimID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Main record deleted" });
  });
});

// subMain table endpoints
app.get("/api/submain", authenticateToken, (req, res) => {
  db.all(
    `SELECT sm.SubPrimID, sm.PrimID, m.PrimName, sm.SubName, sm.LastUpdate 
         FROM subMain sm 
         JOIN Main m ON sm.PrimID = m.PrimID 
         ORDER BY sm.SubPrimID`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/submain", authenticateToken, (req, res) => {
  const { PrimID, SubName } = req.body;

  db.run(
    "INSERT INTO subMain (PrimID, SubName) VALUES (?, ?)",
    [PrimID, SubName],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ SubPrimID: this.lastID, message: "Sub-main created" });
    },
  );
});

app.put("/api/submain/:id", authenticateToken, (req, res) => {
  const { PrimID, SubName } = req.body;
  const { id } = req.params;
  db.run(
    "UPDATE subMain SET PrimID = ?, SubName = ?, LastUpdate = CURRENT_TIMESTAMsP WHERE SubPrimID = ?",
    [PrimID, SubName, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Sub-main updated" });
    },
  );
});

app.delete("/api/submain/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM subMain WHERE SubPrimID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Sub-main deleted" });
  });
});

// Groups table endpoints
app.get("/api/groups", authenticateToken, (req, res) => {
  db.all(
    `SELECT g.GroupID, g.SubPrimID, sm.SubName, g.GroupName, g.LastUpdate 
         FROM Groups g 
         JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
         ORDER BY g.GroupID`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/groups", authenticateToken, (req, res) => {
  const { SubPrimID, GroupName } = req.body;
  db.run(
    "INSERT INTO Groups (SubPrimID, GroupName) VALUES (?, ?)",
    [SubPrimID, GroupName],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ GroupID: this.lastID, message: "Group created" });
    },
  );
});

app.put("/api/groups/:id", authenticateToken, (req, res) => {
  const { SubPrimID, GroupName } = req.body;
  const { id } = req.params;
  db.run(
    "UPDATE Groups SET SubPrimID = ?, GroupName = ?, LastUpdate = CURRENT_TIMESTAMP WHERE GroupID = ?",
    [SubPrimID, GroupName, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Group updated" });
    },
  );
});

app.delete("/api/groups/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Groups WHERE GroupID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Group deleted" });
  });
});

// SubGroups table endpoints
app.get("/api/subgroups", authenticateToken, (req, res) => {
  db.all(
    `SELECT sg.SubGroupID, sg.GroupID, g.GroupName, sg.SubName, sg.LastUpdate 
         FROM SubGroups sg 
         JOIN Groups g ON sg.GroupID = g.GroupID 
         ORDER BY sg.SubGroupID`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/subgroups", authenticateToken, (req, res) => {
  const { GroupID, SubName } = req.body;
  db.run(
    "INSERT INTO SubGroups (GroupID, SubName) VALUES (?, ?)",
    [GroupID, SubName],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ SubGroupID: this.lastID, message: "Sub-group created" });
    },
  );
});

app.put("/api/subgroups/:id", authenticateToken, (req, res) => {
  const { GroupID, SubName } = req.body;
  const { id } = req.params;
  db.run(
    "UPDATE SubGroups SET GroupID = ?, SubName = ?, LastUpdate = CURRENT_TIMESTAMP WHERE SubGroupID = ?",
    [GroupID, SubName, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Sub-group updated" });
    },
  );
});

app.delete("/api/subgroups/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM SubGroups WHERE SubGroupID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Sub-group deleted" });
  });
});

// Ledgers table endpoints
app.get("/api/ledgers", authenticateToken, (req, res) => {
  db.all(
    `SELECT l.AcNo, l.SubGroupID, sg.SubName as SubGroupName, l.AccName, l.LastUpdate  
         FROM Ledgers l 
         JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
         ORDER BY l.AcNo`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json(rows);
    },
  );
});

// ============= DASHBOARD STATS =============
app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
  const queries = {
    totalCustomers:
      "SELECT COUNT(*) as count FROM Customers WHERE IsActive = 1",
    totalVendors: "SELECT COUNT(*) as count FROM Vendors WHERE IsActive = 1",
    totalInvoices: "SELECT COUNT(*) as count FROM Invoices",
    totalBills: "SELECT COUNT(*) as count FROM Bills",
    totalRevenue:
      "SELECT COALESCE(SUM(TotalAmount), 0) as total FROM Invoices WHERE Status = 'Paid'",
    totalExpenses:
      "SELECT COALESCE(SUM(TotalAmount), 0) as total FROM Bills WHERE Status = 'Paid'",
    pendingInvoices:
      "SELECT COUNT(*) as count FROM Invoices WHERE Status NOT IN ('Paid', 'Cancelled')",
    lowStockItems:
      "SELECT COUNT(*) as count FROM Items WHERE StockQuantity <= MinStockLevel AND IsActive = 1",
  };

  const results = {};
  let completed = 0;

  Object.keys(queries).forEach((key) => {
    db.get(queries[key], (err, row) => {
      if (err) console.error(`Error fetching ${key}:`, err);
      results[key] = row
        ? row.count !== undefined
          ? row.count
          : row.total
        : 0;
      completed++;

      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

app.get("/api/dashboard/recent-invoices", authenticateToken, (req, res) => {
  db.all(
    `SELECT i.InvoiceID, i.InvoiceNumber, i.InvoiceDate, i.TotalAmount, i.Status, c.CompanyName 
     FROM Invoices i 
     LEFT JOIN Customers c ON i.CustomerID = c.CustomerID 


     ORDER BY i.InvoiceDate DESC LIMIT 5`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.get("/api/dashboard/recent-bills", authenticateToken, (req, res) => {
  db.all(
    `SELECT b.BillID, b.BillNumber, b.BillDate, b.TotalAmount, b.Status, v.CompanyName 
     FROM Bills b 
     LEFT JOIN Vendors v ON b.VendorID = v.VendorID 
     ORDER BY b.BillDate DESC LIMIT 5`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/ledgers", authenticateToken, (req, res) => {
  const { SubGroupID, AccName } = req.body;
  db.run(
    "INSERT INTO Ledgers (SubGroupID, AccName) VALUES (?, ?)",
    [SubGroupID, AccName],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ AcNo: this.lastID, message: "Ledger created" });
    },
  );
});

app.put("/api/ledgers/:id", authenticateToken, (req, res) => {
  const { SubGroupID, AccName } = req.body;
  const { id } = req.params;
  db.run(
    "UPDATE Ledgers SET SubGroupID = ?, AccName = ?, LastUpdate = CURRENT_TIMESTAMP WHERE AcNo = ?",
    [SubGroupID, AccName, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Ledger updated" });
    },
  );
});

app.delete("/api/ledgers/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Ledgers WHERE AcNo = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Ledger deleted" });
  });
});

// =====================================================
// JOURNAL ENTRIES ENDPOINTS
// =====================================================
app.get("/api/journalentries", authenticateToken, (req, res) => {
  db.all(`SELECT * FROM JournalEntries ORDER BY EntryID DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
});

app.get("/api/journalentries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM JournalEntries WHERE EntryID = ?`,
    [id],
    (err, entry) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!entry)
        return res.status(404).json({ error: "Journal entry not found" });

      db.all(
        `SELECT ed.*, l.AccName 
             FROM EntryDetails ed 
             LEFT JOIN Ledgers l ON ed.AcNo = l.AcNo 
             WHERE ed.EntryID = ? 
             ORDER BY ed.DetailID`,
        [id],
        (err, details) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ entry, details });
        },
      );
    },
  );
});

app.post("/api/journalentries", authenticateToken, (req, res) => {
  const { EntryDate, Narration, TotDr, TotCr, details } = req.body;

  if (!EntryDate || !Narration) {
    return res
      .status(400)
      .json({ error: "Entry date and narration are required" });
  }
  if (!details || details.length === 0) {
    return res
      .status(400)
      .json({ error: "At least one journal entry line is required" });
  }
  if (TotDr !== TotCr) {
    return res
      .status(400)
      .json({ error: "Debit and credit totals must be equal" });
  }

  db.run(
    `INSERT INTO JournalEntries (EntryDate, Narration, TotDr, TotCr, CreatedBy) 
         VALUES (?, ?, ?, ?, ?)`,
    [EntryDate, Narration, TotDr, TotCr, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const entryId = this.lastID;
      let detailsProcessed = 0;

      details.forEach((detail) => {
        const { AcNo, Debit, Credit, CurrC, CRate } = detail;
        db.run(
          `INSERT INTO EntryDetails (EntryID, AcNo, Debit, Credit, CurrC, CRate) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
          [entryId, AcNo, Debit || 0, Credit || 0, CurrC || "USD", CRate || 1],
          (err) => {
            if (err) console.error("Error inserting entry detail:", err);
            detailsProcessed++;
            if (detailsProcessed === details.length) {
              res.json({
                EntryID: entryId,
                message: "Journal entry created successfully",
              });
            }
          },
        );
      });
    },
  );
});

app.put("/api/journalentries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { EntryDate, Narration, TotDr, TotCr, details } = req.body;

  if (!EntryDate || !Narration) {
    return res
      .status(400)
      .json({ error: "Entry date and narration are required" });
  }
  if (TotDr !== TotCr) {
    return res
      .status(400)
      .json({ error: "Debit and credit totals must be equal" });
  }

  db.run(
    `UPDATE JournalEntries 
         SET EntryDate = ?, Narration = ?, TotDr = ?, TotCr = ?, LastUpdate = CURRENT_TIMESTAMP 
         WHERE EntryID = ?`,
    [EntryDate, Narration, TotDr, TotCr, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(`DELETE FROM EntryDetails WHERE EntryID = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (details && details.length > 0) {
          let detailsProcessed = 0;
          details.forEach((detail) => {
            const { AcNo, Debit, Credit, CurrC, CRate } = detail;
            db.run(
              `INSERT INTO EntryDetails (EntryID, AcNo, Debit, Credit, CurrC, CRate) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
              [id, AcNo, Debit || 0, Credit || 0, CurrC || "USD", CRate || 1],
              (err) => {
                if (err) console.error("Error inserting entry detail:", err);
                detailsProcessed++;
                if (detailsProcessed === details.length) {
                  res.json({ message: "Journal entry updated successfully" });
                }
              },
            );
          });
        } else {
          res.json({ message: "Journal entry updated successfully" });
        }
      });
    },
  );
});

app.delete("/api/journalentries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM EntryDetails WHERE EntryID = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      `DELETE FROM JournalEntries WHERE EntryID = ?`,
      [id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Journal entry deleted successfully" });
      },
    );
  });
});

// =====================================================
// IFRS 18 FINANCIAL STATEMENTS ENDPOINTS
// =====================================================
// Income Statement (P&L) - IFRS 18 Compliant
app.get("/api/financials/income-statement", authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;

  const operatingRevenueQuery = ` 
        SELECT COALESCE(SUM(ed.Credit - ed.Debit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND m.PrimName = 'Income' 
        AND (g.GroupName = 'Sales Revenue' OR g.GroupName = 'Service Revenue')`;

  const operatingExpensesQuery = ` 
        SELECT COALESCE(SUM(ed.Debit - ed.Credit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 


        JOIN Groups g ON sg.GroupID = g.GroupID 
        JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND m.PrimName = 'Expense' 
        AND g.GroupName NOT IN ('Financing Costs', 'Investment Income')`;

  const financingCostsQuery = ` 
        SELECT COALESCE(SUM(ed.Debit - ed.Credit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName = 'Financing Costs'`;

  const investmentIncomeQuery = ` 
        SELECT COALESCE(SUM(ed.Credit - ed.Debit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName = 'Investment Income'`;

  const taxExpenseQuery = ` 
        SELECT COALESCE(SUM(ed.Debit - ed.Credit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName = 'Tax Expense'`;

  const params = [startDate, endDate];

  Promise.all([
    new Promise((resolve, reject) =>
      db.get(operatingRevenueQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(operatingExpensesQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(financingCostsQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(investmentIncomeQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(taxExpenseQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
  ])
    .then(
      ([
        operatingRevenue,
        operatingExpenses,
        financingCosts,
        investmentIncome,
        taxExpense,
      ]) => {
        const operatingProfit = operatingRevenue - operatingExpenses;
        const netFinancingResult = investmentIncome - financingCosts;
        const profitBeforeTax = operatingProfit + netFinancingResult;
        const netProfit = profitBeforeTax - taxExpense;

        res.json({
          period: { startDate, endDate },
          incomeStatement: {
            operatingRevenue: {
              amount: operatingRevenue,
              category: "Operating",
            },
            operatingExpenses: {
              amount: operatingExpenses,
              category: "Operating",
            },
            operatingProfit: {
              amount: operatingProfit,
              category: "Operating",
              subtotal: true,
            },
            investmentIncome: {
              amount: investmentIncome,
              category: "Investing",
            },
            financingCosts: { amount: financingCosts, category: "Financing" },
            netFinancingResult: {
              amount: netFinancingResult,
              category: "Financing",
              subtotal: true,
            },
            profitBeforeTax: {
              amount: profitBeforeTax,
              category: "Total",
              subtotal: true,
            },
            taxExpense: { amount: taxExpense, category: "Total" },
            netProfit: { amount: netProfit, category: "Total", total: true },
          },
        });
      },
    )
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Balance Sheet (Statement of Financial Position)
app.get("/api/financials/balance-sheet", authenticateToken, (req, res) => {
  const { asOfDate } = req.query;
  const currentDate = asOfDate || new Date().toISOString().split("T")[0];

  const assetsQuery = ` 
        SELECT l.AcNo, l.AccName, sg.SubName as SubGroupName, g.GroupName, sm.SubName 
as SubMainName, m.PrimName as MainName, 
               COALESCE(SUM(ed.Debit - ed.Credit), 0) as balance 
        FROM Ledgers l 
        LEFT JOIN EntryDetails ed ON l.AcNo = ed.AcNo 
        LEFT JOIN JournalEntries je ON ed.EntryID = je.EntryID AND je.EntryDate <= ? 
        LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        LEFT JOIN Groups g ON sg.GroupID = g.GroupID 
        LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        LEFT JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE m.PrimName IN ('Assets') 
        GROUP BY l.AcNo 
        HAVING balance != 0`;

  const liabilitiesQuery = ` 
        SELECT l.AcNo, l.AccName, sg.SubName as SubGroupName, g.GroupName, sm.SubName as SubMainName, m.PrimName as MainName, 
               COALESCE(SUM(ed.Credit - ed.Debit), 0) as balance 
        FROM Ledgers l 
        LEFT JOIN EntryDetails ed ON l.AcNo = ed.AcNo 
        LEFT JOIN JournalEntries je ON ed.EntryID = je.EntryID AND je.EntryDate <= ? 
        LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        LEFT JOIN Groups g ON sg.GroupID = g.GroupID 
        LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        LEFT JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE m.PrimName IN ('Liabilities') 
        GROUP BY l.AcNo 
        HAVING balance != 0`;

  const equityQuery = ` 


        SELECT l.AcNo, l.AccName, sg.SubName as SubGroupName, g.GroupName, sm.SubName as SubMainName, m.PrimName as MainName, 
               COALESCE(SUM(ed.Credit - ed.Debit), 0) as balance 
        FROM Ledgers l 
        LEFT JOIN EntryDetails ed ON l.AcNo = ed.AcNo 
        LEFT JOIN JournalEntries je ON ed.EntryID = je.EntryID AND je.EntryDate <= ? 
        LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        LEFT JOIN Groups g ON sg.GroupID = g.GroupID 
        LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        LEFT JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE m.PrimName IN ('Equity') 
        GROUP BY l.AcNo 
        HAVING balance != 0`;

  const params = [currentDate];

  Promise.all([
    new Promise((resolve, reject) =>
      db.all(assetsQuery, params, (err, rows) =>
        err ? reject(err) : resolve(rows),
      ),
    ),
    new Promise((resolve, reject) =>
      db.all(liabilitiesQuery, params, (err, rows) =>
        err ? reject(err) : resolve(rows),
      ),
    ),
    new Promise((resolve, reject) =>
      db.all(equityQuery, params, (err, rows) =>
        err ? reject(err) : resolve(rows),
      ),
    ),
  ])
    .then(([assets, liabilities, equity]) => {
      const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, l) => sum + l.balance,
        0,
      );
      const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);
      const totalLiabilitiesEquity = totalLiabilities + totalEquity;

      res.json({
        asOfDate: currentDate,
        assets: { items: assets, total: totalAssets },
        liabilities: { items: liabilities, total: totalLiabilities },
        equity: { items: equity, total: totalEquity },
        totalLiabilitiesEquity,
        isBalanced: Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01,
        difference: totalAssets - totalLiabilitiesEquity,
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Cash Flow Statement - IFRS 18 Compliant
app.get("/api/financials/cash-flow", authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;

  const operatingCashFlowQuery = ` 
        SELECT COALESCE(SUM(ed.Credit - ed.Debit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName IN ('Sales Revenue', 'Service Revenue', 'Cost of Sales', 'Operating Expenses')`;

  const investingCashFlowQuery = ` 
        SELECT COALESCE(SUM(ed.Credit - ed.Debit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName IN ('Investment Income', 'Asset Purchases', 'Asset Sales')`;

  const financingCashFlowQuery = ` 
        SELECT COALESCE(SUM(ed.Credit - ed.Debit), 0) as amount 
        FROM EntryDetails ed 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN Ledgers l ON ed.AcNo = l.AcNo 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        WHERE je.EntryDate BETWEEN ? AND ? 
        AND g.GroupName IN ('Financing Costs', 'Capital Contributions', 'Dividends')`;

  const params = [startDate, endDate];

  Promise.all([
    new Promise((resolve, reject) =>
      db.get(operatingCashFlowQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(investingCashFlowQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
    new Promise((resolve, reject) =>
      db.get(financingCashFlowQuery, params, (err, row) =>
        err ? reject(err) : resolve(row?.amount || 0),
      ),
    ),
  ])
    .then(([operating, investing, financing]) => {
      const netCashFlow = operating + investing + financing;
      const openingBalance = 0;
      const closingBalance = openingBalance + netCashFlow;

      res.json({
        period: { startDate, endDate },
        operatingActivities: {
          amount: operating,
          description: "Cash flows from operating activities",
        },
        investingActivities: {
          amount: investing,
          description: "Cash flows from investing activities",
        },
        financingActivities: {
          amount: financing,
          description: "Cash flows from financing activities",
        },
        netCashFlow: { amount: netCashFlow },
        openingCashBalance: { amount: openingBalance },
        closingCashBalance: { amount: closingBalance },
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Statement of Changes in Equity
app.get("/api/financials/equity-changes", authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;

  db.all(
    ` 
        SELECT l.AcNo, l.AccName, g.GroupName, 
               COALESCE(SUM(CASE WHEN je.EntryDate < ? THEN ed.Credit - ed.Debit ELSE 
0 END), 0) as openingBalance, 
               COALESCE(SUM(CASE WHEN je.EntryDate BETWEEN ? AND ? THEN ed.Credit - e
d.Debit ELSE 0 END), 0) as changes, 
               COALESCE(SUM(ed.Credit - ed.Debit), 0) as closingBalance 


        FROM Ledgers l 
        JOIN EntryDetails ed ON l.AcNo = ed.AcNo 
        JOIN JournalEntries je ON ed.EntryID = je.EntryID 
        JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        JOIN Groups g ON sg.GroupID = g.GroupID 
        JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        JOIN Main m ON sm.PrimID = m.PrimID 
        WHERE m.PrimName = 'Equity' AND je.EntryDate <= ? 
        GROUP BY l.AcNo 
    `,
    [startDate, startDate, endDate, endDate],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalOpening = rows.reduce((sum, r) => sum + r.openingBalance, 0);
      const totalChanges = rows.reduce((sum, r) => sum + r.changes, 0);
      const totalClosing = rows.reduce((sum, r) => sum + r.closingBalance, 0);

      res.json({
        period: { startDate, endDate },
        equityComponents: rows,
        totals: {
          openingBalance: totalOpening,
          totalChanges: totalChanges,
          closingBalance: totalClosing,
        },
      });
    },
  );
});

// =====================================================
// TRIAL BALANCE ENDPOINT
// =====================================================
app.get("/api/trialbalance", authenticateToken, (req, res) => {
  const { asOfDate } = req.query;
  const dateCondition = asOfDate ? `AND je.EntryDate <= '${asOfDate}'` : "";

  db.all(
    ` 
        SELECT l.AcNo, l.AccName, l.SubGroupID, sg.SubName as SubGroupName, g.GroupName, 
               sm.SubName as SubMainName, m.PrimName as MainName, 
               COALESCE(SUM(ed.Debit), 0) as TotalDebit, 
               COALESCE(SUM(ed.Credit), 0) as TotalCredit 


        FROM Ledgers l 
        LEFT JOIN EntryDetails ed ON l.AcNo = ed.AcNo 
        LEFT JOIN JournalEntries j ON ed.EntryID = j.EntryID ${dateCondition} 
        LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
        LEFT JOIN Groups g ON sg.GroupID = g.GroupID 
        LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
        LEFT JOIN Main m ON sm.PrimID = m.PrimID 
        GROUP BY l.AcNo 
        ORDER BY m.PrimID, sm.SubPrimID, g.GroupID, sg.SubGroupID, l.AcNo 
    `,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      let totalDebit = 0;
      let totalCredit = 0;
      rows.forEach((row) => {
        totalDebit += row.TotalDebit;
        totalCredit += row.TotalCredit;
      });
      res.json({
        accounts: rows,
        summary: {
          totalDebit,
          totalCredit,
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        },
      });
    },
  );
});

// ============= CUSTOMERS CRUD =============
app.get("/api/customers", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Customers ORDER BY CustomerID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/customers", authenticateToken, (req, res) => {
  const {
    CustomerCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    CreditLimit,
    IsActive,
  } = req.body;

  if (!CustomerCode || !CompanyName) {
    return res
      .status(400)
      .json({ error: "Customer code and company name required" });
  }

  db.run(
    `INSERT INTO Customers (CustomerCode, CompanyName, ContactName, Email, Phone, Address, City, Country, CreditLimit, IsActive) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      CustomerCode,
      CompanyName,
      ContactName || "",
      Email || "",
      Phone || "",
      Address || "",
      City || "",
      Country || "",
      CreditLimit || 0,
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res
            .status(400)
            .json({ error: "Customer code already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        CustomerID: this.lastID,
        message: "Customer created successfully",
      });
    },
  );
});

app.put("/api/customers/:id", authenticateToken, (req, res) => {
  const {
    CustomerCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    CreditLimit,
    IsActive,
  } = req.body;
  const { id } = req.params;

  db.run(
    `UPDATE Customers SET CustomerCode = ?, CompanyName = ?, ContactName = ?, Email = ?, Phone = ?,  
     Address = ?, City = ?, Country = ?, CreditLimit = ?, IsActive = ? WHERE CustomerID = ?`,
    [
      CustomerCode,
      CompanyName,
      ContactName,
      Email,
      Phone,
      Address,
      City,
      Country,
      CreditLimit,
      IsActive,
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Customer updated successfully" });
    },
  );
});

app.delete("/api/customers/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Customers WHERE CustomerID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Customer deleted successfully" });
  });
});

// ============= VENDORS CRUD =============
app.get("/api/vendors", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Vendors ORDER BY VendorID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/vendors", authenticateToken, (req, res) => {
  const {
    VendorCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    PaymentTerms,
    IsActive,
  } = req.body;

  if (!VendorCode || !CompanyName) {
    return res
      .status(400)
      .json({ error: "Vendor code and company name required" });
  }

  db.run(
    `INSERT INTO Vendors (VendorCode, CompanyName, ContactName, Email, Phone, Address
, City, Country, PaymentTerms, IsActive) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      VendorCode,
      CompanyName,
      ContactName || "",
      Email || "",
      Phone || "",
      Address || "",
      City || "",
      Country || "",
      PaymentTerms || "NET 30",
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Vendor code already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        VendorID: this.lastID,
        message: "Vendor created successfully",
      });
    },
  );
});

app.put("/api/vendors/:id", authenticateToken, (req, res) => {
  const {
    VendorCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    PaymentTerms,
    IsActive,
  } = req.body;
  const { id } = req.params;

  db.run(
    `UPDATE Vendors SET VendorCode = ?, CompanyName = ?, ContactName = ?, Email = ?, Phone = ?, 
     Address = ?, City = ?, Country = ?, PaymentTerms = ?, IsActive = ? WHERE VendorID = ?`,
    [
      VendorCode,
      CompanyName,
      ContactName,
      Email,
      Phone,
      Address,
      City,
      Country,
      PaymentTerms,
      IsActive,
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Vendor updated successfully" });
    },
  );
});

app.delete("/api/vendors/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Vendors WHERE VendorID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Vendor deleted successfully" });
  });
});

// =====================================================
// VENDORS CRUD ENDPOINTS
// =====================================================

app.get("/api/vendors", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Vendors ORDER BY VendorID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/vendors", authenticateToken, (req, res) => {
  const {
    VendorCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    PaymentTerms,
    IsActive,
  } = req.body;

  if (!VendorCode || !CompanyName) {
    return res
      .status(400)
      .json({ error: "Vendor code and company name required" });
  }

  db.run(
    `INSERT INTO Vendors (VendorCode, CompanyName, ContactName, Email, Phone, Address, City, Country, PaymentTerms, IsActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      VendorCode,
      CompanyName,
      ContactName || "",
      Email || "",
      Phone || "",
      Address || "",
      City || "",
      Country || "",
      PaymentTerms || "NET 30",
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Vendor code already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        VendorID: this.lastID,
        message: "Vendor created successfully",
      });
    },
  );
});

app.put("/api/vendors/:id", authenticateToken, (req, res) => {
  const {
    VendorCode,
    CompanyName,
    ContactName,
    Email,
    Phone,
    Address,
    City,
    Country,
    PaymentTerms,
    IsActive,
  } = req.body;
  const { id } = req.params;

  db.run(
    `UPDATE Vendors SET VendorCode = ?, CompanyName = ?, ContactName = ?, Email = ?, Phone = ?, 
         Address = ?, City = ?, Country = ?, PaymentTerms = ?, IsActive = ? WHERE VendorID = ?`,
    [
      VendorCode,
      CompanyName,
      ContactName,
      Email,
      Phone,
      Address,
      City,
      Country,
      PaymentTerms,
      IsActive,
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Vendor updated successfully" });
    },
  );
});

app.delete("/api/vendors/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Vendors WHERE VendorID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Vendor deleted successfully" });
  });
});

// =====================================================
// ITEMS CRUD ENDPOINTS
// =====================================================

app.get("/api/items", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Items ORDER BY ItemID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/items", authenticateToken, (req, res) => {
  const {
    ItemCode,
    ItemName,
    Description,
    Category,
    UnitOfMeasure,
    PurchasePrice,
    SalePrice,
    StockQuantity,
    MinStockLevel,
    IsActive,
  } = req.body;

  if (!ItemCode || !ItemName) {
    return res.status(400).json({ error: "Item code and name required" });
  }

  db.run(
    `INSERT INTO Items (ItemCode, ItemName, Description, Category, UnitOfMeasure, PurchasePrice, SalePrice, StockQuantity, MinStockLevel, IsActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ItemCode,
      ItemName,
      Description || "",
      Category || "",
      UnitOfMeasure || "PCS",
      PurchasePrice || 0,
      SalePrice || 0,
      StockQuantity || 0,
      MinStockLevel || 0,
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Item code already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ ItemID: this.lastID, message: "Item created successfully" });
    },
  );
});

app.put("/api/items/:id", authenticateToken, (req, res) => {
  const {
    ItemCode,
    ItemName,
    Description,
    Category,
    UnitOfMeasure,
    PurchasePrice,
    SalePrice,
    StockQuantity,
    MinStockLevel,
    IsActive,
  } = req.body;
  const { id } = req.params;

  db.run(
    `UPDATE Items SET ItemCode = ?, ItemName = ?, Description = ?, Category = ?, UnitOfMeasure = ?, 
         PurchasePrice = ?, SalePrice = ?, StockQuantity = ?, MinStockLevel = ?, IsActive = ? WHERE ItemID = ?`,
    [
      ItemCode,
      ItemName,
      Description,
      Category,
      UnitOfMeasure,
      PurchasePrice,
      SalePrice,
      StockQuantity,
      MinStockLevel,
      IsActive,
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Item updated successfully" });
    },
  );
});

app.delete("/api/items/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Items WHERE ItemID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Item deleted successfully" });
  });
});

// =====================================================
// INVOICES ENDPOINTS
// =====================================================

app.get("/api/invoices", authenticateToken, (req, res) => {
  db.all(
    `SELECT i.*, c.CompanyName as CustomerName 
         FROM Invoices i 
         LEFT JOIN Customers c ON i.CustomerID = c.CustomerID 
         ORDER BY i.InvoiceID DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.get("/api/invoices/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT i.*, c.CompanyName as CustomerName, c.Email as CustomerEmail, c.Phoneas CustomerPhone, c.Address as CustomerAddress 
         FROM Invoices i 
         LEFT JOIN Customers c ON i.CustomerID = c.CustomerID 
         WHERE i.InvoiceID = ?`,
    [id],
    (err, invoice) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      db.all(
        `SELECT ii.*, it.ItemName, it.ItemCode 
                 FROM InvoiceItems ii 
                 LEFT JOIN Items it ON ii.ItemID = it.ItemID 
                 WHERE ii.InvoiceID = ?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({ ...invoice, items });
        },
      );
    },
  );
});

app.post("/api/invoices", authenticateToken, (req, res) => {
  const {
    CustomerID,
    InvoiceDate,
    DueDate,
    SubTotal,
    TaxAmount,
    DiscountAmount,
    TotalAmount,
    Notes,
    Status,
    items,
  } = req.body;
  const InvoiceNumber = "INV-" + Date.now();

  if (!CustomerID || items?.length === 0) {
    return res
      .status(400)
      .json({ error: "Customer and at least one item required" });
  }

  db.run(
    `INSERT INTO Invoices (InvoiceNumber, CustomerID, InvoiceDate, DueDate, SubTotal, TaxAmount, DiscountAmount, TotalAmount, Notes, Status, CreatedBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      InvoiceNumber,
      CustomerID,
      InvoiceDate,
      DueDate,
      SubTotal,
      TaxAmount,
      DiscountAmount,
      TotalAmount,
      Notes || "",
      Status || "Draft",
      req.user.userId,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const invoiceId = this.lastID;
      let itemsProcessed = 0;

      items.forEach((item) => {
        db.run(
          `INSERT INTO InvoiceItems (InvoiceID, ItemID, Quantity, UnitPrice, Discount, TaxRate, LineTotal) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            item.ItemID,
            item.Quantity,
            item.UnitPrice,
            item.Discount || 0,
            item.TaxRate || 0,
            item.LineTotal,
          ],
          (err) => {
            if (err) console.error("Error inserting invoice item:", err);
            itemsProcessed++;

            if (itemsProcessed === items.length) {
              res.json({
                InvoiceID: invoiceId,
                InvoiceNumber,
                message: "Invoice created successfully",
              });
            }
          },
        );
      });
    },
  );
});

app.put("/api/invoices/:id", authenticateToken, (req, res) => {
  const { Status, Notes } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE Invoices SET Status = ?, Notes = ? WHERE InvoiceID = ?",
    [Status, Notes, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Invoice updated successfully" });
    },
  );
});

app.delete("/api/invoices/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM InvoiceItems WHERE InvoiceID = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run("DELETE FROM Invoices WHERE InvoiceID = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Invoice deleted successfully" });
    });
  });
});

// =====================================================
// BILLS ENDPOINTS
// =====================================================

app.get("/api/bills", authenticateToken, (req, res) => {
  db.all(
    `SELECT b.*, v.CompanyName as VendorName 
         FROM Bills b 
         LEFT JOIN Vendors v ON b.VendorID = v.VendorID 
         ORDER BY b.BillID DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.get("/api/bills/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT b.*, v.CompanyName as VendorName, v.Email as VendorEmail, v.Phone asVendorPhone 
         FROM Bills b 
         LEFT JOIN Vendors v ON b.VendorID = v.VendorID 
         WHERE b.BillID = ?`,
    [id],
    (err, bill) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!bill) return res.status(404).json({ error: "Bill not found" });

      db.all(
        `SELECT bi.*, it.ItemName, it.ItemCode 
                 FROM BillItems bi 
                 LEFT JOIN Items it ON bi.ItemID = it.ItemID 
                 WHERE bi.BillID = ?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...bill, items });
        },
      );
    },
  );
});

app.post("/api/bills", authenticateToken, (req, res) => {
  const {
    VendorID,
    BillDate,
    DueDate,
    SubTotal,
    TaxAmount,
    DiscountAmount,
    TotalAmount,
    Notes,
    Status,
    items,
  } = req.body;
  const BillNumber = "BILL-" + Date.now();

  if (!VendorID || items?.length === 0) {
    return res
      .status(400)
      .json({ error: "Vendor and at least one item required" });
  }

  db.run(
    `INSERT INTO Bills (BillNumber, VendorID, BillDate, DueDate, SubTotal, TaxAmount, DiscountAmount, TotalAmount, Notes, Status, CreatedBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      BillNumber,
      VendorID,
      BillDate,
      DueDate,
      SubTotal,
      TaxAmount,
      DiscountAmount,
      TotalAmount,
      Notes || "",
      Status || "Draft",
      req.user.userId,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const billId = this.lastID;
      let itemsProcessed = 0;

      items.forEach((item) => {
        db.run(
          `INSERT INTO BillItems (BillID, ItemID, Quantity, UnitPrice, Discount, TaxRate, LineTotal) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            billId,
            item.ItemID,
            item.Quantity,
            item.UnitPrice,
            item.Discount || 0,
            item.TaxRate || 0,
            item.LineTotal,
          ],
          (err) => {
            if (err) console.error("Error inserting bill item:", err);
            itemsProcessed++;
            if (itemsProcessed === items.length) {
              res.json({
                BillID: billId,
                BillNumber,
                message: "Bill created successfully",
              });
            }
          },
        );
      });
    },
  );
});

app.put("/api/bills/:id", authenticateToken, (req, res) => {
  const { Status, Notes } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE Bills SET Status = ?, Notes = ? WHERE BillID = ?",
    [Status, Notes, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Bill updated successfully" });
    },
  );
});

app.delete("/api/bills/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM BillItems WHERE BillID = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run("DELETE FROM Bills WHERE BillID = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Bill deleted successfully" });
    });
  });
});

// =====================================================
// PAYMENTS ENDPOINTS
// =====================================================

app.get("/api/payments", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, 
         COALESCE(c.CompanyName, v.CompanyName) as EntityName, 
         CASE WHEN p.CustomerID IS NOT NULL THEN 'Customer' ELSE 'Vendor' END as PaymentType 
         FROM Payments p 
         LEFT JOIN Customers c ON p.CustomerID = c.CustomerID 
         LEFT JOIN Vendors v ON p.VendorID = v.VendorID 
         ORDER BY p.PaymentID DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/payments", authenticateToken, (req, res) => {
  const {
    CustomerID,
    VendorID,
    InvoiceID,
    BillID,
    PaymentDate,
    Amount,
    PaymentMethod,
    ReferenceNumber,
    Notes,
  } = req.body;
  const PaymentNumber = "PAY-" + Date.now();

  if (!Amount || Amount <= 0) {
    return res.status(400).json({ error: "Valid payment amount required" });
  }

  db.run(
    `INSERT INTO Payments (PaymentNumber, CustomerID, VendorID, InvoiceID, BillID 
, PaymentDate, Amount, PaymentMethod, ReferenceNumber, Notes, CreatedBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      PaymentNumber,
      CustomerID || null,
      VendorID || null,
      InvoiceID || null,
      BillID || null,
      PaymentDate,
      Amount,
      PaymentMethod || "Cash",
      ReferenceNumber || "",
      Notes || "",
      req.user.userId,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Update invoice/bill status if linked

      if (InvoiceID) {
        db.run("UPDATE Invoices SET Status = 'Paid' WHERE InvoiceID = ?", [
          InvoiceID,
        ]);
      }
      if (BillID) {
        db.run("UPDATE Bills SET Status = 'Paid' WHERE BillID = ?", [BillID]);
      }

      res.json({
        PaymentID: this.lastID,
        PaymentNumber,
        message: "Payment recorded successfully",
      });
    },
  );
});

app.delete("/api/payments/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Payments WHERE PaymentID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Payment deleted successfully" });
  });
});

// =====================================================
// SUPPORTING MODULES ENDPOINTS
// =====================================================

// Tax Rates endpoints
app.get("/api/taxrates", authenticateToken, (req, res) => {
  db.all("SELECT * FROM TaxRates ORDER BY TaxRateID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/taxrates", authenticateToken, (req, res) => {
  const { TaxName, TaxRate, TaxType, Description, IsActive } = req.body;
  db.run(
    `INSERT INTO TaxRates (TaxName, TaxRate, TaxType, Description, IsActive) VALUES (?, ?, ?, ?, ?)`,

    [
      TaxName,
      TaxRate,
      TaxType || "Percentage",
      Description || "",
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ TaxRateID: this.lastID, message: "Tax rate created" });
    },
  );
});

app.put("/api/taxrates/:id", authenticateToken, (req, res) => {
  const { TaxName, TaxRate, TaxType, Description, IsActive } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE TaxRates SET TaxName = ?, TaxRate = ?, TaxType = ?, Description = ?, IsActive = ? WHERE TaxRateID = ?`,
    [TaxName, TaxRate, TaxType, Description, IsActive, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Tax rate updated" });
    },
  );
});

app.delete("/api/taxrates/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM TaxRates WHERE TaxRateID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Tax rate deleted" });
  });
});

// Currencies endpoints
app.get("/api/currencies", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Currencies ORDER BY CurrencyID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/currencies", authenticateToken, (req, res) => {
  const {
    CurrencyCode,
    CurrencyName,
    Symbol,
    ExchangeRate,
    IsBaseCurrency,
    IsActive,
  } = req.body;
  if (IsBaseCurrency === 1) db.run("UPDATE Currencies SET IsBaseCurrency = 0");
  db.run(
    `INSERT INTO Currencies (CurrencyCode, CurrencyName, Symbol, ExchangeRate, 
IsBaseCurrency, IsActive) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      CurrencyCode,
      CurrencyName,
      Symbol,
      ExchangeRate || 1,
      IsBaseCurrency || 0,
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ CurrencyID: this.lastID, message: "Currency created" });
    },
  );
});

app.put("/api/currencies/:id", authenticateToken, (req, res) => {
  const {
    CurrencyCode,
    CurrencyName,
    Symbol,
    ExchangeRate,
    IsBaseCurrency,
    IsActive,
  } = req.body;
  const { id } = req.params;
  if (IsBaseCurrency === 1) db.run("UPDATE Currencies SET IsBaseCurrency = 0");
  db.run(
    `UPDATE Currencies SET CurrencyCode = ?, CurrencyName = ?, Symbol = ?, ExchangeRate = ?, IsBaseCurrency = ?, IsActive = ? WHERE CurrencyID = ?`,
    [
      CurrencyCode,
      CurrencyName,
      Symbol,
      ExchangeRate,
      IsBaseCurrency,
      IsActive,
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Currency updated" });
    },
  );
});

app.delete("/api/currencies/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT IsBaseCurrency FROM Currencies WHERE CurrencyID = ?",
    [id],
    (err, row) => {
      if (row && row.IsBaseCurrency === 1)
        return res.status(400).json({ error: "Cannot delete base currency" });
      db.run(
        "DELETE FROM Currencies WHERE CurrencyID = ?",
        [id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Currency deleted" });
        },
      );
    },
  );
});

// Inventory Transactions endpoints
app.get("/api/inventory/transactions", authenticateToken, (req, res) => {
  const { itemId, startDate, endDate, type } = req.query;
  let query = `SELECT it.*, i.ItemName, i.ItemCode FROM InventoryTransactions it LE
FT JOIN Items i ON it.ItemID = i.ItemID WHERE 1=1`;
  const params = [];
  if (itemId) {
    query += " AND it.ItemID = ?";
    params.push(itemId);
  }
  if (startDate) {
    query += " AND it.TransactionDate >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND it.TransactionDate <= ?";
    params.push(endDate);
  }
  if (type) {
    query += " AND it.TransactionType = ?";
    params.push(type);
  }
  query += " ORDER BY it.TransactionDate DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/inventory/transactions", authenticateToken, (req, res) => {
  const {
    ItemID,
    TransactionType,
    TransactionDate,
    Quantity,
    UnitCost,
    Notes,
  } = r;
  eq.body;
  if (!ItemID || !TransactionType || !TransactionDate || !Quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (TransactionType === "OUT") {
    db.get(
      "SELECT StockQuantity FROM Items WHERE ItemID = ?",
      [ItemID],
      (err, itssssem) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item || item.StockQuantity < Quantity)
          return res
            .status(400)
            .json({ error: "Insufficient stock available" });
        proceedWithTransaction();
      },
    );
  } else {
    proceedWithTransaction();
  }

  function proceedWithTransaction() {
    db.run(
      `INSERT INTO InventoryTransactions (ItemID, TransactionType, TransactionDate, Quantity, UnitCost, Notes, CreatedBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ItemID,
        TransactionType,
        TransactionDate,
        Quantity,
        UnitCost,
        Notes || "",
        req.user.userId,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const stockChange = TransactionType === "IN" ? Quantity : -Quantity;
        db.run(
          "UPDATE Items SET StockQuantity = StockQuantity + ? WHERE ItemID = ?",
          [stockChange, ItemID],
        );
        res.json({
          TransactionID: this.lastID,
          message: "Transaction recorded",
        });
      },
    );
  }
});

// Webhooks endpoints
app.get("/api/webhooks", authenticateToken, (req, res) => {
  db.all("SELECT * FROM Webhooks ORDER BY WebhookID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/webhooks", authenticateToken, (req, res) => {
  const { Name, EndpointURL, EventType, SecretKey, IsActive } = req.body;
  db.run(
    `INSERT INTO Webhooks (Name, EndpointURL, EventType, SecretKey, IsActive) 
VALUES (?, ?, ?, ?, ?)`,
    [
      Name,
      EndpointURL,
      EventType,
      SecretKey || null,
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ WebhookID: this.lastID, message: "Webhook created" });
    },
  );
});

app.put("/api/webhooks/:id", authenticateToken, (req, res) => {
  const { Name, EndpointURL, EventType, SecretKey, IsActive } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE Webhooks SET Name = ?, EndpointURL = ?, EventType = ?, SecretKey = ?, IsActive = ? WHERE WebhookID = ?`,
    [Name, EndpointURL, EventType, SecretKey, IsActive, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Webhook updated" });
    },
  );
});

app.delete("/api/webhooks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Webhooks WHERE WebhookID = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Webhook deleted" });
  });
});

// Email Templates endpoints
app.get("/api/email-templates", authenticateToken, (req, res) => {
  db.all("SELECT * FROM EmailTemplates ORDER BY TemplateID", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/email-templates", authenticateToken, (req, res) => {
  const { TemplateName, Subject, Body, EventType, IsActive } = req.body;

  db.run(
    `INSERT INTO EmailTemplates (TemplateName, Subject, Body, EventType, IsAct 
ive) VALUES (?, ?, ?, ?, ?)`,
    [
      TemplateName,
      Subject,
      Body,
      EventType,
      IsActive !== undefined ? IsActive : 1,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ TemplateID: this.lastID, message: "Email template created" });
    },
  );
});

app.put("/api/email-templates/:id", authenticateToken, (req, res) => {
  const { TemplateName, Subject, Body, EventType, IsActive } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE EmailTemplates SET TemplateName = ?, Subject = ?, Body = ?, EventType = ?, IsActive = ?, LastModified = CURRENT_TIMESTAMP WHERE TemplateID = ?`,
    [TemplateName, Subject, Body, EventType, IsActive, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Email template updated" });
    },
  );
});

app.delete("/api/email-templates/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run(
    "DELETE FROM EmailTemplates WHERE TemplateID = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Email template deleted" });
    },
  );
});

// Report Configurations endpoints
app.get("/api/report-configs", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM ReportConfigurations ORDER BY ConfigID",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/report-configs", authenticateToken, (req, res) => {
  const { ReportType, ConfigName, ConfigData, IsDefault } = req.body;
  if (IsDefault === 1)
    db.run(
      "UPDATE ReportConfigurations SET IsDefault = 0 WHERE ReportType = ?",
      [ReportType],
    );
  db.run(
    `INSERT INTO ReportConfigurations (ReportType, ConfigName, ConfigData, IsDefault, CreatedBy) VALUES (?, ?, ?, ?, ?)`,
    [ReportType, ConfigName, ConfigData, IsDefault || 0, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        ConfigID: this.lastID,
        message: "Report configuration saved",
      });
    },
  );
});

app.put("/api/report-configs/:id", authenticateToken, (req, res) => {
  const { ConfigName, ConfigData, IsDefault } = req.body;
  const { id } = req.params;
  db.get(
    "SELECT ReportType FROM ReportConfigurations WHERE ConfigID = ?",
    [id],
    (err, config) => {
      if (err) return res.status(500).json({ error: err.message });
      if (IsDefault === 1)
        db.run(
          "UPDATE ReportConfigurations SET IsDefault = 0 WHERE ReportType = ?",
          [config.ReportType],
        );
      db.run(
        `UPDATE ReportConfigurations SET ConfigName = ?, ConfigData = ?, IsDefault = ? WHERE ConfigID = ?`,
        [ConfigName, ConfigData, IsDefault, id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Report configuration updated" });
        },
      );
    },
  );
});

app.delete("/api/report-configs/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run(
    "DELETE FROM ReportConfigurations WHERE ConfigID = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Report configuration deleted" });
    },
  );
});

// =====================================================
// DOCUMENTS ENDPOINTS (with file upload)
// =====================================================

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        "-" +
        file.originalname,
    ),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    cb(null, allowedTypes.includes(file.mimetype));
  },
});

app.get("/api/documents/:type/:id", authenticateToken, (req, res) => {
  const { type, id } = req.params;
  db.all(
    "SELECT * FROM Documents WHERE DocumentType = ? AND ReferenceID = ? ORDER BY UploadedAt DESC",
    [type, id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post(
  "/api/documents",
  authenticateToken,
  upload.single("file"),
  (req, res) => {
    const { DocumentType, ReferenceID, Description } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    db.run(
      `INSERT INTO Documents (DocumentType, ReferenceID, FileName, FilePath, FileSize, MimeType, Description, UploadedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DocumentType,
        ReferenceID,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        Description || "",
        req.user.userId,
      ],
      function (err) {
        if (err) {
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ error: err.message });
        }
        res.json({ DocumentID: this.lastID, message: "Document uploaded" });
      },
    );
  },
);

app.get("/api/documents/:id/download", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM Documents WHERE DocumentID = ?", [id], (err, doc) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (fs.existsSync(doc.FilePath)) res.download(doc.FilePath, doc.FileName);
    else res.status(404).json({ error: "File not found on server" });
  });
});

app.delete("/api/documents/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM Documents WHERE DocumentID = ?", [id], (err, doc) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (fs.existsSync(doc.FilePath)) fs.unlinkSync(doc.FilePath);
    db.run("DELETE FROM Documents WHERE DocumentID = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Document deleted" });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
