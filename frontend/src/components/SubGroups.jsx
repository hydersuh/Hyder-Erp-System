import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const SubGroups = () => {
  const [subGroups, setSubGroups] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [filteredSubGroups, setFilteredSubGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubGroup, setEditingSubGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    GroupID: "",
    SubName: "",
  });

  useEffect(() => {
    fetchSubGroups();
    fetchGroups();
  }, []);

  useEffect(() => {
    filterSubGroups();
  }, [searchTerm, subGroups]);

  const fetchSubGroups = async () => {
    try {
      const response = await api.get("/subgroups");
      setSubGroups(response.data);
      setFilteredSubGroups(response.data);
    } catch (err) {
      toast.error("Failed to fetch sub-groups");
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups");
      setGroupsData(response.data);
    } catch (err) {
      toast.error("Failed to fetch groups");
    }
  };

  const filterSubGroups = () => {
    if (!searchTerm) {
      setFilteredSubGroups(subGroups);
    } else {
      const filtered = subGroups.filter(
        (subGroup) =>
          subGroup.SubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subGroup.GroupName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredSubGroups(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSubGroup) {
        await api.put(`/subgroups/${editingSubGroup.SubGroupID}`, formData);
        toast.success("Sub-group updated successfully");
      } else {
        await api.post("/subgroups", formData);
        toast.success("Sub-group created successfully");
      }
      resetForm();
      fetchSubGroups();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save sub-group");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subGroup) => {
    setEditingSubGroup(subGroup);
    setFormData({
      GroupID: subGroup.GroupID,
      SubName: subGroup.SubName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-group?"))
      return;

    try {
      await api.delete(`/subgroups/${id}`);
      toast.success("Sub-group deleted successfully");
      fetchSubGroups();
    } catch (err) {
      toast.error("Failed to delete sub-group");
    }
  };

  const resetForm = () => {
    setFormData({
      GroupID: "",
      SubName: "",
    });
    setEditingSubGroup(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Sub-Group Management
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Sub-Group
        </button>
      </div>

      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search sub-groups..."
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
                <th className="table-header">Group</th>
                <th className="table-header">Sub-Group Name</th>
                <th className="table-header">Last Update</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubGroups.map((subGroup) => (
                <tr key={subGroup.SubGroupID} className="hover:bg-gray-50">
                  <td className="table-cell">{subGroup.SubGroupID}</td>
                  <td className="table-cell">{subGroup.GroupName}</td>
                  <td className="table-cell font-medium">{subGroup.SubName}</td>
                  <td className="table-cell text-sm text-gray-500">
                    {new Date(subGroup.LastUpdate).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(subGroup)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(subGroup.SubGroupID)}
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
              {editingSubGroup ? "Edit Sub-Group" : "Add New Sub-Group"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Group *</label>
                  <select
                    value={formData.GroupID}
                    onChange={(e) =>
                      setFormData({ ...formData, GroupID: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Group</option>
                    {groupsData.map((group) => (
                      <option key={group.GroupID} value={group.GroupID}>
                        {group.GroupName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sub-Group Name *</label>
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
                  {loading
                    ? "Saving..."
                    : editingSubGroup
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubGroups;
