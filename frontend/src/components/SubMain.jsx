import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const SubMain = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [mainAccounts, setMainAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ PrimID: "", SubName: "" });

  useEffect(() => {
    fetchItems();
    fetchMainAccounts();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchTerm, items]);

  const fetchItems = async () => {
    try {
      const response = await api.get("/submain");
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err) {
      toast.error("Failed to fetch sub-main accounts");
    }
  };

  const fetchMainAccounts = async () => {
    try {
      const response = await api.get("/main");
      setMainAccounts(response.data);
    } catch (err) {
      toast.error("Failed to fetch main accounts");
    }
  };

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(
        (item) =>
          item.SubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.PrimName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredItems(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        await api.put(`/submain/${editingItem.SubPrimID}`, formData);
        toast.success("Sub-main account updated successfully");
      } else {
        await api.post("/submain", formData);
        toast.success("Sub-main account created successfully");
      }
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to save sub-main account",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ PrimID: item.PrimID, SubName: item.SubName });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this sub-main account?")
    )
      re;
    turn;

    try {
      await api.delete(`/submain/${id}`);
      toast.success("Sub-main account deleted successfully");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete sub-main account");
    }
  };

  const resetForm = () => {
    setFormData({ PrimID: "", SubName: "" });
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sub Main Accounts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Sub Main Account
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search sub-main accounts..."
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
                <th className="table-header">ID</th>
                <th className="table-header">Main Account</th>
                <th className="table-header">Sub Main Name</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.SubPrimID} className="hover:bg-gray-50">
                  <td className="table-cell">{item.SubPrimID}</td>
                  <td className="table-cell">{item.PrimName}</td>
                  <td className="table-cell font-medium">{item.SubName}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(item.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.SubPrimID)}
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
              {editingItem
                ? "Edit Sub Main Account"
                : "Add New Sub Main Account"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Main Account *</label>
                  <select
                    value={formData.PrimID}
                    onChange={(e) =>
                      setFormData({ ...formData, PrimID: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Main Account</option>
                    {mainAccounts.map((main) => (
                      <option key={main.PrimID} value={main.PrimID}>
                        {main.PrimName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sub Main Name *</label>

                  <input
                    type="text"
                    value={formData.SubName}
                    onChange={(e) =>
                      setFormData({ ...formData, SubName: e.target.value })
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
                  {loading ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubMain;
