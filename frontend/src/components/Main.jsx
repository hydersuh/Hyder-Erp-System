import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Main = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ PrimName: "" });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchTerm, items]);

  const fetchItems = async () => {
    try {
      const response = await api.get("/main");
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err) {
      toast.error("Failed to fetch main accounts");
    }
  };

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
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
        await api.put(`/main/${editingItem.PrimID}`, formData);
        toast.success("Main account updated successfully");
      } else {
        await api.post("/main", formData);
        toast.success("Main account created successfully");
      }
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save main account");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    setFormData({ PrimName: item.PrimName });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this main account?"))
      return;

    try {
      await api.delete(`/main/${id}`);
      toast.success("Main account deleted successfully");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete main account");
    }
  };

  const resetForm = () => {
    setFormData({ PrimName: "" });
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Main Accounts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Main Account
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search main accounts..."
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
                <th className="table-header">Main Account Name</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.PrimID} className="hover:bg-gray-50">
                  <td className="table-cell">{item.PrimID}</td>
                  <td className="table-cell font-medium">{item.PrimName}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(item.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 
hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.PrimID)}
                      className="text 
-red-600 hover:text-red-800"
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justif 
y-center z-50"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Main Account" : "Add New Main Account"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Main Account Name *</label>
                  <input
                    type="text"
                    value={formData.PrimName}
                    onChange={(e) =>
                      setFormData({ ...formData, PrimName: e.target.value })
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

export default Main;
