"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Utensils, ShoppingCart, Plus, Minus, ArrowRight } from "lucide-react";
import { apiService, Table, MenuItem, Category } from "@/lib/api";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function TablePage() {
  const params = useParams();
  const qrToken = params.qrToken as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  const loadTableAndMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate QR token and get table info
      const tableData = await apiService.getTableByQrToken(qrToken);
      setTable(tableData);

      // Load menu and categories
      const [menuData, categoriesData] = await Promise.all([
        apiService.getMenu(),
        apiService.getCategories(),
      ]);
      setMenuItems(menuData);
      setCategories(categoriesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load table';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [qrToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTableAndMenu();
  }, [loadTableAndMenu]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItem: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItem.id === menuItem.id);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.menuItem.id !== menuItem.id);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredMenuItems = selectedCategory === "all"
    ? menuItems
    : menuItems.filter((item) => item.category?.id === Number(selectedCategory));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading restaurant menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error.includes("not found") ? "Invalid Table QR" : "Table Unavailable"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error.includes("not found")
              ? "This QR code is no longer valid. Please scan a valid restaurant table QR code."
              : error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!table) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{table.restaurant.name}</h1>
              <p className="text-sm text-gray-600">Table {table.tableNumber}</p>
            </div>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart ({getCartItemCount()})</span>
              {getCartItemCount() > 0 && (
                <span className="bg-blue-800 text-xs px-2 py-1 rounded-full">
                  ₹{getCartTotal().toFixed(2)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(String(category.id))}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === String(category.id)
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No menu items available.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    <p className="text-lg font-bold text-gray-900 mt-2">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                    {cart.find((c) => c.menuItem.id === item.id) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold">
                          {cart.find((c) => c.menuItem.id === item.id)?.quantity || 0}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto">
          <button className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{getCartItemCount()} items</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">₹{getCartTotal().toFixed(2)}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
