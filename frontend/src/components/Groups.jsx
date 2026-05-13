import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [subMainData, setSubMainData] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ SubPrimID: "", GroupName: "" });

  useEffect(() => {
    fetchGroups();
    fetchSubMain();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [searchTerm, groups]);

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups");

      setGroups(response.data);
      setFilteredGroups(response.data);
    } catch (err) {
      toast.error("Failed to fetch groups");
    }
  };

  const fetchSubMain = async () => {
    try {
      const response = await api.get("/submain");
      setSubMainData(response.data);
    } catch (err) {
      toast.error("Failed to fetch sub-main data");
    }
  };

  const filterGroups = () => {
    if (!searchTerm) {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(
        (group) =>
          group.GroupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.SubName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredGroups(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingGroup) {
        await api.put(`/groups/${editingGroup.GroupID}`, formData);
        toast.success("Group updated successfully");
      } else {
        await api.post("/groups", formData);
        toast.success("Group created successfully");
      }
      resetForm();
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save group");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      SubPrimID: group.SubPrimID,
      GroupName: group.GroupName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      await api.delete(`/groups/${id}`);
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  const resetForm = () => {
    setFormData({
      SubPrimID: "",
      GroupName: "",
    });
    setEditingGroup(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Group Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Group
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search groups..."
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
                <th className="table-header">Sub Main</th>
                <th className="table-header">Group Name</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <tr key={group.GroupID} className="hover:bg-gray-50">
                  <td className="table-cell">{group.GroupID}</td>
                  <td className="table-cell">{group.SubName}</td>
                  <td className="table-cell font-medium">{group.GroupName}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(group.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(group.GroupID)}
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
              {editingGroup ? "Edit Group" : "Add New Group"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Sub Main *</label>
                  <select
                    value={formData.SubPrimID}
                    onChange={(e) =>
                      setFormData({ ...formData, SubPrimID: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Sub Main</option>
                    {subMainData.map((sub) => (
                      <option key={sub.SubPrimID} value={sub.SubPrimID}>
                        {sub.SubName} ({sub.PrimName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Group Name *</label>
                  <input
                    type="text"
                    value={formData.GroupName}
                    onChange={(e) =>
                      setFormData({ ...formData, GroupName: e.target.value })
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
                  {loading ? "Saving..." : editingGroup ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
