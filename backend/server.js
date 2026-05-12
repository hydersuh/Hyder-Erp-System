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
    `SELECT i.InvoiceID, i.InvoiceNumber, i.InvoiceDate, i.TotalAmount, i.Status, c.C
ompanyName 
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

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
