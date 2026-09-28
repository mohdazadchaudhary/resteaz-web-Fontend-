"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, X, ArrowLeft } from "lucide-react";
import { apiService, OrderResponse } from "@/lib/api";

export default function OrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refreshOrder = async () => {
      try {
        const orderData = await apiService.getOrderById(Number(orderId));
        if (active) {
          setOrder(orderData);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void refreshOrder();
    const interval = window.setInterval(() => void refreshOrder(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'CONFIRMED':
      case 'PREPARING':
      case 'READY':
        return <CheckCircle2 className="w-6 h-6 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'CANCELLED':
        return <X className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800';
      case 'READY':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const orderSteps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    { key: 'COMPLETED', label: 'Served' },
  ];

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const stepIndex = orderSteps.findIndex(step => step.key === order.status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading order...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Success Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully</h1>
          </div>
          <div className="space-y-2 text-gray-600">
            <p><span className="font-medium">Order ID:</span> {order.id}</p>
            <p><span className="font-medium">Table:</span> {order.tableNumber}</p>
            <p><span className="font-medium">Total:</span> ₹{order.totalAmount.toFixed(2)}</p>
            <p><span className="font-medium">Placed:</span> {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
          
          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <X className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-800">Order Cancelled</p>
                <p className="text-sm text-red-600">This order has been cancelled</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-semibold text-gray-900">{order.status}</p>
                  <p className="text-sm text-gray-600">
                    Updated {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mt-6">
                <div className="relative">
                  {orderSteps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isFuture = index > currentStepIndex;

                    return (
                      <div key={step.key} className="flex items-center mb-4 last:mb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={`font-medium ${
                            isCompleted ? 'text-green-600' :
                            isCurrent ? 'text-blue-600' :
                            'text-gray-500'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  {item.addOns?.map((addOn) => (
                    <p key={`${item.menuItemId}-${addOn.addOnId}`} className="pl-3 text-sm text-gray-600">
                      + {addOn.name} × {addOn.quantity} — ₹{addOn.subtotal.toFixed(2)}
                    </p>
                  ))}
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{item.unitPrice.toFixed(2)} × {item.quantity}</p>
                  <p className="text-sm text-gray-600">₹{item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-2xl">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Order status updates automatically.</p>
        </div>
      </div>
    </div>
  );
}
