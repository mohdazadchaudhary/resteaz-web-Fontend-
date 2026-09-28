"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit, X, CheckCircle2, AlertCircle, Trash2, Utensils, Upload } from "lucide-react";
import { apiService, AddOn, Category, MenuItem, CategoryRequest, MenuItemRequest, resolveImageUrl } from "@/lib/api";

type MenuItemAddOn = {
  id?: number;
  name: string;
  description?: string;
  price: number;
  dietaryType?: "veg" | "non-veg" | "";
  available: boolean;
};

type MenuItemForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  dietaryType: "" | "veg" | "non-veg" | "vegan";
  preparationTimeMinutes: string;
  categoryId: string;
  available: boolean;
  addOns: MenuItemAddOn[];
};

function MenuImagePreview({ imageUrl }: { imageUrl: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = resolveImageUrl(imageUrl);

  return src && failedUrl !== src ? (
    <img src={src} alt="Menu item preview" onError={() => setFailedUrl(src)} className="h-32 w-full rounded-lg object-cover" />
  ) : (
    <div className="h-32 w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
      <Utensils className="h-9 w-9" />
    </div>
  );
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemForm>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    dietaryType: "",
    preparationTimeMinutes: "",
    categoryId: "",
    available: true,
    addOns: [],
  });
  const [selectedAddOnId, setSelectedAddOnId] = useState("");
  const [newAddOnName, setNewAddOnName] = useState("");
  const [newAddOnPrice, setNewAddOnPrice] = useState("");
  const [newAddOnDietaryType, setNewAddOnDietaryType] = useState<"veg" | "non-veg" | "">("");
  const [addOnAction, setAddOnAction] = useState<"create" | "attach" | null>(null);
  const [removingAddOnId, setRemovingAddOnId] = useState<number | null>(null);
  const [addOnMessage, setAddOnMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const addOnActionInProgress = useRef(false);
  const removalInProgress = useRef(false);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const createMenuItemRequest = (form: MenuItemForm, addOns: MenuItemAddOn[]): MenuItemRequest => ({
    name: form.name.trim(),
    description: form.description.trim(),
    price: parseFloat(form.price),
    imageUrl: form.imageUrl.trim(),
    dietaryType: form.dietaryType,
    preparationTimeMinutes: form.preparationTimeMinutes
      ? parseInt(form.preparationTimeMinutes, 10)
      : undefined,
    categoryId: parseInt(form.categoryId, 10),
    available: form.available,
    addOns: addOns.filter((addOn): addOn is MenuItemAddOn & { id: number } => addOn.id !== undefined)
      .map(({ id }) => ({ id })),
  });

  const persistAddOnSelection = async (addOns: MenuItemAddOn[]) => {
    if (!editingMenuItem) return;
    const updated = await apiService.updateMenuItem(
      editingMenuItem.id,
      createMenuItemRequest(menuItemForm, addOns),
    );
    setEditingMenuItem(updated);
    setMenuItems((items) => items.map((item) => item.id === updated.id ? updated : item));
  };

  const setAddOnFeedback = (type: "success" | "error", text: string) => {
    setAddOnMessage({ type, text });
    if (type === "success") showMessage("success", text);
  };

  const loadData = useCallback(async () => {
    try {
      const [categoriesData, menuItemsData, addOnsData] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenu(),
        apiService.getAddOns(),
      ]);
      setCategories(categoriesData);
      setMenuItems(menuItemsData);
      setAvailableAddOns(addOnsData);
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
      const savedAddOns = await Promise.all(menuItemForm.addOns.map(async (addOn) => {
        const payload = {
          name: addOn.name.trim(),
          description: addOn.description,
          price: addOn.price,
          dietaryType: addOn.dietaryType || "",
          available: addOn.available,
        };
        return addOn.id
          ? apiService.updateAddOn(addOn.id, payload)
          : apiService.createAddOn(payload);
      }));
      const request = createMenuItemRequest(menuItemForm, savedAddOns);

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
        addOns: [],
      });
      setEditingMenuItem(null);
      setAddOnMessage(null);
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
      addOns: (menuItem.addOns || []).map((addOn) => ({ ...addOn })),
    });
    setSelectedAddOnId("");
    setNewAddOnName("");
    setNewAddOnPrice("");
    setNewAddOnDietaryType("");
    setAddOnMessage(null);
    setShowMenuItemModal(true);
  };

  const handleAddExistingAddOn = () => {
    if (addOnActionInProgress.current || removalInProgress.current) return;
    if (!selectedAddOnId) {
      setAddOnFeedback("error", "Select an add-on to attach.");
      return;
    }
    const addOn = availableAddOns.find((entry) => entry.id === Number(selectedAddOnId));
    if (!addOn) {
      setAddOnFeedback("error", "That add-on is no longer available. Refresh and try again.");
      return;
    }
    if (menuItemForm.addOns.some((entry) => entry.id === addOn.id)) {
      setAddOnFeedback("error", "This add-on is already attached.");
      return;
    }
    const nextAddOns = [...menuItemForm.addOns, { ...addOn }];
    addOnActionInProgress.current = true;
    setAddOnAction("attach");
    setMenuItemForm((current) => ({ ...current, addOns: nextAddOns }));
    setSelectedAddOnId("");
    void persistAddOnSelection(nextAddOns)
      .then(() => setAddOnFeedback("success", editingMenuItem
        ? "Add-on attached successfully."
        : "Add-on added. Save the menu item to persist the attachment."))
      .catch(() => setAddOnFeedback("error",
        "Could not save the attachment yet. It will remain in this form; try saving the menu item again."))
      .finally(() => {
        addOnActionInProgress.current = false;
        setAddOnAction(null);
      });
  };

  const handleAddNewAddOn = async () => {
    if (addOnActionInProgress.current || removalInProgress.current) return;
    const name = newAddOnName.trim();
    const price = Number(newAddOnPrice);
    if (!name) {
      setAddOnFeedback("error", "Enter an add-on name.");
      return;
    }
    if (!newAddOnPrice.trim() || !Number.isFinite(price) || price <= 0) {
      setAddOnFeedback("error", "Enter a valid price greater than zero.");
      return;
    }
    if (!newAddOnDietaryType) {
      setAddOnFeedback("error", "Choose Veg or Non-Veg for the add-on.");
      return;
    }
    if (availableAddOns.some((addOn) => addOn.name.trim().toLowerCase() === name.toLowerCase())) {
      setAddOnFeedback("error", "An add-on with this name already exists. Select it from the list instead.");
      return;
    }

    addOnActionInProgress.current = true;
    setAddOnAction("create");
    try {
      const created = await apiService.createAddOn({
        name,
        price,
        dietaryType: newAddOnDietaryType,
        available: true,
      });
      setAvailableAddOns((current) => [...current, created]);
      const nextAddOns = [...menuItemForm.addOns, created];
      setMenuItemForm((current) => ({ ...current, addOns: nextAddOns }));
      setNewAddOnName("");
      setNewAddOnPrice("");
      setNewAddOnDietaryType("");
      setSelectedAddOnId("");
      try {
        await persistAddOnSelection(nextAddOns);
        setAddOnFeedback("success", "Add-on created successfully.");
      } catch {
        setAddOnFeedback("error",
          "Add-on created, but the attachment could not be saved yet. It will remain in this form; save the menu item to retry.");
      }
    } catch (error) {
      const duplicate = error instanceof Error && error.message.toLowerCase().includes("already exists");
      setAddOnFeedback("error", duplicate
        ? "An add-on with this name already exists. Select it from the list instead."
        : "Could not create the add-on. Check the details and try again.");
    } finally {
      addOnActionInProgress.current = false;
      setAddOnAction(null);
    }
  };

  const handleRemoveAddOn = async (addOn: MenuItemAddOn, index: number) => {
    if (addOnActionInProgress.current || removalInProgress.current) return;
    const nextAddOns = menuItemForm.addOns.filter((_, addOnIndex) => addOnIndex !== index);
    removalInProgress.current = true;
    setRemovingAddOnId(addOn.id ?? -(index + 1));
    try {
      await persistAddOnSelection(nextAddOns);
      setMenuItemForm((current) => ({ ...current, addOns: nextAddOns }));
      setAddOnFeedback("success", editingMenuItem
        ? "Add-on removed successfully."
        : "Add-on removed. Save the menu item to persist the change.");
    } catch {
      setAddOnFeedback("error",
        "Could not save the removal yet. It will remain in this form; save the menu item again to retry.");
    } finally {
      removalInProgress.current = false;
      setRemovingAddOnId(null);
    }
  };

  const handleUploadMenuImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      showMessage("error", "Choose a JPEG, PNG, or GIF image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image must be 5 MB or smaller");
      return;
    }

    setUploadingImage(true);
    try {
      const result = await apiService.uploadMenuImage(file);
      setMenuItemForm((current) => ({ ...current, imageUrl: result.imageUrl }));
      showMessage("success", "Image uploaded");
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
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
              addOns: [],
            });
            setSelectedAddOnId("");
            setNewAddOnName("");
            setNewAddOnPrice("");
            setAddOnMessage(null);
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
                    <span className="font-medium text-black">{category.name}</span>
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
                      <span className="font-medium text-black">{item.name}</span>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

            <form onSubmit={handleSaveCategory} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto mb-6">
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

              <div className="flex flex-shrink-0 gap-3 border-t border-gray-100 pt-4">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
                    addOns: [],
                  });
                  setEditingMenuItem(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto space-y-4 mb-6">
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

                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Add-ons / Extras
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedAddOnId}
                      onChange={(event) => setSelectedAddOnId(event.target.value)}
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-black"
                    >
                      <option value="">Select an existing add-on</option>
                      {availableAddOns
                        .filter((addOn) => !menuItemForm.addOns.some((attached) => attached.id === addOn.id))
                        .map((addOn) => (
                          <option key={addOn.id} value={addOn.id}>
                            {addOn.name} — ₹{addOn.price.toFixed(2)}
                            {addOn.dietaryType ? ` · ${addOn.dietaryType === "veg" ? "Veg" : "Non-Veg"}` : ""}
                            {addOn.available ? "" : " (Unavailable)"}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddExistingAddOn}
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
                    >
                      {addOnAction === "attach" ? "Adding..." : "Add Existing"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAddOnName}
                      onChange={(event) => setNewAddOnName(event.target.value)}
                      placeholder="New add-on name"
                      maxLength={120}
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-black"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newAddOnPrice}
                      onChange={(event) => setNewAddOnPrice(event.target.value)}
                      placeholder="Price"
                      aria-label="New add-on price"
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-black"
                    />
                    <select
                      value={newAddOnDietaryType}
                      onChange={(event) => setNewAddOnDietaryType(
                        event.target.value === "veg" || event.target.value === "non-veg" ? event.target.value : "",
                      )}
                      aria-label="New add-on dietary type"
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm text-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Veg/Non-Veg</option>
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-Veg</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddNewAddOn}
                      disabled={addOnAction !== null || removingAddOnId !== null}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {addOnAction === "create" ? "Creating..." : "Create"}
                    </button>
                  </div>
                  {addOnMessage && (
                    <p className={`text-sm ${addOnMessage.type === "error" ? "text-red-600" : "text-green-700"}`} role="status">
                      {addOnMessage.text}
                    </p>
                  )}
                  {menuItemForm.addOns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Added add-ons</p>
                      {menuItemForm.addOns.map((addOn, index) => {
                        const removeKey = addOn.id ?? -(index + 1);
                        return (
                          <div key={addOn.id ?? `new-${index}`} className="space-y-2 rounded-md bg-gray-50 p-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={addOn.name}
                                onChange={(event) => setMenuItemForm((current) => ({
                                  ...current,
                                  addOns: current.addOns.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, name: event.target.value } : entry),
                                }))}
                                aria-label="Add-on name"
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
                                required
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={addOn.price}
                                onChange={(event) => setMenuItemForm((current) => ({
                                  ...current,
                                  addOns: current.addOns.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, price: event.target.value === "" ? 0 : Number(event.target.value) }
                                      : entry),
                                }))}
                                aria-label={`${addOn.name} price`}
                                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
                                required
                              />
                              <select
                                value={addOn.dietaryType ?? ""}
                                onChange={(event) => setMenuItemForm((current) => ({
                                  ...current,
                                  addOns: current.addOns.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                        ...entry,
                                        dietaryType: event.target.value === "veg" || event.target.value === "non-veg"
                                          ? event.target.value
                                          : "",
                                      }
                                      : entry),
                                }))}
                                aria-label={`${addOn.name} dietary type`}
                                className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-xs text-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Veg/Non-Veg</option>
                                <option value="veg">Veg</option>
                                <option value="non-veg">Non-Veg</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleRemoveAddOn(addOn, index)}
                                disabled={addOnAction !== null || removingAddOnId !== null}
                                className="shrink-0 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {removingAddOnId === removeKey ? "Removing..." : "Remove"}
                              </button>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={addOn.available}
                                onChange={(event) => setMenuItemForm((current) => ({
                                  ...current,
                                  addOns: current.addOns.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, available: event.target.checked } : entry),
                                }))}
                              />
                              Available
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Food Image
                  </label>
                  <MenuImagePreview imageUrl={menuItemForm.imageUrl} />
                  <div className="flex items-center gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleUploadMenuImage}
                      disabled={uploadingImage}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {menuItemForm.imageUrl ? "Replace Image" : "Upload Image"}
                    </button>
                    {menuItemForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuItemForm((current) => ({ ...current, imageUrl: "" }));
                          if (imageInputRef.current) imageInputRef.current.value = "";
                        }}
                        className="shrink-0 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {uploadingImage && <p className="text-sm text-gray-500">Uploading image...</p>}
                  <label className="block text-sm font-medium text-gray-700">
                    Or paste an image URL
                  </label>
                  <input
                    type="text"
                    value={menuItemForm.imageUrl}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    disabled={uploadingImage}
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

              <div className="flex flex-shrink-0 gap-3 border-t border-gray-100 pt-4">
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
                      addOns: [],
                    });
                    setEditingMenuItem(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || addOnAction !== null || removingAddOnId !== null}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
