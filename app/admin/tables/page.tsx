"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Download, Eye, X, CheckCircle2, AlertCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { apiService, Table, Restaurant, TableRequest } from "@/lib/api";

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add table form state
  const [tableNumber, setTableNumber] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [tablesData, restaurantsData] = await Promise.all([
        apiService.getAllTables(),
        apiService.getRestaurants(),
      ]);
      setTables(tablesData);
      setRestaurants(restaurantsData);
    } catch {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId || !tableNumber.trim()) {
      showMessage('error', 'Please fill in all fields');
      return;
    }

    try {
      const request: TableRequest = {
        restaurantId: selectedRestaurantId,
        tableNumber: tableNumber.trim(),
      };
      await apiService.createTable(request);
      showMessage('success', 'Table created successfully');
      setShowAddModal(false);
      setTableNumber("");
      setSelectedRestaurantId(null);
      loadData();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to create table');
    }
  };

  const handleDeactivateTable = async (table: Table) => {
    if (!confirm(`Are you sure you want to deactivate table ${table.tableNumber}?`)) {
      return;
    }

    try {
      await apiService.updateTableStatus(table.id, { active: false });
      showMessage('success', 'Table deactivated successfully');
      loadData();
    } catch {
      showMessage('error', 'Failed to deactivate table');
    }
  };

  const handleViewQR = (table: Table) => {
    setSelectedTable(table);
    setShowQRModal(true);
  };

  const handleDownloadQR = (table: Table) => {
    const canvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `resteaz-table-${table.tableNumber}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  const getQRUrl = (qrToken: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL}/table/${qrToken}`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Tables</h1>
        <p className="text-gray-600">Manage restaurant tables and QR codes</p>
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

      {/* Add Table Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Table
        </button>
      </div>

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Table {table.tableNumber}</h3>
                <p className="text-sm text-gray-600">{table.restaurant.name}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                table.active ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  table.active ? 'bg-green-600' : 'bg-red-600'
                }`} />
                {table.active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <QRCodeCanvas
                  value={getQRUrl(table.qrToken)}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewQR(table)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View QR
              </button>
              <button
                onClick={() => handleDownloadQR(table)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              {table.active && (
                <button
                  onClick={() => handleDeactivateTable(table)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tables found. Click &quot;Add Table&quot; to create one.
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Table</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant
                </label>
                <select
                  value={selectedRestaurantId || ''}
                  onChange={(e) => setSelectedRestaurantId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., T1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View QR Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Table {selectedTable.tableNumber}</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <QRCodeCanvas
                  id={`qr-canvas-${selectedTable.id}`}
                  value={getQRUrl(selectedTable.qrToken)}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-gray-600 text-center mb-2">
                Scan this QR code to open the restaurant menu
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                Table: {selectedTable.tableNumber} | {selectedTable.restaurant.name}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleDownloadQR(selectedTable)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
