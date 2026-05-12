-- ===================================================== 
-- 1. CORE TABLES 
-- ===================================================== 
 
-- Users table 
CREATE TABLE IF NOT EXISTS Users ( 
    UserID INTEGER PRIMARY KEY AUTOINCREMENT, 
    Username TEXT UNIQUE NOT NULL, 
    PasswordHash TEXT NOT NULL, 
    Email TEXT UNIQUE NOT NULL, 
    FullName TEXT NOT NULL, 
    Role TEXT DEFAULT 'user', 
    IsActive INTEGER DEFAULT 1, 
    LastLogin TEXT, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- Customers table 
CREATE TABLE IF NOT EXISTS Customers ( 
    CustomerID INTEGER PRIMARY KEY AUTOINCREMENT, 
    CustomerCode TEXT UNIQUE NOT NULL, 
    CompanyName TEXT NOT NULL, 
    ContactName TEXT, 
    Email TEXT, 
    Phone TEXT, 
    Address TEXT, 
    City TEXT, 
    Country TEXT, 
    CreditLimit REAL DEFAULT 0, 
    CurrentBalance REAL DEFAULT 0, 
    IsActive INTEGER DEFAULT 1, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- Vendors table 
CREATE TABLE IF NOT EXISTS Vendors ( 
    VendorID INTEGER PRIMARY KEY AUTOINCREMENT, 
    VendorCode TEXT UNIQUE NOT NULL, 
    CompanyName TEXT NOT NULL, 
    ContactName TEXT, 
    Email TEXT, 
    Phone TEXT, 
    Address TEXT, 
    City TEXT, 
    Country TEXT, 
    PaymentTerms TEXT DEFAULT 'NET 30', 
    IsActive INTEGER DEFAULT 1, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 

-- Items table 
CREATE TABLE IF NOT EXISTS Items ( 
    ItemID INTEGER PRIMARY KEY AUTOINCREMENT, 
    ItemCode TEXT UNIQUE NOT NULL, 
    ItemName TEXT NOT NULL, 
    Description TEXT, 
    Category TEXT, 
    UnitOfMeasure TEXT DEFAULT 'PCS', 
    PurchasePrice REAL DEFAULT 0, 
    SalePrice REAL DEFAULT 0, 
    StockQuantity REAL DEFAULT 0, 
    MinStockLevel REAL DEFAULT 0, 
    IsActive INTEGER DEFAULT 1, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- ===================================================== 
-- 2. TRANSACTION TABLES 
-- ===================================================== 
 
-- Invoices table 
CREATE TABLE IF NOT EXISTS Invoices ( 
    InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT, 
    InvoiceNumber TEXT UNIQUE NOT NULL, 
    CustomerID INTEGER NOT NULL, 
    InvoiceDate TEXT NOT NULL, 
    DueDate TEXT NOT NULL, 
    SubTotal REAL DEFAULT 0, 
    TaxAmount REAL DEFAULT 0, 
    DiscountAmount REAL DEFAULT 0, 
    TotalAmount REAL DEFAULT 0, 
    Status TEXT DEFAULT 'Draft', 
    Notes TEXT, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID), 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 

-- InvoiceItems table 
CREATE TABLE IF NOT EXISTS InvoiceItems ( 
    InvoiceItemID INTEGER PRIMARY KEY AUTOINCREMENT, 
    InvoiceID INTEGER NOT NULL, 
    ItemID INTEGER NOT NULL, 
    Quantity REAL NOT NULL, 
    UnitPrice REAL NOT NULL, 
    Discount REAL DEFAULT 0, 
    TaxRate REAL DEFAULT 0, 
    LineTotal REAL NOT NULL, 
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID) ON DELETE CASCADE, 
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID) 
); 
 
-- Bills table 
CREATE TABLE IF NOT EXISTS Bills ( 
    BillID INTEGER PRIMARY KEY AUTOINCREMENT, 
    BillNumber TEXT UNIQUE NOT NULL, 
    VendorID INTEGER NOT NULL, 
    BillDate TEXT NOT NULL, 
    DueDate TEXT NOT NULL, 
    SubTotal REAL DEFAULT 0, 
    TaxAmount REAL DEFAULT 0, 
    DiscountAmount REAL DEFAULT 0, 
    TotalAmount REAL DEFAULT 0, 
    Status TEXT DEFAULT 'Draft', 
    Notes TEXT, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID), 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 
 
-- BillItems table 
CREATE TABLE IF NOT EXISTS BillItems ( 
    BillItemID INTEGER PRIMARY KEY AUTOINCREMENT, 
    BillID INTEGER NOT NULL, 
    ItemID INTEGER NOT NULL, 
    Quantity REAL NOT NULL, 
    UnitPrice REAL NOT NULL, 
    Discount REAL DEFAULT 0, 
    TaxRate REAL DEFAULT 0, 
    LineTotal REAL NOT NULL, 
    FOREIGN KEY (BillID) REFERENCES Bills(BillID) ON DELETE CASCADE, 
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID) 
); 
 
-- Payments table 
CREATE TABLE IF NOT EXISTS Payments ( 
    PaymentID INTEGER PRIMARY KEY AUTOINCREMENT, 
    PaymentNumber TEXT UNIQUE NOT NULL, 
    CustomerID INTEGER, 
    VendorID INTEGER, 
    InvoiceID INTEGER, 
    BillID INTEGER, 
    PaymentDate TEXT NOT NULL, 
    Amount REAL NOT NULL, 
    PaymentMethod TEXT DEFAULT 'Cash', 
    ReferenceNumber TEXT, 
    Notes TEXT, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID), 
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID), 
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID), 
    FOREIGN KEY (BillID) REFERENCES Bills(BillID), 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 
 
