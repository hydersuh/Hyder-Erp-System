import React, { useState, useEffect } from "react";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaTree,
} from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

const ChartOfAccounts = () => {
  const [accountHierarchy, setAccountHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLevel, setModalLevel] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [parents, setParents] = useState([]);

  // Fetch complete accounting hierarchy
  const fetchHierarchy = async () => {
    try {
      const [mainRes, subMainRes, groupsRes, subGroupsRes, ledgersRes] =
        await Promise.all([
          api.get("/main"),
          api.get("/submain"),
          api.get("/groups"),
          api.get("/subgroups"),
          api.get("/ledgers"),
        ]);

      // Build nested structure
      const mainAccounts = mainRes.data.map((main) => ({
        ...main,
        type: "main",
        level: 1,
        children: subMainRes.data
          .filter((sub) => sub.PrimID === main.PrimID)
          .map((sub) => ({
            ...sub,
            type: "submain",
            level: 2,
            children: groupsRes.data
              .filter((group) => group.SubPrimID === sub.SubPrimID)
              .map((group) => ({
                ...group,
                type: "group",
                level: 3,
                children: subGroupsRes.data
                  .filter((subGroup) => subGroup.GroupID === group.GroupID)
                  .map((subGroup) => ({
                    ...subGroup,
                    type: "subgroup",
                    level: 4,
                    children: ledgersRes.data
                      .filter(
                        (ledger) => ledger.SubGroupID === subGroup.SubGroupID,
                      )
                      .map((ledger) => ({
                        ...ledger,
                        type: "ledger",
                        level: 5,
                      })),
                  })),
              })),
          })),
      }));

      setAccountHierarchy(mainAccounts);
    } catch (err) {
      toast.error("Failed to fetch chart of accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const toggleExpand = (id, type) => {
    const key = `${type}_${id}`;
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openAddModal = async (level, parentId = null) => {
    setModalLevel(level);
    setEditingItem(null);

    // Fetch parent options based on level
    if (level === "submain") {
      const res = await api.get("/main");
      setParents(res.data.map((m) => ({ id: m.PrimID, name: m.PrimName })));
    } else if (level === "group") {
      const res = await api.get("/submain");
      setParents(res.data.map((s) => ({ id: s.SubPrimID, name: s.SubName })));
    } else if (level === "subgroup") {
      const res = await api.get("/groups");
      setParents(res.data.map((g) => ({ id: g.GroupID, name: g.GroupName })));
    } else if (level === "ledger") {
      const res = await api.get("/subgroups");
      setParents(
        res.data.map((sg) => ({ id: sg.SubGroupID, name: sg.SubName })),
      );
    }

    setFormData({ parentId: parentId || "", name: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item, level) => {
    setModalLevel(level);
    setEditingItem(item);
    setFormData({
      name:
        item.PrimName ||
        item.SubName ||
        item.GroupName ||
        item.SubName ||
        item.AccName,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoints = {
        main: {
          create: "/main",
          update: (id) => `/main/${id}`,
          param: "PrimName",
        },
        submain: {
          create: "/submain",
          update: (id) => `/submain/${id}`,
          param: "SubName",
          parentKey: "PrimID",
        },
        group: {
          create: "/groups",
          update: (id) => `/groups/${id}`,
          param: "GroupName",
          parentKey: "SubPrimID",
        },
        subgroup: {
          create: "/subgroups",
          update: (id) => `/subgroups/${id}`,
          param: "SubName",
          parentKey: "GroupID",
        },

        ledger: {
          create: "/ledgers",
          update: (id) => `/ledgers/${id}`,
          param: "AccName",
          parentKey: "SubGroupID",
        },
      };

      const config = endpoints[modalLevel];

      if (editingItem) {
        await api.put(
          config.update(
            editingItem.PrimID ||
              editingItem.SubPrimID ||
              editingItem.GroupID ||
              editingItem.SubGroupID ||
              editingItem.AcNo,
          ),
          { [config.param]: formData.name },
        );
        toast.success(`${modalLevel.toUpperCase()} updated`);
      } else {
        const payload = { [config.param]: formData.name };
        if (config.parentKey)
          payload[config.parentKey] = parseInt(formData.parentId);
        await api.post(config.create, payload);
        toast.success(`${modalLevel.toUpperCase()} created`);
      }

      setIsModalOpen(false);
      fetchHierarchy();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  const handleDelete = async (item, level) => {
    if (
      !window.confirm(
        `Delete this ${level}? All children will also be deleted!`,
      )
    )
      return;

    const endpoints = {
      main: `/main/${item.PrimID}`,
      submain: `/submain/${item.SubPrimID}`,
      group: `/groups/${item.GroupID}`,
      subgroup: `/subgroups/${item.SubGroupID}`,
      ledger: `/ledgers/${item.AcNo}`,
    };

    try {
      await api.delete(endpoints[level]);
      toast.success(`${level.toUpperCase()} deleted`);
      fetchHierarchy();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const renderHierarchyItem = (item, level = 1) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded =
      expandedNodes[
        `${item.type}_${
          item.PrimID ||
          item.SubPrimID ||
          item.GroupID ||
          item.SubGroupID ||
          item.AcNo
        }`
      ];
    const indentClass = `ml-${(level - 1) * 4}`;

    const getName = () => {
      if (item.PrimName) return item.PrimName;
      if (item.SubName) return item.SubName;
      if (item.GroupName) return item.GroupName;
      if (item.AccName) return item.AccName;
      return "Unknown";
    };

    const getId = () =>
      item.PrimID ||
      item.SubPrimID ||
      item.GroupID ||
      item.SubGroupID ||
      item.AcNo;

    const bgColors = {
      1: "bg-blue-50 border-l-4 border-blue-500",
      2: "bg-indigo-50 border-l-4 border-indigo-400",
      3: "bg-purple-50 border-l-4 border-purple-400",
      4: "bg-pink-50 border-l-4 border-pink-400",
      5: "bg-gray-50 border-l-4 border-gray-400",
    };

    return (
      <div key={`${item.type}_${getId()}`} className="mb-1">
        <div
          className={`flex items-center justify-between p-2 rounded ${bgColors[level] || "bg-gray-50"}`}
        >
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(getId(), item.type)}
                className="mr-2 text-gray-500"
              >
                {isExpanded ? (
                  <FaChevronDown size={12} />
                ) : (
                  <FaChevronRight size={12} />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <span className="font-medium text-gray-800">{getName()}</span>
            {level === 5 && item.AcNo && (
              <span className="ml-2 text-xs text-gray-500">
                (AcNo: {item.AcNo})
              </span>
            )}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {item.type.toUpperCase()}
            </span>
          </div>
          <div>
            {level < 5 && (
              <button
                onClick={() =>
                  openAddModal(
                    level === 1
                      ? "submain"
                      : level === 2
                        ? "group"
                        : level === 3
                          ? "subgroup"
                          : "ledger",
                    getId(),
                  )
                }
                className="text-green-600 hover:text-green-800 mr-2"
                title="Add Child"
              >
                <FaPlus size={14} />
              </button>
            )}
            <button
              onClick={() => openEditModal(item, item.type)}
              className="text-blue-600 hover:text-blue-800 mr-2"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() => handleDelete(item, item.type)}
              className="text-red-600 hover:text-red-800"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className={`ml-6 mt-1 space-y-1`}>
            {item.children.map((child) =>
              renderHierarchyItem(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaTree className="mr-3 text-primary-600" />
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            5-Level Accounting Hierarchy | IFRS 18 Compliant
          </p>
        </div>
        <button
          onClick={() => openAddModal("main")}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Add Main Account
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-50 rounded">Level 1: Main</span>
            <span className="px-2 py-1 bg-indigo-50 rounded">
              Level 2: Sub Main
            </span>

            <span className="px-2 py-1 bg-purple-50 rounded">
              Level 3: Groups
            </span>
            <span className="px-2 py-1 bg-pink-50 rounded">
              Level 4: Sub Groups
            </span>
            <span className="px-2 py-1 bg-gray-50 rounded">
              Level 5: Ledgers
            </span>
          </div>
        </div>
        <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
          {accountHierarchy.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaTree className="mx-auto text-4xl mb-3 text-gray-300" />
              <p>
                No accounts defined. Click "Add Main Account" to start building
                your chart of accounts.
              </p>
            </div>
          ) : (
            accountHierarchy.map((main) => renderHierarchyItem(main, 1))
          )}
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem
                ? `Edit ${modalLevel.toUpperCase()}`
                : `Add New ${modalLevel.toUpperCase()}`}
            </h2>
            <form onSubmit={handleSubmit}>
              {!editingItem && modalLevel !== "main" && (
                <div className="mb-4">
                  <label className="form-label">Parent Account</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select Parent</option>

                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="form-input"
                  required
                  placeholder={`Enter ${modalLevel} name...`}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
