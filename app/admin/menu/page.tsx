"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { apiService, Category, MenuItem, CategoryRequest, MenuItemRequest } from "@/lib/api";

type MenuItemForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  dietaryType: "" | "veg" | "non-veg" | "vegan";
  preparationTimeMinutes: string;
  categoryId: string;
  available: boolean;
};

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  // Menu item modal state
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemForm>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    dietaryType: "",
    preparationTimeMinutes: "",
    categoryId: "",
    available: true,
  });

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [categoriesData, menuItemsData] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenu(),
      ]);
      setCategories(categoriesData);
      setMenuItems(menuItemsData);
    } catch {
      showMessage('error', 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showMessage('error', 'Category name is required');
      return;
    }

    try {
      const request: CategoryRequest = { name: categoryName.trim() };
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, request);
        showMessage('success', 'Category updated successfully');
      } else {
        await apiService.createCategory(request);
        showMessage('success', 'Category created successfully');
      }
      setShowCategoryModal(false);
      setCategoryName("");
      setEditingCategory(null);
      loadData();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryModal(true);
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    const newStatus = category.active === false;
    try {
      await apiService.updateCategoryStatus(category.id, { active: newStatus });
      showMessage('success', `Category ${newStatus ? 'enabled' : 'disabled'} successfully`);
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to update category status');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to permanently delete category "${category.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteCategory(category.id);
      showMessage('success', 'Category deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to delete category');
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemForm.name.trim() || !menuItemForm.price || !menuItemForm.categoryId) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      const request: MenuItemRequest = {
        name: menuItemForm.name.trim(),
        description: menuItemForm.description.trim(),
        price: parseFloat(menuItemForm.price),
        imageUrl: menuItemForm.imageUrl.trim(),
        dietaryType: menuItemForm.dietaryType,
        preparationTimeMinutes: menuItemForm.preparationTimeMinutes
          ? parseInt(menuItemForm.preparationTimeMinutes, 10)
          : undefined,
        categoryId: parseInt(menuItemForm.categoryId),
        available: menuItemForm.available,
      };

      if (editingMenuItem) {
        await apiService.updateMenuItem(editingMenuItem.id, request);
        showMessage('success', 'Menu item updated successfully');
      } else {
        await apiService.createMenuItem(request);
        showMessage('success', 'Menu item created successfully');
      }
      setShowMenuItemModal(false);
      setMenuItemForm({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        dietaryType: "",
        preparationTimeMinutes: "",
        categoryId: "",
        available: true,
      });
      setEditingMenuItem(null);
      loadData();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save menu item');
    }
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setMenuItemForm({
      name: menuItem.name,
      description: menuItem.description || "",
      price: menuItem.price.toString(),
      imageUrl: menuItem.imageUrl || "",
      dietaryType: menuItem.dietaryType || "",
      preparationTimeMinutes: menuItem.preparationTimeMinutes?.toString() || "",
      categoryId: menuItem.category?.id?.toString() || "",
      available: menuItem.available,
    });
    setShowMenuItemModal(true);
  };

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${menuItem.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteMenuItem(menuItem.id);
      showMessage('success', 'Menu item deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (menuItem: MenuItem) => {
    try {
      await apiService.updateMenuItemAvailability(menuItem.id, { available: !menuItem.available });
      showMessage('success', `Menu item ${menuItem.available ? 'disabled' : 'enabled'} successfully`);
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600">Manage restaurant categories and menu items</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-7xl mx-auto mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-4">
        <button
          onClick={() => {
            setEditingCategory(null);
            setCategoryName("");
            setShowCategoryModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
        <button
          onClick={() => {
            setEditingMenuItem(null);
            setMenuItemForm({
              name: "",
              description: "",
              price: "",
              imageUrl: "",
              dietaryType: "",
              preparationTimeMinutes: "",
              categoryId: "",
              available: true,
            });
            setShowMenuItemModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Menu Item
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No categories found</div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      category.active !== false ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleCategoryStatus(category)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors font-medium ${
                        category.active !== false
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {category.active !== false ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Items</h2>
          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No menu items found</div>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {!item.available && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Unavailable</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.category?.name} • ₹{item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.available
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {item.available ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryName("");
                  setEditingCategory(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Burgers"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {showMenuItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button
                onClick={() => {
                  setShowMenuItemModal(false);
                  setMenuItemForm({
                    name: "",
                    description: "",
                    price: "",
                    imageUrl: "",
                    dietaryType: "",
                    preparationTimeMinutes: "",
                    categoryId: "",
                    available: true,
                  });
                  setEditingMenuItem(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                    placeholder="e.g., Chicken Burger"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                    placeholder="e.g., Grilled chicken burger with fresh vegetables"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                    placeholder="e.g., 149"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={menuItemForm.categoryId}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter((cat) => cat.active !== false)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={menuItemForm.imageUrl}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Type
                  </label>
                  <select
                    value={menuItemForm.dietaryType}
                    onChange={(e) => setMenuItemForm({
                      ...menuItemForm,
                      dietaryType: e.target.value === "veg" || e.target.value === "non-veg" || e.target.value === "vegan"
                        ? e.target.value
                        : "",
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not specified</option>
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={menuItemForm.preparationTimeMinutes}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, preparationTimeMinutes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={menuItemForm.available}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, available: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-gray-700">
                    Available for ordering
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuItemModal(false);
                    setMenuItemForm({
                      name: "",
                      description: "",
                      price: "",
                      imageUrl: "",
                      dietaryType: "",
                      preparationTimeMinutes: "",
                      categoryId: "",
                      available: true,
                    });
                    setEditingMenuItem(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