-- ===================================================== 
-- 3. ACCOUNTING HIERARCHY TABLES 
-- ===================================================== 
 
-- Main table (Level 1 - Top Level) 
CREATE TABLE IF NOT EXISTS Main ( 
    PrimID INTEGER PRIMARY KEY AUTOINCREMENT, 
    PrimName TEXT NOT NULL UNIQUE, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- subMain table (Level 2) 
CREATE TABLE IF NOT EXISTS subMain ( 
    SubPrimID INTEGER PRIMARY KEY AUTOINCREMENT, 
    PrimID INTEGER NOT NULL, 
    SubName TEXT NOT NULL, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (PrimID) REFERENCES Main(PrimID) 
); 
 
-- Groups table (Level 3) 
CREATE TABLE IF NOT EXISTS Groups ( 
    GroupID INTEGER PRIMARY KEY AUTOINCREMENT, 
    SubPrimID INTEGER NOT NULL, 
    GroupName TEXT NOT NULL, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (SubPrimID) REFERENCES subMain(SubPrimID) 
); 
 
-- SubGroups table (Level 4) 
CREATE TABLE IF NOT EXISTS SubGroups ( 
    SubGroupID INTEGER PRIMARY KEY AUTOINCREMENT, 
    GroupID INTEGER NOT NULL, 
    SubName TEXT NOT NULL, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (GroupID) REFERENCES Groups(GroupID) 
); 
 
-- Ledgers table (Level 5 - Final Account Level) 
CREATE TABLE IF NOT EXISTS Ledgers ( 
    AcNo INTEGER PRIMARY KEY AUTOINCREMENT, 
    SubGroupID INTEGER NOT NULL, 
    AccName TEXT NOT NULL, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (SubGroupID) REFERENCES SubGroups(SubGroupID) 
); 
 
-- ===================================================== 
-- 4. JOURNAL ENTRIES TABLES 
-- ===================================================== 
 
-- JournalEntries table 
CREATE TABLE IF NOT EXISTS JournalEntries ( 
    EntryID INTEGER PRIMARY KEY AUTOINCREMENT, 
    EntryDate TEXT NOT NULL, 
    Narration TEXT NOT NULL, 
    TotDr REAL DEFAULT 0, 
    TotCr REAL DEFAULT 0, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 
 
-- EntryDetails table 
CREATE TABLE IF NOT EXISTS EntryDetails ( 
    DetailID INTEGER PRIMARY KEY AUTOINCREMENT, 
    EntryID INTEGER NOT NULL, 
    AcNo INTEGER NOT NULL, 
    Debit REAL DEFAULT 0, 
    Credit REAL DEFAULT 0, 
    CurrC TEXT DEFAULT 'USD', 
    CRate REAL DEFAULT 1, 
    LastUpdate TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (EntryID) REFERENCES JournalEntries(EntryID) ON DELETE CASCADE, 
    FOREIGN KEY (AcNo) REFERENCES Ledgers(AcNo) 
); 
 
-- Create indexes for better performance 
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON JournalEntries(EntryDate); 
CREATE INDEX IF NOT EXISTS idx_entry_details_entry ON EntryDetails(EntryID); 
CREATE INDEX IF NOT EXISTS idx_entry_details_acno ON EntryDetails(AcNo); 
 
-- ===================================================== 
-- 5. SUPPORTING TABLES 
-- ===================================================== 
-- TaxRates table 
CREATE TABLE IF NOT EXISTS TaxRates ( 
    TaxRateID INTEGER PRIMARY KEY AUTOINCREMENT, 
    TaxName TEXT NOT NULL, 
    TaxRate REAL NOT NULL, 
    TaxType TEXT DEFAULT 'Percentage', 
    IsActive INTEGER DEFAULT 1, 
    Description TEXT, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- Currencies table 
CREATE TABLE IF NOT EXISTS Currencies ( 
    CurrencyID INTEGER PRIMARY KEY AUTOINCREMENT, 
    CurrencyCode TEXT UNIQUE NOT NULL, 
    CurrencyName TEXT NOT NULL, 
    Symbol TEXT NOT NULL, 
    ExchangeRate REAL DEFAULT 1, 
    IsBaseCurrency INTEGER DEFAULT 0, 
    IsActive INTEGER DEFAULT 1, 
    LastUpdated TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- InventoryTransactions table 
CREATE TABLE IF NOT EXISTS InventoryTransactions ( 
    TransactionID INTEGER PRIMARY KEY AUTOINCREMENT, 
    ItemID INTEGER NOT NULL, 
    TransactionType TEXT NOT NULL, 
    TransactionDate TEXT NOT NULL, 
    Quantity REAL NOT NULL, 
    UnitCost REAL, 
    ReferenceID INTEGER, 
    ReferenceType TEXT, 
    Notes TEXT, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID), 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 
 
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON InventoryTransactions(ItemID); 
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON InventoryTransactions(TransactionDate); 
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON InventoryTransactions(TransactionType); 
 
-- Documents table 
CREATE TABLE IF NOT EXISTS Documents ( 
    DocumentID INTEGER PRIMARY KEY AUTOINCREMENT, 
    DocumentType TEXT NOT NULL, 
    ReferenceID INTEGER NOT NULL, 
    FileName TEXT NOT NULL, 
    FilePath TEXT NOT NULL, 
    FileSize INTEGER, 
    MimeType TEXT, 
    Description TEXT, 
    UploadedBy INTEGER, 
    UploadedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (UploadedBy) REFERENCES Users(UserID) 
); 
 
CREATE INDEX IF NOT EXISTS idx_documents_reference ON Documents(DocumentType, ReferenceID); 
 
-- Webhooks table 
CREATE TABLE IF NOT EXISTS Webhooks ( 
    WebhookID INTEGER PRIMARY KEY AUTOINCREMENT, 
    Name TEXT NOT NULL, 
    EndpointURL TEXT NOT NULL, 
    EventType TEXT NOT NULL, 
    SecretKey TEXT, 
    IsActive INTEGER DEFAULT 1, 
    LastTriggered TEXT, 
    LastResponse TEXT, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON Webhooks(EventType); 
 
-- EmailTemplates table 
CREATE TABLE IF NOT EXISTS EmailTemplates ( 
    TemplateID INTEGER PRIMARY KEY AUTOINCREMENT, 
    TemplateName TEXT NOT NULL, 
    Subject TEXT NOT NULL, 
    Body TEXT NOT NULL, 
    EventType TEXT NOT NULL, 
    IsActive INTEGER DEFAULT 1, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    LastModified TEXT DEFAULT CURRENT_TIMESTAMP 
); 
 
-- ReportConfigurations table 
CREATE TABLE IF NOT EXISTS ReportConfigurations ( 
    ConfigID INTEGER PRIMARY KEY AUTOINCREMENT, 
    ReportType TEXT NOT NULL, 
    ConfigName TEXT NOT NULL, 
    ConfigData TEXT NOT NULL, 
    IsDefault INTEGER DEFAULT 0, 
    CreatedBy INTEGER, 
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) 
); 
 
-- ===================================================== 
-- 6. DEFAULT DATA 
-- ===================================================== 
 
-- Insert default currencies 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('USD', 'US Dollar', '$', 1); 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('EUR', 'Euro', '€', 0); 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('GBP', 'British Pound', '£', 0); 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('JPY', 'Japanese Yen', '¥', 0); 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('CAD', 'Canadian Dollar', 'C$', 0); 
INSERT OR IGNORE INTO Currencies (CurrencyCode, CurrencyName, Symbol, IsBaseCurrency) VALUES ('AUD', 'Australian Dollar', 'A$', 0); 
 
-- Insert default tax rates 
INSERT OR IGNORE INTO TaxRates (TaxName, TaxRate, TaxType, Description) VALUES ('VAT', 20.0, 'Percentage', 'Value Added Tax'); 
INSERT OR IGNORE INTO TaxRates (TaxName, TaxRate, TaxType, Description) VALUES ('GST', 18.0, 'Percentage', 'Goods and Services Tax'); 
INSERT OR IGNORE INTO TaxRates (TaxName, TaxRate, TaxType, Description) VALUES ('Sales Tax', 10.0, 'Percentage', 'State Sales Tax');  
-- Insert default email templates 
INSERT OR IGNORE INTO EmailTemplates (TemplateName, Subject, Body, EventType) 
VALUES ('Invoice Created', 'New Invoice #{{invoice_number}}', '<h2>Dear {{customer_name}},</h2><p>Please find attached invoice #{{invoice_number}} for amount ${{amount}}.</p><p>Due Date: {{due_date}}</p><p>Thank you for your business!</p>', 'invoice_created'); 
INSERT OR IGNORE INTO EmailTemplates (TemplateName, Subject, Body, EventType) VALUES ('Invoice Overdue', 'Overdue Invoice #{{invoice_number}}', '<h2>Dear {{customer_name}},</h2><p>This is a reminder that invoice #{{invoice_number}} for amount ${{amount}} was due on {{due_date}}.</p><p>Please make payment at your earliest convenience.</p>', 'invoice_overdue'); 
INSERT OR IGNORE INTO EmailTemplates (TemplateName, Subject, Body, EventType) VALUES ('Payment Received', 'Payment Received - {{payment_number}}', '<h2>Dear {{entity_name}},</h2><p>Thank you for your payment of ${{amount}}.</p><p>Payment Reference:{{payment_number}}</p><p>Your account has been credited.</p>', 'payment_received'); 
 
-- Insert default accounting hierarchy 
INSERT OR IGNORE INTO Main (PrimName) VALUES ('Assets'); 
INSERT OR IGNORE INTO Main (PrimName) VALUES ('Liabilities'); 
INSERT OR IGNORE INTO Main (PrimName) VALUES ('Equity'); 
INSERT OR IGNORE INTO Main (PrimName) VALUES ('Income'); 
INSERT OR IGNORE INTO Main (PrimName) VALUES ('Expenses'); 