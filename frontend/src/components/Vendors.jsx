import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    VendorCode: "",
    CompanyName: "",
    ContactName: "",
    Email: "",
    Phone: "",
    Address: "",
    City: "",
    Country: "",
    PaymentTerms: "NET 30",
    IsActive: 1,
  });

  useEffect(() => {
    fetchVendors();
  }, []);
  useEffect(() => {
    filterVendors();
  }, [searchTerm, vendors]);

  const fetchVendors = async () => {
    try {
      const response = await api.get("/vendors");
      setVendors(response.data);
      setFilteredVendors(response.data);
    } catch (err) {
      toast.error("Failed to fetch vendors");
    }
  };
  const filterVendors = () => {
    if (!searchTerm) setFilteredVendors(vendors);
    else se;
    setFilteredVendors(
      vendors.filter(
        (v) =>
          v.CompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.VendorCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVendor)
        await api.put(`/vendors/${editingVendor.VendorID}`, formData);
      else await api.post("/vendors", formData);
      toast.success(editingVendor ? "Vendor updated" : "Vendor created");
      resetForm();
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      VendorCode: vendor.VendorCode,
      CompanyName: vendor.CompanyName,
      ContactName: vendor.ContactName || "",
      Email: vendor.Email || "",
      Phone: vendor.Phone || "",
      Address: vendor.Address || "",
      City: vendor.City || "",
      Country: vendor.Country || "",
      PaymentTerms: vendor.PaymentTerms || "NET 30",
      IsActive: vendor.IsActive,
    });
    setIsModalOpen(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete vendor?")) return;
    try {
      await api.delete(`/vendors/${id}`);
      toast.success("Vendor deleted");
      fetchVendors();
    } catch (err) {
      toast.error("Failed to delete vendor");
    }
  };
  const resetForm = () => {
    setFormData({
      VendorCode: "",
      CompanyName: "",
      ContactName: "",
      Email: "",
      Phone: "",
      Address: "",
      City: "",
      Country: "",
      PaymentTerms: "NET 30",
      IsActive: 1,
    });
    setEditingVendor(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Vendor
        </button>
      </div>
      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
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
                <th className="table-header">Code</th>
                <th className="table-header">Company Name</th>
                <th className="table-header">Contact</th>
                <th className="ta ble-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-heasder">Payment Terms</th>
                <th className="table-header">Status</th>
                <th className="table-h eader">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.VendorID} className="hover:bg-gray-50">
                  <td className="table-cell">{vendor.VendorID}</td>
                  <td className="table-cell font-medium">
                    {vendor.VendorCode}
                  </td>
                  <td className="table-cell">{vendor.CompanyName}</td>
                  <td className="table-cell">{vendor.ContactName || "-"}</td>
                  <td className="table-cell">{vendor.Email || "-"}</td>
                  <td className="table-cell">{vendor.Phone || "-"}</td>
                  <td className="table-cell">
                    {vendor.PaymentTerms || "NET 30"}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${vendor.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {vendor.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.VendorID)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex item-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Vendor Code *</label>
                  <input
                    type="text"
                    value={formData.VendorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorCode: e.target.value })
                    }
                    className="form-input"
                    required
                    disabled={!!editingVendor}
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
                  <label className="form-label">Payment Terms</label>
                  <select
                    value={formData.PaymentTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, PaymentTerms: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="NET 15">NET 15</option>
                    <option value="NET 30">NET 30</option>
                    <option value="NET 60">NET 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
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
                    <span
                      className="ml-
2 text-sm text-gray-700"
                    >
                      Active
                    </span>
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
                  {loading ? "Saving..." : editingVendor ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
