import React, { useState, useEffect } from "react";
import { FaDownload, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState(null);
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const response = await api.get("/trialbalance", { params: { asOfDate } });
      setTrialBalance(response.data);
    } catch (err) {
      toast.error("Failed to fetch trial balance");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!trialBalance || !trialBalance.accounts) return;

    const headers = [
      "Account No",
      "Account Name",
      "Main",
      "Sub Main",
      "Group",
      "SubGroup",
      "Debit",
      "Credit",
    ];
    const csvData = [
      headers,
      ...trialBalance.accounts.map((acc) => [
        acc.AcNo,
        acc.AccName,
        acc.MainName || "-",
        acc.SubMainName || "-",
        acc.GroupName || "-",
        acc.SubGroupName || "-",
        acc.TotalDebit.toFixed(2),
        acc.TotalCredit.toFixed(2),
      ]),
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvData.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trial_balance_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="trial-balance-report">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Trial Balance</h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">As of Date:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="form-input w-40"
            />
            <button
              onClick={fetchTrialBalance}
              className="btn-secondary text-sm px-3 py-2"
            >
              <FaSearch className="inline mr-1" /> Refresh
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="btn-success text-sm px-3 py-2"
          >
            <FaDownload className="inline mr-1" /> Export CSV
          </button>
          <button
            onClick={printReport}
            className="btn-primary text-sm px-3 py-2 print:hidden"
          >
            Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
        <div className="p-4 border-b print:p-2">
          <h2 className="text-xl font-bold text-center">Trial Balance</h2>
          <p className="text-center text-gray-500">
            As of {new Date(asOfDate).toLocaleDateString()}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="table-header">Account No</th>
                <th className="table-header">Account Name</th>
                <th className="table-header hidden md:table-cell">Main</th>
                <th className="table-header hidden lg:table-cell">Sub Main</th>
                <th className="table-header hidden lg:table-cell">Group</th>
                <th className="table-header hidden md:table-cell">Sub Group</th>
                <th className="table-header text-right">Debit ($)</th>
                <th className="table-header text-right">Credit ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trialBalance?.accounts?.map((account) => (
                <tr
                  key={account.AcNo}
                  className="hover:bg-gray-50 print:hover:bg-white"
                >
                  <td className="table-cell">{account.AcNo}</td>
                  <td className="table-cell font-medium">{account.AccName}</td>
                  <td className="table-cell hidden md:table-cell text-gray-500">
                    {account.MainName || "-"}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">
                    {account.SubMainName || "-"}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">
                    {account.GroupName || "-"}
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500">
                    {account.SubGroupName || "-"}
                  </td>
                  <td className="table-cell text-right text-green-600">
                    {account.TotalDebit > 0
                      ? `$${account.TotalDebit.toFixed(2)}`
                      : "$0.00"}
                  </td>
                  <td className="table-cell text-right text-red-600">
                    {account.TotalCredit > 0
                      ? `$${account.TotalCredit.toFixed(2)}`
                      : "$0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 print:bg-gray-100 font-bold">
              <tr>
                <td colSpan="6" className="table-cell text-right">
                  Totals:
                </td>
                <td className="table-cell text-right text-green-600">
                  ${trialBalance?.summary?.totalDebit?.toFixed(2) || "0.00"}
                </td>
                <td className="table-cell text-right text-red-600">
                  ${trialBalance?.summary?.totalCredit?.toFixed(2) || "0.00"}
                </td>
              </tr>
              {trialBalance?.summary?.isBalanced === false && (
                <tr>
                  <td
                    colSpan="8"
                    className="table-cell text-center text-red-600 bg-red-50"
                  >
                    ⚠️ Trial Balance is NOT balanced! Difference: $
                    {Math.abs(
                      (trialBalance?.summary?.totalDebit || 0) -
                        (trialBalance?.summary?.totalCredit || 0),
                    ).toFixed(2)}
                  </td>
                </tr>
              )}
              {trialBalance?.summary?.isBalanced === true && (
                <tr>
                  <td
                    colSpan="8"
                    className="table-cell text-center text-green-600 bg-green-50"
                  >
                    ✓ Trial Balance is balanced
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TrialBalance;
