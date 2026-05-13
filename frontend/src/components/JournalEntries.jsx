import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEye,
  FaTrashAlt,
} from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [viewingDetails, setViewingDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    EntryDate: new Date().toISOString().split("T")[0],
    Narration: "",
    TotDr: 0,
    TotCr: 0,
    details: [],
  });

  useEffect(() => {
    fetchEntries();

    fetchLedgers();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, entries]);

  const fetchEntries = async () => {
    try {
      const response = await api.get("/journalentries");
      setEntries(response.data);
      setFilteredEntries(response.data);
    } catch (err) {
      toast.error("Failed to fetch journal entries");
    }
  };

  const fetchLedgers = async () => {
    try {
      const response = await api.get("/ledgers");
      setLedgers(response.data);
    } catch (err) {
      toast.error("Failed to fetch ledgers");
    }
  };

  const filterEntries = () => {
    if (!searchTerm) {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(
        (entry) =>
          entry.Narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.EntryID?.toString().includes(searchTerm),
      );
      setFilteredEntries(filtered);
    }
  };

  const addDetailRow = () => {
    setFormData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        { AcNo: "", Debit: 0, Credit: 0, CurrC: "USD", CRate: 1 },
      ],
    }));
  };

  const updateDetail = (index, field, value) => {
    setFormData((prev) => {
      const newDetails = [...prev.details];
      newDetails[index] = { ...newDetails[index], [field]: value };

      // Recalculate totals
      let totDr = 0;
      let totCr = 0;
      newDetails.forEach((detail) => {
        totDr += parseFloat(detail.Debit) || 0;
        totCr += parseFloat(detail.Credit) || 0;
      });

      return {
        ...prev,
        details: newDetails,
        TotDr: totDr,
        TotCr: totCr,
      };
    });
  };

  const removeDetail = (index) => {
    setFormData((prev) => {
      const newDetails = prev.details.filter((_, i) => i !== index);

      let totDr = 0;
      let totCr = 0;
      newDetails.forEach((detail) => {
        totDr += parseFloat(detail.Debit) || 0;
        totCr += parseFloat(detail.Credit) || 0;
      });

      return {
        ...prev,
        details: newDetails,
        TotDr: totDr,
        TotCr: totCr,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.details.length === 0) {
      toast.error("Please add at least one journal entry line");
      return;
    }

    if (formData.TotDr !== formData.TotCr) {
      toast.error("Debit and Credit totals must be equal");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        EntryDate: formData.EntryDate,
        Narration: formData.Narration,
        TotDr: formData.TotDr,
        TotCr: formData.TotCr,
        details: formData.details.map((d) => ({
          AcNo: d.AcNo,
          Debit: d.Debit || 0,
          Credit: d.Credit || 0,
          CurrC: d.CurrC || "USD",
          CRate: d.CRate || 1,
        })),
      };

      if (editingEntry) {
        await api.put(`/journalentries/${editingEntry.EntryID}`, payload);
        toast.success("Journal entry updated successfully");
      } else {
        await api.post("/journalentries", payload);
        toast.success("Journal entry created successfully");
      }
      resetForm();
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (entry) => {
    try {
      const response = await api.get(`/journalentries/${entry.EntryID}`);
      setViewingEntry(response.data.entry);
      setViewingDetails(response.data.details || []);
      setIsViewModalOpen(true);
    } catch (err) {
      toast.error("Failed to load journal entry details");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?"))
      return;

    try {
      await api.delete(`/journalentries/${id}`);
      toast.success("Journal entry deleted successfully");
      fetchEntries();
    } catch (err) {
      toast.error("Failed to delete journal entry");
    }
  };

  const resetForm = () => {
    setFormData({
      EntryDate: new Date().toISOString().split("T")[0],
      Narration: "",
      TotDr: 0,
      TotCr: 0,
      details: [],
    });
    setEditingEntry(null);
    setIsModalOpen(false);
  };

  const getLedgerName = (acNo) => {
    const ledger = ledgers.find((l) => l.AcNo == acNo);
    return ledger ? `${ledger.AccName} (${ledger.AcNo})` : `Account ${acNo}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Journal Entries</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          New Journal Entry
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by entry ID or narration..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Entry ID</th>
                <th className="table-header">Date</th>
                <th className="table-header">Narration</th>
                <th className="table-header">Total Debit</th>
                <th className="table-header">Total Credit</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.EntryID} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{entry.EntryID}</td>
                  <td className="table-cell">
                    {new Date(entry.EntryDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell max-w-md truncate">
                    {entry.Narration}
                  </td>
                  <td className="table-cell text-green-600">
                    ${parseFloat(entry.TotDr).toFixed(2)}
                  </td>
                  <td className="table-cell text-red-600">
                    ${parseFloat(entry.TotCr).toFixed(2)}
                  </td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(entry.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleView(entry)}
                      className="text-green-600 hover:text-green-800 mr-2"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.EntryID)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No journal entries found
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Journal Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Entry Date *</label>
                  <input
                    type="date"
                    value={formData.EntryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, EntryDate: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Narration *</label>
                <textarea
                  value={formData.Narration}
                  onChange={(e) =>
                    setFormData({ ...formData, Narration: e.target.value })
                  }
                  className="form-input"
                  rows="2"
                  required
                  placeholder="Describe the journal entry..."
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label font-semibold">
                    Journal Entry Lines
                  </label>
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="btn-success text-sm px-3 py-1"
                  >
                    <FaPlus className="inline mr-1" size={12} /> Add Line
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left text-sm">Account</th>
                        <th className="p-2 text-right text-sm w-32">Debit</th>
                        <th className="p-2 text-right text-sm w-32">Credit</th>
                        <th className="p-2 text-left text-sm w-24">Currency</th>
                        <th className="p-2 text-right text-sm w-24">Rate</th>
                        <th className="p-2 text-center text-sm w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.details.map((detail, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-2">
                            <select
                              value={detail.AcNo}
                              onChange={(e) =>
                                updateDetail(index, "AcNo", e.target.value)
                              }
                              className="form-input text-sm"
                              required
                            >
                              <option value="">Select Account</option>
                              {ledgers.map((ledger) => (
                                <option key={ledger.AcNo} value={ledger.AcNo}>
                                  {ledger.AccName} ({ledger.AcNo})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={detail.Debit}
                              onChange={(e) => {
                                updateDetail(
                                  index,
                                  "Debit",
                                  parseFloat(e.target.value) || 0,
                                );
                                updateDetail(index, "Credit", 0);
                              }}
                              className="form-input text-sm text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={detail.Credit}
                              onChange={(e) => {
                                updateDetail(
                                  index,
                                  "Credit",
                                  parseFloat(e.target.value) || 0,
                                );
                                updateDetail(index, "Debit", 0);
                              }}
                              className="form-input text-sm text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={detail.CurrC}
                              onChange={(e) =>
                                updateDetail(index, "CurrC", e.target.value)
                              }
                              className="form-input text-sm"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="JPY">JPY</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={detail.CRate}
                              onChange={(e) =>
                                updateDetail(
                                  index,
                                  "CRate",
                                  parseFloat(e.target.value) || 1,
                                )
                              }
                              className="form-input text-sm text-right"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeDetail(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium">
                      <tr>
                        <td className="p-2 text-right">Totals:</td>
                        <td className="p-2 text-right text-green-600">
                          ${formData.TotDr.toFixed(2)}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          ${formData.TotCr.toFixed(2)}
                        </td>
                        <td colSpan="3"></td>
                      </tr>
                      {formData.TotDr !== formData.TotCr &&
                        formData.details.length > 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              className="p-2 text-center text-red-600 text-sm"
                            >
                              ⚠️ Debit and Credit totals must be equal!
                              Difference: $
                              {Math.abs(
                                formData.TotDr - formData.TotCr,
                              ).toFixed(2)}
                            </td>
                          </tr>
                        )}
                    </tfoot>
                  </table>
                </div>

                {formData.details.length === 0 && (
                  <div className="text-center py-4 text-gray-500 border rounded mt-2">
                    No lines added. Click "Add Line" to add journal entry lines.
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    formData.TotDr !== formData.TotCr ||
                    formData.details.length === 0
                  }
                  className="btn-primary"
                >
                  {loading ? "Saving..." : editingEntry ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Journal Entry Modal */}
      {isViewModalOpen && viewingEntry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justif 
y-center z-50 overflow-y-auto"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 my-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Journal Entry Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-
500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="border-b pb-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Entry ID</p>
                  <p className="font-medium">{viewingEntry.EntryID}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entry Date</p>
                  <p>{new Date(viewingEntry.EntryDate).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Narration</p>
                  <p className="italic">{viewingEntry.Narration}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Journal Lines</h3>
              <table className="w-full border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left text-sm">Account</th>
                    <th className="p-2 text-right text-sm w-32">Debit</th>
                    <th className="p-2 text-right text-sm w-32">Credit</th>
                    <th className="p-2 text-center text-sm w-24">Currency</th>
                    <th className="p-2 text-right text-sm w-24">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingDetails.map((detail, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{getLedgerName(detail.AcNo)}</td>
                      <td className="p-2 text-right text-green-600">
                        {detail.Debit > 0
                          ? `$${parseFloat(detail.Debit).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {detail.Credit > 0
                          ? `$${parseFloat(detail.Credit).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="p-2 text-center">{detail.CurrC}</td>
                      <td className="p-2 text-right">{detail.CRate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="p-2 text-right">Totals:</td>
                    <td className="p-2 text-right text-green-600">
                      ${parseFloat(viewingEntry.TotDr).toFixed(2)}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      ${parseFloat(viewingEntry.TotCr).toFixed(2)}
                    </td>

                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-xs text-gray-400 mt-4">
              Created: {new Date(viewingEntry.CreatedAt).toLocaleString()}
              <br />
              Last Updated: {new Date(viewingEntry.LastUpdate).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
