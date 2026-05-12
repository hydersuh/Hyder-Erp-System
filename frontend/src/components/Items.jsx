import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const Items = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ItemCode: "",
    ItemName: "",
    Description: "",
    Category: "",
    UnitOfMeasure: "PCS",
    PurchasePrice: 0,
    SalePrice: 0,
    StockQuantity: 0,
    MinStockLevel: 0,
    IsActive: 1,
  });

  useEffect(() => {
    fetchItems();
  }, []);
  useEffect(() => {
    filterItems();
  }, [searchTerm, categoryFilter, items]);

  const fetchItems = async () => {
    try {
      const response = await api.get("/items");
      setItems(response.data);
      setFilteredItems(response.data);
      setCategories([
        ...new Set(response.data.map((i) => i.Category).filter(Boolean)),
      ]);
    } catch (err) {
      toast.error("Failed to fetch items");
    }
  };
  const filterItems = () => {
    let filtered = [...items];
    if (searchTerm)
      filtered = filtered.filter(
        (i) =>
          i.ItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.ItemCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    if (categoryFilter) fil;
    filtered = filtered.filter((i) => i.Category === categoryFilter);
    setFilteredItems(filtered);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) await api.put(`/items/${editingItem.ItemID}`, formData);
      else await api.post("/items", formData);
      toast.success(editingItem ? "Item updated" : "Item created");
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ItemCode: item.ItemCode,
      ItemName: item.ItemName,
      Description: item.Description || "",
      Category: item.Category || "",
      UnitOfMeasure: item.UnitOfMeasure || "PCS",
      PurchasePrice: item.PurchasePrice || 0,
      SalePrice: item.SalePrice || 0,
      StockQuantity: item.StockQuantity || 0,
      MinStockLevel: item.MinStockLevel || 0,
      IsActive: item.IsActive,
    });
    setIsModalOpen(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete item?")) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success("Item deleted");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };
  const resetForm = () => {
    setFormData({
      ItemCode: "",
      ItemName: "",
      Description: "",
      Category: "",
      UnitOfMeasure: "PCS",
      PurchasePrice: 0,
      SalePrice: 0,
      StockQuantity: 0,
      MinStockLevel: 0,
      IsActive: 1,
    });
    setEditingItem(null);
    setIsModalOpen(false);
  };
  const isLowStock = (stock, minStock) => stock <= minStock;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Item Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Item
        </button>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Purchase Price</th>
                <th className="table-header">Sale Price</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Min Stock</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr
                  key={item.ItemID}
                  className={`hover:bg-gray-50 ${isLowStock(item.StockQuantity, item.MinStockLevel) ? "bg-yellow-50" : ""}`}
                >
                  <td className="table-cell">{item.ItemID}</td>
                  <td className="table-cell font-medium">{item.ItemCode}</td>
                  <td className="table-cell">{item.ItemName}</td>
                  <td className="table-cell">{item.Category || "-"}</td>
                  <td className="table-cell">
                    ${item.PurchasePrice?.toFixed(2)}
                  </td>
                  <td className="table-cell">${item.SalePrice?.toFixed(2)}</td>
                  <td className="table-cell">
                    <span
                      className={
                        isLowStock(item.StockQuantity, item.MinStockLevel)
                          ? "text-red-600 font-bold"
                          : ""
                      }
                    >
                      {item.StockQuantity}
                    </span>
                  </td>
                  <td className="table-cell">{item.MinStockLevel}</td>
                  <td className="table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${item.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {item.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.ItemID)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Item Code *</label>
                  <input
                    type="text"
                    value={formData.ItemCode}
                    onChange={(e) =>
                      setFormData({ ...formData, ItemCode: e.target.value })
                    }
                    className="form-input"
                    required
                    disabled={!!editingItem}
                  />
                </div>
                <div>
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    value={formData.ItemName}
                    onChange={(e) =>
                      setFormData({ ...formData, ItemName: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    value={formData.Category}
                    onChange={(e) =>
                      setFormData({ ...formData, Category: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Unit of Measure</label>
                  <select
                    value={formData.UnitOfMeasure}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        UnitOfMeasure: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="M">Meters (M)</option>
                    <option value="L">Liters (L)</option>
                    <option value="BOX">Box (BOX)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.PurchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PurchasePrice: parseFloat(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.SalePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        SalePrice: parseFloat(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.StockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        StockQuantity: parseFloat(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Minimum Stock Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.MinStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        MinStockLevel: parseFloat(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.Description}
                    onChange={(e) =>
                      setFormData({ ...formData, Description: e.target.value })
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
                  onClic
                  k={resetForm}
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

export default Items;
