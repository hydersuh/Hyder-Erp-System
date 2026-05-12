import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CustomerCode: "",
    CompanyName: "",
    ContactName: "",
    Email: "",
    Phone: "",
    Address: "",
    City: "",
    Country: "",
    CreditLimit: 0,
    IsActive: 1,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");

      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (err) {
      toast.error("Failed to fetch customers");
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.CompanyName?.toLowerCase().includes(
            searchTerm.toLowerCase(),
          ) ||
          customer.CustomerCode?.toLowerCase().includes(
            searchTerm.toLowerCase(),
          ) ||
          customer.ContactName?.toLowerCase().includes(
            searchTerm.toLowerCase(),
          ),
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.CustomerID}`, formData);
        toast.success("Customer updated successfully");
      } else {
        await api.post("/customers", formData);
        toast.success("Customer created successfully");
      }
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      CustomerCode: customer.CustomerCode,
      CompanyName: customer.CompanyName,
      ContactName: customer.ContactName || "",
      Email: customer.Email || "",
      Phone: customer.Phone || "",
      Address: customer.Address || "",
      City: customer.City || "",
      Country: customer.Country || "",
      CreditLimit: customer.CreditLimit || 0,
      IsActive: customer.IsActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      await api.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const resetForm = () => {
    setFormData({
      CustomerCode: "",
      CompanyName: "",
      ContactName: "",
      Email: "",
      Phone: "",
      Address: "",

      City: "",
      Country: "",
      CreditLimit: 0,
      IsActive: 1,
    });
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Customer Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex item 
s-center"
        >
          <FaPlus className="mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 tex
t-gray-400"
          />
          <input
            type="text"
            placeholder="Search customers by name, code or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Code</th>
                <th className="table-header">Company Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Credit Limit</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.CustomerID} className="hover:bg-gray-50">
                  <td className="table-cell">{customer.CustomerID}</td>
                  <td className="table-cell font-medium">
                    {customer.CustomerCode}
                  </td>
                  <td className="table-cell">{customer.CompanyName}</td>
                  <td className="table-cell">{customer.ContactName || "-"}</td>
                  <td className="table-cell">{customer.Email || "-"}</td>
                  <td className="table-cell">{customer.Phone || "-"}</td>
                  <td className="table-cell">
                    ${customer.CreditLimit?.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${customer.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {customer.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.CustomerID)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Customer Code *</label>
                  <input
                    type="text"
                    value={formData.CustomerCode}
                    onChange={(e) =>
                      setFormData({ ...formData, CustomerCode: e.target.value })
                    }
                    className="form-input"
                    required
                    disabled={!!editingCustomer}
                  />
                </div>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    value={formData.CompanyName}
                    onChange={(e) =>
                      setFormData({ ...formData, CompanyName: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    value={formData.ContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, ContactName: e.target.value })
                    }
                    className="form-input"
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
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    value={formData.Phone}
                    onChange={(e) =>
                      setFormData({ ...formData, Phone: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Credit Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.CreditLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        CreditLimit: parseFloat(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={formData.City}
                    onChange={(e) =>
                      setFormData({ ...formData, City: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    value={formData.Country}
                    onChange={(e) =>
                      setFormData({ ...formData, Country: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Address</label>
                  <textarea
                    value={formData.Address}
                    onChange={(e) =>
                      setFormData({ ...formData, Address: e.target.value })
                    }
                    className="form-input"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.IsActive === 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          IsActive: e.target.checked ? 1 : 0,
                        })
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
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
                  {loading
                    ? "Saving..."
                    : editingCustomer
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

export default Customers;
