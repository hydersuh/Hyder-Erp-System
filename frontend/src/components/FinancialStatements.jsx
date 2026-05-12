import React, { useState, useEffect } from "react";
import {
  FaDownload,
  FaPrint,
  FaChartLine,
  FaBalanceScale,
  FaMoneyBillWave,
  FaChartPie,
} from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const FinancialStatements = () => {
  const [activeStatement, setActiveStatement] = useState("income");
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [equityChanges, setEquityChanges] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    if (activeStatement === "income") {
      fetchIncomeStatement();
    } else if (activeStatement === "balance") {
      fetchBalanceSheet();
    } else if (activeStatement === "cashflow") {
      fetchCashFlow();
    } else if (activeStatement === "equity") {
      fetchEquityChanges();
    }
  }, [activeStatement, dateRange, asOfDate]);

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const response = await api.get("/financials/income-statement", {
        params: dateRange,
      });
      setIncomeStatement(response.data);
    } catch (err) {
      toast.error("Failed to fetch income statement");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const response = await api.get("/financials/balance-sheet", {
        params: { asOfDate },
      });
      setBalanceSheet(response.data);
    } catch (err) {
      toast.error("Failed to fetch balance sheet");
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    setLoading(true);
    try {
      const response = await api.get("/financials/cash-flow", {
        params: dateRange,
      });
      setCashFlow(response.data);
    } catch (err) {
      toast.error("Failed to fetch cash flow statement");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquityChanges = async () => {
    setLoading(true);

    try {
      const response = await api.get("/financials/equity-changes", {
        params: dateRange,
      });
      setEquityChanges(response.data);
    } catch (err) {
      toast.error("Failed to fetch equity changes statement");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let data = [];
    let filename = "";

    if (activeStatement === "income" && incomeStatement) {
      filename = `income_statement_${dateRange.startDate}_to_${dateRange.endDate}`;
      data = [
        ["Income Statement - IFRS 18 Compliant"],
        [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
        [],
        ["Category", "Amount ($)", "Classification"],
        [
          "Operating Revenue",
          incomeStatement.incomeStatement.operatingRevenue.amount.toFixed(2),
          "Operating",
        ],
        [
          "Operating Expenses",
          `(${incomeStatement.incomeStatement.operatingExpenses.amount.toFixed(2)})`,
          "Operating",
        ],
        [
          "Operating Profit",
          incomeStatement.incomeStatement.operatingProfit.amount.toFixed(2),
          "Operating",
        ],
        [
          "Investment Income",
          incomeStatement.incomeStatement.investmentIncome.amount.toFixed(2),
          "Investing",
        ],
        [
          "Financing Costs",
          `(${incomeStatement.incomeStatement.financingCosts.amount.toFixed(2)})`,
          "Financing",
        ],
        [
          "Net Financing Result",
          incomeStatement.incomeStatement.netFinancingResult.amount.toFixed(2),
          "Financing",
        ],
        [
          "Profit Before Tax",
          incomeStatement.incomeStatement.profitBeforeTax.amount.toFixed(2),
          "Total",
        ],
        [
          "Tax Expense",
          `(${incomeStatement.incomeStatement.taxExpense.amount.toFixed(2)})`,
          "Total",
        ],
        [
          "Net Profit",
          incomeStatement.incomeStatement.netProfit.amount.toFixed(2),
          "Total",
        ],
      ];
    } else if (activeStatement === "balance" && balanceSheet) {
      filename = `balance_sheet_${asOfDate}`;
      data = [
        ["Balance Sheet - IFRS 18 Compliant"],
        [`As of: ${asOfDate}`],
        [],
        ["ASSETS", "Amount ($)"],
        ...balanceSheet.assets.items.map((a) => [
          a.AccName,
          a.balance.toFixed(2),
        ]),
        ["Total Assets", balanceSheet.assets.total.toFixed(2)],
        [],
        ["LIABILITIES", "Amount ($)"],
        ...balanceSheet.liabilities.items.map((l) => [
          l.AccName,
          l.balance.toFixed(2),
        ]),
        ["Total Liabilities", balanceSheet.liabilities.total.toFixed(2)],
        [],
        ["EQUITY", "Amount ($)"],
        ...balanceSheet.equity.items.map((e) => [
          e.AccName,
          e.balance.toFixed(2),
        ]),
        ["Total Equity", balanceSheet.equity.total.toFixed(2)],
        [],
        [
          "Total Liabilities & Equity",
          balanceSheet.totalLiabilitiesEquity.toFixed(2),
        ],
      ];
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    data.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const printReport = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statements = [
    { id: "income", label: "Income Statement", icon: FaChartLine },
    { id: "balance", label: "Balance Sheet", icon: FaBalanceScale },
    { id: "cashflow", label: "Cash Flow Statement", icon: FaMoneyBillWave },
    { id: "equity", label: "Statement of Changes in Equity", icon: FaChartPie },
  ];

  return (
    <div className="financial-statements print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">
          Financial Statements (IFRS 18 Compliant)
        </h1>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn-success flex items-center"
          >
            <FaDownload className="mr-2" /> Export CSV
          </button>
          <button
            onClick={printReport}
            className="btn-primary flex items-center"
          >
            <FaPrint className="mr-2" /> Print
          </button>
        </div>
      </div>

      {/* Statement Tabs */}
      <div className="flex border-b border-gray-200 mb-6 print:hidden">
        {statements.map((statement) => {
          const Icon = statement.icon;
          return (
            <button
              key={statement.id}
              onClick={() => setActiveStatement(statement.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeStatement === statement.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="mr-2" size={16} />
              {statement.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Selectors */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 print:hidden">
        {activeStatement === "balance" ? (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              As of Date:
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="form-input w-48"
            />
            <button onClick={fetchBalanceSheet} className="btn-primary">
              Refresh
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="form-input w-48"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="form-input w-48"
            />
            <button onClick={fetchIncomeStatement} className="btn-primary">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Income Statement - IFRS 18 */}
      {!loading && activeStatement === "income" && incomeStatement && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
          <div className="p-6 border-b border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Income Statement
            </h2>
            <p className="text-gray-500">
              For the period{" "}
              {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
              {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prepared in accordance with IFRS 18
            </p>
          </div>

          <div className="p-6">
            {/* Operating Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                Operating Activities
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">
                    Revenue from contracts with customers
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      incomeStatement.incomeStatement.operatingRevenue.amount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Operating expenses</span>
                  <span className="font-medium text-red-600">
                    (
                    {formatCurrency(
                      incomeStatement.incomeStatement.operatingExpenses.amount,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                  <span className="font-semibold">Operating profit</span>
                  <span className="font-bold">
                    {formatCurrency(
                      incomeStatement.incomeStatement.operatingProfit.amount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Financing and Investing Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                Financing and Investing Activities
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Investment income</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      incomeStatement.incomeStatement.investmentIncome.amount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Financing costs</span>
                  <span className="font-medium text-red-600">
                    (
                    {formatCurrency(
                      incomeStatement.incomeStatement.financingCosts.amount,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                  <span className="font-semibold">Net financing result</span>

                  <span className="font-bold">
                    {formatCurrency(
                      incomeStatement.incomeStatement.netFinancingResult.amount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="mb-6">
              <div className="flex justify-between py-2 bg-gray-50 px-3 rounded">
                <span className="font-semibold">Profit before tax</span>
                <span className="font-bold">
                  {formatCurrency(
                    incomeStatement.incomeStatement.profitBeforeTax.amount,
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2 px-3">
                <span className="text-gray-600">Income tax expense</span>
                <span className="text-red-600">
                  (
                  {formatCurrency(
                    incomeStatement.incomeStatement.taxExpense.amount,
                  )}
                  )
                </span>
              </div>
              <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lgmt-2">
                <span className="font-bold text-lg">NET PROFIT</span>
                <span className="font-bold text-lg text-primary-600">
                  {formatCurrency(
                    incomeStatement.incomeStatement.netProfit.amount,
                  )}
                </span>
              </div>
            </div>

            {/* IFRS 18 Disclosure Note */}
            <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-500 print:text-gray-400">
              <p className="font-medium mb-1">Note: IFRS 18 Classification</p>
              <p>
                This income statement has been prepared following IFRS 18
                requirements, with income and expenses classified into
                operating, investing, and financing cate gories. Operating
                profit is presented as a mandatory subtotal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}

      {!loading && activeStatement === "balance" && balanceSheet && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
          <div className="p-6 border-b border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Statement of Financial Position
            </h2>
            <p className="text-gray-500">
              As at {new Date(asOfDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prepared in accordance with IFRS 18
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assets Column */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                  ASSETS
                </h3>
                <div className="space-y-1">
                  {balanceSheet.assets.items.map((asset, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-gray-600">{asset.AccName}</span>
                      <span>{formatCurrency(asset.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2 font-bold">
                    <span>Total Assets</span>
                    <span>{formatCurrency(balanceSheet.assets.total)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                  LIABILITIES & EQUITY
                </h3>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-600 mb-2">
                    Liabilities
                  </h4>
                  {balanceSheet.liabilities.items.map((liability, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-gray-600 pl-4">
                        {liability.AccName}
                      </span>
                      <span>{formatCurrency(liability.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-200 mt-1 pt-1 font-medium">
                    <span>Total Liabilities</span>
                    <span>
                      {formatCurrency(balanceSheet.liabilities.total)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-600 mb-2">Equity</h4>
                  {balanceSheet.equity.items.map((equity, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-gray-600 pl-4">
                        {equity.AccName}
                      </span>
                      <span>{formatCurrency(equity.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-200 mt-1 pt-1 font-medium">
                    <span>Total Equity</span>
                    <span>{formatCurrency(balanceSheet.equity.total)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lg mt-4 font-bold">
                  <span>Total Liabilities & Equity</span>
                  <span>
                    {formatCurrency(balanceSheet.totalLiabilitiesEquity)}
                  </span>
                </div>

                {balanceSheet.isBalanced ? (
                  <div className="mt-3 text-green-600 text-sm">
                    ✓ Balance Sheet is balanced
                  </div>
                ) : (
                  <div className="mt-3 text-red-600 text-sm">
                    ⚠️ Balance Sheet difference:{" "}
                    {formatCurrency(balanceSheet.difference)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Statement */}
      {!loading && activeStatement === "cashflow" && cashFlow && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
          <div className="p-6 border-b border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Statement of Cash Flows
            </h2>
            <p className="text-gray-500">
              For the period{" "}
              {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
              {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prepared in accordance with IFRS 18
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Operating Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                  Cash Flows from Operating Activities
                </h3>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {cashFlow.operatingActivities.description}
                  </span>
                  <span
                    className={
                      cashFlow.operatingActivities.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(cashFlow.operatingActivities.amount)}
                  </span>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                  Cash Flows from Investing Activities
                </h3>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {cashFlow.investingActivities.description}
                  </span>
                  <span
                    className={
                      cashFlow.investingActivities.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(cashFlow.investingActivities.amount)}
                  </span>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
                  Cash Flows from Financing Activities
                </h3>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {cashFlow.financingActivities.description}
                  </span>
                  <span
                    className={
                      cashFlow.financingActivities.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(cashFlow.financingActivities.amount)}
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between py-2">
                  <span className="font-semibold">
                    Net increase/(decrease) in cash andcash equivalents
                  </span>
                  <span className="font-bold">
                    {formatCurrency(cashFlow.netCashFlow.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    Cash and cash equivalents at beginning of period
                  </span>

                  <span>
                    {formatCurrency(cashFlow.openingCashBalance.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-lg">
                    Cash and cash equivalents at end of period
                  </span>
                  <span className="font-bold text-lg text-primary-600">
                    {formatCurrency(cashFlow.closingCashBalance.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement of Changes in Equity */}
      {!loading && activeStatement === "equity" && equityChanges && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
          <div className="p-6 border-b border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Statement of Changes in Equity
            </h2>
            <p className="text-gray-500">
              For the period{" "}
              {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
              {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prepared in accordance with IFRS 18
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Equity Component</th>
                  <th className="p-3 text-right">Opening Balance</th>
                  <th className="p-3 text-right">Changes</th>
                  <th className="p-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equityChanges.equityComponents.map((component, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{component.AccName}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(component.openingBalance)}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={
                          component.changes >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(component.changes)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(component.closingBalance)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="p-3 font-bold">Total Equity</td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(equityChanges.totals.openingBalance)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(equityChanges.totals.totalChanges)}
                  </td>
                  <td className="p-3 text-right font-bold text-primary-600">
                    {formatCurrency(equityChanges.totals.closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          body {
            font-size: 10pt;
          }
          .bg-primary-50 {
            background-color: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default FinancialStatements;
