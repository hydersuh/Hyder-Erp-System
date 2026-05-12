import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    Username: "",
    Password: "",
    Email: "",
    FullName: "",
    Role: "user",
    IsActive: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.UserID}`, {
          FullName: formData.FullName,
          Email: formData.Email,
          Role: formData.Role,
          IsActive: formData.IsActive,
        });
        toast.success("User updated successfully");
      } else {
        await api.post("/users", formData);
        toast.success("User created successfully");
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      Username: user.Username,
      Password: "",
      Email: user.Email,
      FullName: user.FullName,
      Role: user.Role,
      IsActive: user.IsActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      Username: "",
      Password: "",
      Email: "",
      FullName: "",
      Role: "user",
      IsActive: 1,
    });
    setEditingUser(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Username</th>
              <th className="table-header">Full Name</th>

              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Last Login</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.UserID} className="hover:bg-gray-50">
                <td className="table-cell">{user.UserID}</td>
                <td className="table-cell font-medium">{user.Username}</td>
                <td className="table-cell">{user.FullName}</td>
                <td className="table-cell">{user.Email}</td>
                <td className="table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${user.Role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {user.Role}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${user.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {user.IsActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="table-cell text-sm text-gray-500">
                  {user.LastLogin
                    ? new Date(user.LastLogin).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="table-cell">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(user.UserID)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "Edit User" : "AddNew User"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={formData.Username}
                    onChange={(e) =>
                      setFormData({ ...formData, Username: e.target.value })
                    }
                    className="form-input"
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      value={formData.Password}
                      onChange={(e) =>
                        setFormData({ ...formData, Password: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.FullName}
                    onChange={(e) =>
                      setFormData({ ...formData, FullName: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) =>
                      setFormData({ ...formData, Email: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select
                    value={formData.Role}
                    onChange={(e) =>
                      setFormData({ ...formData, Role: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.IsActive === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        IsActive: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Active
                  </label>
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
                  {loading ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
