import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Ledgers = () => {
  const [ledgers, setLedgers] = useState([]);
  const [subGroupsData, setSubGroupsData] = useState([]);
  const [filteredLedgers, setFilteredLedgers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    SubGroupID: "",
    AccName: "",
  });

  useEffect(() => {
    fetchLedgers();
    fetchSubGroups();
  }, []);

  useEffect(() => {
    filterLedgers();
  }, [searchTerm, ledgers]);

  const fetchLedgers = async () => {
    try {
      const response = await api.get("/ledgers");
      setLedgers(response.data);
      setFilteredLedgers(response.data);
    } catch (err) {
      toast.error("Failed to fetch ledgers");
    }
  };

  const fetchSubGroups = async () => {
    try {
      const response = await api.get("/subgroups");
      setSubGroupsData(response.data);
    } catch (err) {
      toast.error("Failed to fetch sub-groups");
    }
  };

  const filterLedgers = () => {
    if (!searchTerm) {
      setFilteredLedgers(ledgers);
    } else {
      const filtered = ledgers.filter(
        (ledger) =>
          ledger.AccName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ledger.SubGroupName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredLedgers(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLedger) {
        await api.put(`/ledgers/${editingLedger.AcNo}`, formData);
        toast.success("Ledger updated successfully");
      } else {
        await api.post("/ledgers", formData);
        toast.success("Ledger created successfully");
      }
      resetForm();
      fetchLedgers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ledger) => {
    setEditingLedger(ledger);
    setFormData({
      SubGroupID: ledger.SubGroupID,
      AccName: ledger.AccName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ledger?")) return;

    try {
      await api.delete(`/ledgers/${id}`);
      toast.success("Ledger deleted successfully");
      fetchLedgers();
    } catch (err) {
      toast.error("Failed to delete ledger");
    }
  };

  const resetForm = () => {
    setFormData({
      SubGroupID: "",
      AccName: "",
    });
    setEditingLedger(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ledger Management</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Ledger
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search ledgers..."
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
                <th className="table-header">Account No</th>
                <th className="table-header">Sub-Group</th>
                <th className="table-header">Account Name</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLedgers.map((ledger) => (
                <tr key={ledger.AcNo} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{ledger.AcNo}</td>
                  <td className="table-cell">{ledger.SubGroupName}</td>
                  <td className="table-cell">{ledger.AccName}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(ledger.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(ledger)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(ledger.AcNo)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingLedger ? "Edit Ledger" : "Add New Ledger"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Sub-Group *</label>
                  <select
                    value={formData.SubGroupID}
                    onChange={(e) =>
                      setFormData({ ...formData, SubGroupID: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Sub-Group</option>
                    {subGroupsData.map((subGroup) => (
                      <option
                        key={subGroup.SubGroupID}
                        value={subGroup.SubGroupID}
                      >
                        {subGroup.SubName} ({subGroup.GroupName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Account Name *</label>
                  <input
                    type="text"
                    value={formData.AccName}
                    onChange={(e) =>
                      setFormData({ ...formData, AccName: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Saving..." : editingLedger ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledgers;
