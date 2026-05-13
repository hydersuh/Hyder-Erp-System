import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaPrint,
  FaSearch,
  FaDownload,
} from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CustomerID: "",
    InvoiceDate: new Date().toISOString().split("T")[0],
    DueDate: "",
    Notes: "",
    Status: "Draft",
    items: [],
  });
  const [currentItem, setCurrentItem] = useState({
    ItemID: "",
    ItemName: "",
    Quantity: 1,
    UnitPrice: 0,
    Discount: 0,
    TaxRate: 0,
    LineTotal: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchItems();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, statusFilter, invoices]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get("/invoices");
      setInvoices(response.data);
      setFilteredInvoices(response.data);
    } catch (err) {
      toast.error("Failed to fetch invoices");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data);
    } catch (err) {
      toast.error("Failed to fetch customers");
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get("/items");
      setItems(response.data.filter((i) => i.IsActive === 1));
    } catch (err) {
      toast.error("Failed to fetch items");
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.InvoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((i) => i.Status === statusFilter);
    }
    setFilteredInvoices(filtered);
  };

  const calculateLineTotal = (quantity, price, discount, taxRate) => {
    const subtotal = quantity * price;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    return afterDiscount + taxAmount;
  };

  const handleAddItem = () => {
    if (!currentItem.ItemID || currentItem.Quantity <= 0) {
      toast.error("Please select an item and enter valid quantity");
      return;
    }
    const selectedItem = items.find(
      (i) => i.ItemID === parseInt(currentItem.ItemID),
    );
    const lineTotal = calculateLineTotal(
      currentItem.Quantity,
      currentItem.UnitPrice,
      currentItem.Discount,
      currentItem.TaxRate,
    );
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ItemID: currentItem.ItemID,
          ItemName: selectedItem?.ItemName,
          ItemCode: selectedItem?.ItemCode,

          Quantity: currentItem.Quantity,
          UnitPrice: currentItem.UnitPrice,
          Discount: currentItem.Discount,
          TaxRate: currentItem.TaxRate,
          LineTotal: lineTotal,
        },
      ],
    });
    setCurrentItem({
      ItemID: "",
      ItemName: "",
      Quantity: 1,
      UnitPrice: 0,
      Discount: 0,
      TaxRate: 0,
      LineTotal: 0,
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce(
      (sum, item) => sum + item.Quantity * item.UnitPrice,
      0,
    );
    const discountAmount = formData.items.reduce(
      (sum, item) =>
        sum + item.Quantity * item.UnitPrice * (item.Discount / 100),
      0,
    );
    const taxAmount = formData.items.reduce((sum, item) => {
      const afterDiscount =
        item.Quantity * item.UnitPrice -
        item.Quantity * item.UnitPrice * (item.Discount / 100);
      return sum + afterDiscount * (item.TaxRate / 100);
    }, 0);
    const totalAmount = subTotal - discountAmount + taxAmount;
    return { subTotal, discountAmount, taxAmount, totalAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.CustomerID || formData.items.length === 0) {
      toast.error("Please select a customer and add at least one item");
      return;
    }
    setLoading(true);
    try {
      const totals = calculateTotals();
      const payload = {
        ...formData,
        SubTotal: totals.subTotal,
        DiscountAmount: totals.discountAmount,
        TaxAmount: totals.taxAmount,
        TotalAmount: totals.totalAmount,
        items: formData.items.map((item) => ({
          ItemID: item.ItemID,
          Quantity: item.Quantity,
          UnitPrice: item.UnitPrice,
          Discount: item.Discount,
          TaxRate: item.TaxRate,
          LineTotal: item.LineTotal,
        })),
      };
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.InvoiceID}`, {
          Status: formData.Status,
          Notes: formData.Notes,
        });
        toast.success("Invoice updated");
      } else {
        await api.post("/invoices", payload);
        toast.success("Invoice created");
      }
      resetForm();
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.InvoiceID}`);
      setSelectedInvoice(response.data);
      setIsViewModalOpen(true);
    } catch (err) {
      toast.error("Failed to load invoice details");
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      CustomerID: invoice.CustomerID,
      InvoiceDate: invoice.InvoiceDate,
      DueDate: invoice.DueDate,
      Notes: invoice.Notes || "",
      Status: invoice.Status,
      items: invoice.items || [],
    });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/invoices/${id}`, { Status: status });
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const resetForm = () => {
    setFormData({
      CustomerID: "",
      InvoiceDate: new Date().toISOString().split("T")[0],
      DueDate: "",
      Notes: "",
      Status: "Draft",
      items: [],
    });
    setEditingInvoice(null);
    setIsModalOpen(false);
    setCurrentItem({
      ItemID: "",
      ItemName: "",
      Quantity: 1,
      UnitPrice: 0,
      Discount: 0,
      TaxRate: 0,
      LineTotal: 0,
    });
  };

  const handleItemSelect = (itemId) => {
    const item = items.find((i) => i.ItemID === parseInt(itemId));
    if (item) {
      setCurrentItem({
        ...currentItem,
        ItemID: item.ItemID,
        ItemName: item.ItemName,
        UnitPrice: item.SalePrice || 0,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totals = calculateTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Invoices</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Invoice #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Due Date</th>

                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.InvoiceID} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">
                    {invoice.InvoiceNumber}
                  </td>
                  <td className="table-cell">{invoice.CustomerName}</td>
                  <td className="table-cell">
                    {new Date(invoice.InvoiceDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    {new Date(invoice.DueDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    ${invoice.TotalAmount?.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.Status)}`}
                    >
                      {invoice.Status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleView(invoice)}
                      className="text-gray-600 hover:text-gray-800 mr-2"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <select
                      onChange={(e) =>
                        handleUpdateStatus(invoice.InvoiceID, e.target.value)
                      }
                      value={invoice.Status}
                      className="text-xs border rounded px-1 py-0.5 mr-2"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>

                    <button
                      onClick={() => handleDelete(invoice.InvoiceID)}
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
        </div>
      </div>

      {/* Create/Edit Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="form-label">Customer *</label>
                  <select
                    value={formData.CustomerID}
                    onChange={(e) =>
                      setFormData({ ...formData, CustomerID: e.target.value })
                    }
                    className="form-input"
                    required
                    disabled={!!editingInvoice}
                  >
                    <option value="">Select Customer</option>
                    {customers
                      .filter((c) => c.IsActive === 1)
                      .map((customer) => (
                        <option
                          key={customer.CustomerID}
                          value={customer.CustomerID}
                        >
                          {customer.CompanyName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Invoice Date *</label>
                  <input
                    type="date"
                    value={formData.InvoiceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, InvoiceDate: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    value={formData.DueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, DueDate: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Invoice Items Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Invoice Items</h3>
                <div className="grid grid-cols-12 gap-2 mb-3">
                  <div className="col-span-4">
                    <select
                      value={currentItem.ItemID}
                      onChange={(e) => handleItemSelect(e.target.value)}
                      className="form-input text-sm"
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.ItemID} value={item.ItemID}>
                          {item.ItemCode} - {item.ItemName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={currentItem.Quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          Quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={currentItem.UnitPrice}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          UnitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Disc %"
                      value={currentItem.Discount}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          Discount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Tax %"
                      value={currentItem.TaxRate}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          TaxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn-primary w-full py-2 text-sm"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Disc%</th>
                        <th className="px-3 py-2 text-right">Tax%</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.ItemName}</td>
                          <td className="px-3 py-2 text-right">
                            {item.Quantity}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${item.UnitPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.Discount}%
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.TaxRate}%
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${item.LineTotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600"
                            >
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 text-right">
                  <div className="inline-block text-right">
                    <p>Subtotal: ${totals.subTotal.toFixed(2)}</p>
                    <p>Discount: -${totals.discountAmount.toFixed(2)}</p>
                    <p>Tax: ${totals.taxAmount.toFixed(2)}</p>
                    <p className="text-lg font-bold">
                      Total: ${totals.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Notes</label>
                <textarea
                  value={formData.Notes}
                  onChange={(e) =>
                    setFormData({ ...formData, Notes: e.target.value })
                  }
                  className="form-input"
                  rows="2"
                />
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
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading
                    ? "Saving..."
                    : editingInvoice
                      ? "Update"
                      : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 my-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">
                Invoice #{selectedInvoice.InvoiceNumber}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Customer:</p>
                  <p className="font-medium">{selectedInvoice.CustomerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status:</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.Status)}`}
                  >
                    {selectedInvoice.Status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoice Date:</p>
                  <p>
                    {new Date(selectedInvoice.InvoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date:</p>
                  <p>
                    {new Date(selectedInvoice.DueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <table className="w-full text-sm mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{item.ItemName}</td>
                      <td className="px-3 py-2 text-right">{item.Quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ${item.UnitPrice.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${item.LineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right">
                <p>
                  Total:{" "}
                  <span className="text-xl font-bold">
                    ${selectedInvoice.TotalAmount?.toFixed(2)}
                  </span>
                </p>
              </div>
              {selectedInvoice.Notes && (
                <p className="mt-4 text-sm text-gray-600">
                  Notes: {selectedInvoice.Notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
