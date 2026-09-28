"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { apiService, AddOn, Category, MenuItem as ApiMenuItem, OrderItemRequest, OrderResponse, Restaurant, Table, resolveImageUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Utensils,
  Bike,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ChefHat,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Flame,
  Leaf,
  Store,
  RefreshCw,
} from "lucide-react";

type MenuItem = ApiMenuItem;
type CartItem = {
  cartId: string;
  menuItem: MenuItem;
  quantity: number;
  addOns: AddOn[];
};
type Order = {
  id: string;
  backendId: number;
  type: string;
  table?: string | null;
  address?: string | null;
  customer: string;
  phone: string;
  time: string;
  status: string;
  items: { name: string; qty: number; addons: string[] }[];
  total: number;
  paymentStatus: string;
};
type Notification = { message: string; type: "success" | "error" | "info" };

function MenuItemImage({ imageUrl, name, className }: { imageUrl?: string | null; name: string; className: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = resolveImageUrl(imageUrl);

  return src && failedUrl !== src ? (
    <img src={src} alt={name} onError={() => setFailedUrl(src)} className={className} loading="lazy" />
  ) : (
    <div className={`${className} flex items-center justify-center bg-stone-100 text-stone-300`}>
      <Utensils className="h-12 w-12" />
    </div>
  );
}

export default function App() {
  const router = useRouter();
  // Navigation View: 'customer' or 'kitchen'
  const [activeView, setActiveView] = useState("customer");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [kdsRestaurantId, setKdsRestaurantId] = useState<number | null>(null);
  const [kdsLoading, setKdsLoading] = useState(false);
  const [kdsError, setKdsError] = useState<string | null>(null);

  // Ordering mode: 'dine_in' | 'delivery' | 'pickup'
  const [orderMode, setOrderMode] = useState("dine_in");

  // Table for Dine-In
  const tableNumber = selectedTable ? `Table ${selectedTable.tableNumber}` : "Select a table";
  const [showQRSimulator, setShowQRSimulator] = useState(false);

  // Menu, Search & Filter
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dietFilter, setDietFilter] = useState("all"); // 'all', 'veg', 'non-veg', 'vegan'
  const [searchQuery, setSearchQuery] = useState("");

  // Cart Management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customization Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const idempotencyKey = useRef<{ fingerprint: string; key: string } | null>(null);

  // This is the single KDS queue, loaded from persisted backend orders.
  const [orders, setOrders] = useState<Order[]>([]);

  // Alert / Toast Notification state
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: Notification["type"] = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3800);
  };

  const selectTable = (table: Table) => {
    setSelectedTable(table);
    const query = new URLSearchParams(window.location.search);
    query.set("qrToken", table.qrToken);
    window.history.replaceState(null, "", `${window.location.pathname}?${query.toString()}${window.location.hash}`);
  };

  const loadCustomerMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const [restaurantData, tableData, categoryData, menuData] = await Promise.all([
        apiService.getRestaurants(),
        apiService.getAllTables(),
        apiService.getCategories(),
        apiService.getMenu(),
      ]);
      const activeTables = tableData.filter((table) => table.active && table.restaurant.active);
      const scannedToken = new URLSearchParams(window.location.search).get("qrToken");
      const scannedTable = scannedToken
        ? await apiService.getTableByQrToken(scannedToken)
        : null;
      const initialTable = scannedTable ?? activeTables[0] ?? null;

      setRestaurants(restaurantData.filter((restaurant) => restaurant.active));
      setTables(activeTables);
      setSelectedTable(initialTable);
      setCategories(categoryData);
      setMenuItems(menuData);
      setKdsRestaurantId(initialTable?.restaurant.id ?? restaurantData.find((r) => r.active)?.id ?? null);
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "Unable to load menu.");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const toKdsOrder = (order: OrderResponse): Order => ({
    id: `ORD-${order.id}`,
    backendId: order.id,
    type: "dine_in",
    table: `Table ${order.tableNumber}`,
    customer: order.customerName || "Guest",
    phone: order.customerPhone || "",
    time: new Date(order.createdAt).toLocaleTimeString(),
    status: order.status.toLowerCase(),
    items: order.items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      addons: item.addOns.map((addOn) => addOn.name),
    })),
    total: order.totalAmount,
    paymentStatus: order.paymentStatus,
  });

  const loadKdsOrders = useCallback(async (id: number) => {
    setKdsLoading(true);
    try {
      const restaurantOrders = await apiService.getRestaurantOrders(id);
      setOrders(restaurantOrders.map(toKdsOrder));
      setKdsError(null);
    } catch (error) {
      setKdsError(error instanceof Error ? error.message : "Could not load kitchen orders");
    } finally {
      setKdsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const syncKdsRoute = () => {
      setActiveView(window.location.hash === "#kds" ? "kitchen" : "customer");
    };
    window.addEventListener("hashchange", syncKdsRoute);
    const routeSync = window.setTimeout(syncKdsRoute, 0);
    const initialLoad = window.setTimeout(() => {
      if (active) void loadCustomerMenu();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(routeSync);
      window.clearTimeout(initialLoad);
      window.removeEventListener("hashchange", syncKdsRoute);
    };
  }, [loadCustomerMenu]);

  useEffect(() => {
    if (kdsRestaurantId === null) return;
    const initialRefresh = window.setTimeout(() => void loadKdsOrders(kdsRestaurantId), 0);
    const interval = window.setInterval(() => void loadKdsOrders(kdsRestaurantId), 8000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [kdsRestaurantId, loadKdsOrders]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category?.id === Number(selectedCategory);
      const matchesDiet = dietFilter === "all" || item.dietaryType === dietFilter;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesDiet && matchesSearch;
    });
  }, [menuItems, selectedCategory, dietFilter, searchQuery]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) =>
      sum + (item.menuItem.price + item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0))
        * item.quantity, 0);
  }, [cart]);

  const grandTotal = cartSubtotal;
  const cartItemCount = cart.reduce((count, i) => count + i.quantity, 0);
  const restaurant = selectedTable?.restaurant
    ?? restaurants.find((item) => item.id === kdsRestaurantId)
    ?? restaurants[0]
    ?? null;

  const handleOpenCustomization = (item: MenuItem) => {
    setSelectedAddOnIds([]);
    setCustomizingItem(item);
  };

  const handleAddToCartWithCustomization = () => {
    if (!customizingItem || !customizingItem.available || customizingItem.category?.active === false) return;
    const cartItemId = `${customizingItem.id}-${Date.now()}`;
    const newItem = {
      cartId: cartItemId,
      menuItem: customizingItem,
      quantity: 1,
      addOns: (customizingItem.addOns ?? [])
        .filter((addOn) => addOn.available && selectedAddOnIds.includes(addOn.id)),
    };

    setCart((prev) => [...prev, newItem]);
    setCustomizingItem(null);
    showNotification(
      `Added "${customizingItem.name}" to your tray!`,
      "success",
    );
  };

  const customizationTotal = customizingItem
    ? customizingItem.price + (customizingItem.addOns ?? [])
      .filter((addOn) => selectedAddOnIds.includes(addOn.id))
      .reduce((sum, addOn) => sum + addOn.price, 0)
    : 0;

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const [isOrderPlacedSuccess, setIsOrderPlacedSuccess] = useState(false);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showNotification("Your tray is empty!", "error");
      return;
    }
    if (orderMode !== "dine_in") {
      setOrderError("Delivery and pickup are not supported by the current order API.");
      return;
    }
    if (!selectedTable) {
      setOrderError("Scan a table QR code or select an active table before ordering.");
      return;
    }
    const unavailableItem = cart.find((entry) => {
      const currentItem = menuItems.find((item) => item.id === entry.menuItem.id) ?? entry.menuItem;
      return !currentItem.available || currentItem.category?.active === false;
    });
    if (unavailableItem) {
      setOrderError(`${unavailableItem.menuItem.name} is unavailable. Remove it before checkout.`);
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);
    const items: OrderItemRequest[] = cart.map(({ menuItem, quantity, addOns }) => ({
      menuItemId: menuItem.id,
      quantity,
      addOns: addOns.map((addOn) => ({ addOnId: addOn.id, quantity: 1 })),
    }));
    const fingerprint = JSON.stringify({ tableId: selectedTable.id, items });
    if (idempotencyKey.current?.fingerprint !== fingerprint) {
      idempotencyKey.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const order = await apiService.createOrder({
        qrToken: selectedTable.qrToken,
        idempotencyKey: idempotencyKey.current.key,
        restaurantId: selectedTable.restaurant.id,
        tableId: selectedTable.id,
        items,
      });
      idempotencyKey.current = null;
      setLastPlacedOrderId(String(order.id));
      setCart([]);
      setIsCartOpen(false);
      setIsOrderPlacedSuccess(true);
      void loadKdsOrders(order.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to place order.";
      setOrderError(message);
      void apiService.getMenu().then(setMenuItems).catch((refreshError: unknown) => {
        setMenuError(refreshError instanceof Error ? refreshError.message : "Unable to load menu.");
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const updatedOrder = await apiService.updateOrderStatus(orderId, newStatus);
      setOrders((current) => current.map((order) =>
        order.backendId === updatedOrder.id ? toKdsOrder(updatedOrder) : order,
      ));
      setKdsError(null);
      showNotification(`Order ${orderId} updated to ${newStatus.toUpperCase()}`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update order status";
      setKdsError(message);
      showNotification(message, "error");
    }
  };

  const renderDietBadge = (diet?: string | null) => {
    if (diet === "veg") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
          <Leaf className="w-3 h-3 text-emerald-600" /> Veg
        </span>
      );
    }
    if (diet === "vegan") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-full">
          <Leaf className="w-3 h-3 text-teal-600" /> Vegan Pure
        </span>
      );
    }
    if (diet === "non-veg") return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
        <Flame className="w-3 h-3 text-rose-500" /> Non-Veg
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-white/90 border border-stone-200 px-2 py-0.5 rounded-full">
        Diet not specified
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Restaurant Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-stone-900">
                    {restaurant?.name ?? (menuLoading ? "Loading restaurant…" : "Restaurant")}
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Live
                  </span>
                </div>
                {restaurant?.address && (
                  <p className="text-xs text-stone-500 hidden sm:block">{restaurant.address}</p>
                )}
              </div>
            </div>

            {/* View Switcher (Customer vs Kitchen/Manager) */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-medium">
              <button
                onClick={() => {
                  setActiveView("customer");
                  if (window.location.hash) {
                    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === "customer"
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Customer Menu
              </button>
              <button
                onClick={() => {
                  setActiveView("kitchen");
                  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#kds`);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative ${
                  activeView === "kitchen"
                    ? "bg-stone-900 text-white shadow-sm font-semibold"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Kitchen Display
              </button>
            </div>

            {/* Quick Action Icons / Cart Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQRSimulator(!showQRSimulator)}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                title="Simulate scanning a table QR code"
              >
                <QrCode className="w-4 h-4 text-amber-700" />
                <span>QR Table Test</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium rounded-xl shadow-md shadow-amber-600/25 transition flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-semibold">
                  Tray
                </span>
                {cartItemCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-amber-700 text-xs font-black flex items-center justify-center shadow-inner">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-medium border ${
              notification.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-stone-900 border-stone-800 text-white"
            }`}
          >
            {notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {}
      {showQRSimulator && (
        <div className="bg-amber-900 text-amber-100 px-4 py-3 border-b border-amber-800 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-300" />
              <div>
                <span className="font-bold text-white uppercase tracking-wider">
                  Simulate QR Table Scan:
                </span>
                <span className="ml-2 text-amber-200">
                  Select an active table from the restaurant database
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => {
                    setOrderMode("dine_in");
                    selectTable(table);
                    setKdsRestaurantId(table.restaurant.id);
                    showNotification(`Selected table ${table.tableNumber}`, "success");
                  }}
                  className={`px-2.5 py-1 rounded border text-xs transition ${
                    selectedTable?.id === table.id && orderMode === "dine_in"
                      ? "bg-amber-400 text-stone-900 font-bold border-amber-300"
                      : "bg-amber-800/60 hover:bg-amber-700 text-amber-200 border-amber-700"
                  }`}
                >
                  Table {table.tableNumber}
                </button>
              ))}
              <button
                onClick={() => setShowQRSimulator(false)}
                className="text-amber-300 hover:text-white ml-2 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {activeView === "customer" ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Hero & Mode Selection Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Order How You Prefer
                </span>
                <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
                  Fresh Flavors, Zero Waiting
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">
                  Browse the live menu and order for an active restaurant table.
                </p>
              </div>

              {/* Dynamic Order Mode Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold w-full md:w-auto">
                <button
                  onClick={() => setOrderMode("dine_in")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                    orderMode === "dine_in"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Dine-In</span>
                </button>

                <button
                  onClick={() => setOrderMode("delivery")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                    orderMode === "delivery"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Delivery</span>
                </button>

                <button
                  onClick={() => setOrderMode("pickup")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                    orderMode === "pickup"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pickup</span>
                </button>
              </div>
            </div>

            {/* Contextual Banner based on active mode */}
            <div className="pt-2 border-t border-stone-100">
              {orderMode === "dine_in" && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-200/70 rounded-lg text-amber-800">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold">Ordering for Table: </span>
                      <span className="font-extrabold text-amber-800 underline decoration-amber-400">
                        {tableNumber}
                      </span>
                      <span className="text-stone-500 text-[11px] block sm:inline sm:ml-2">
                        Order status is shared with the kitchen display
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-stone-600">
                      Change Table:
                    </label>
                    <select
                      value={selectedTable?.id ?? ""}
                      onChange={(e) => {
                        const table = tables.find((candidate) => candidate.id === Number(e.target.value));
                        if (table) {
                          selectTable(table);
                        }
                      }}
                      className="bg-white border border-stone-300 text-stone-900 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
                    >
                      {!selectedTable && <option value="">Select a table</option>}
                      {tables
                        .filter((table) => !selectedTable || table.restaurant.id === selectedTable.restaurant.id)
                        .map((table) => (
                          <option key={table.id} value={table.id}>Table {table.tableNumber}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {orderMode === "delivery" && (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs text-stone-600">
                  Delivery checkout is not supported by the current order API.
                </div>
              )}

              {orderMode === "pickup" && (
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>
                      Pickup checkout is not supported by the current order API.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search, Diet Filter & Category Tabs */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dietary Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Diets" },
                  { id: "veg", label: "Vegetarian" },
                  { id: "non-veg", label: "Non-Veg" },
                  { id: "vegan", label: "Vegan Only" },
                ].map((diet) => (
                  <button
                    key={diet.id}
                    onClick={() => setDietFilter(diet.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all border ${
                      dietFilter === diet.id
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    {diet.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[{ id: "all", name: "All Items" }, ...categories
                .filter((category) => category.active !== false)
                .map((category) => ({ id: String(category.id), name: category.name }))].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {}
          {menuError ? (
            <div role="alert" className="text-center py-16 bg-white rounded-2xl border border-rose-200 p-8">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">Unable to load menu.</h3>
              <p className="text-xs text-stone-500 mt-1">{menuError}</p>
              <button
                onClick={() => void loadCustomerMenu()}
                className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Retry
              </button>
            </div>
          ) : menuLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading menu">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-80 animate-pulse rounded-2xl bg-white border border-stone-200" />
              ))}
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
              <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">
                {menuItems.length === 0 ? "No menu items available." : "No items match your filters."}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {menuItems.length === 0
                  ? "Please check back later."
                  : "Try resetting your filters or search query."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setDietFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMenuItems.map((item) => {
                const isAvailable = item.available && item.category?.active !== false;
                const countInCart = cart
                  .filter((entry) => entry.menuItem.id === item.id)
                  .reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail with badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                        <MenuItemImage
                          imageUrl={item.imageUrl}
                          name={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          {renderDietBadge(item.dietaryType)}
                        </div>
                        {item.preparationTimeMinutes != null && (
                        <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {item.preparationTimeMinutes} mins
                        </div>
                        )}
                        {!isAvailable && (
                          <span className="absolute bottom-3 left-3 bg-rose-700/90 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition">
                            {item.name}
                          </h3>
                          <span className="text-base font-extrabold text-stone-900">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <span className="text-xs text-stone-400">
                          {item.category?.name ?? "Menu item"}
                        </span>
                        <button
                          onClick={() => handleOpenCustomization(item)}
                          disabled={!isAvailable}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 ${
                            countInCart > 0
                              ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                              : "bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {!isAvailable ? "Unavailable" : countInCart > 0
                            ? `Add Another (${countInCart})`
                            : "Add to Tray"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        <main id="kds" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-white p-5 rounded-2xl shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold tracking-tight">
                  Kitchen Display System & Manager Portal
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Live order queue for orders placed from active table QR codes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="kds-restaurant" className="text-xs text-stone-300">Restaurant</label>
              <select
                id="kds-restaurant"
                value={kdsRestaurantId ?? ""}
                onChange={(event) => setKdsRestaurantId(Number(event.target.value))}
                disabled={restaurants.length === 0}
                className="max-w-40 rounded-lg bg-stone-800 px-2 py-1.5 text-xs text-white"
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                ))}
              </select>
              <button
                onClick={() => kdsRestaurantId !== null && void loadKdsOrders(kdsRestaurantId)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Tickets
              </button>
              <div className="text-right">
                <span className="text-xs font-mono text-amber-400 font-bold block">
                  {orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length} ACTIVE ORDERS
                </span>
                <span className="text-[10px] text-stone-400">
                  Autosync active
                </span>
              </div>
            </div>
          </div>

          {kdsError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {kdsError}
            </div>
          )}

          {kdsLoading && orders.length === 0 && (
            <p className="rounded-xl bg-white p-8 text-center text-stone-600">Loading kitchen orders…</p>
          )}

          {/* Orders Column Layout / Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const statusColors: Record<string, string> = {
                pending: "bg-amber-100 text-amber-800 border-amber-300",
                confirmed: "bg-orange-100 text-orange-800 border-orange-300",
                preparing: "bg-blue-100 text-blue-800 border-blue-300",
                ready: "bg-emerald-100 text-emerald-800 border-emerald-300",
                completed: "bg-stone-100 text-stone-700 border-stone-300",
                cancelled: "bg-red-100 text-red-700 border-red-300",
              };

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border-2 p-4 shadow-sm flex flex-col justify-between transition ${
                    order.status === "pending"
                      ? "border-amber-400 shadow-amber-100 ring-2 ring-amber-400/20"
                      : "border-stone-200"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: ID, Type badge, and timestamp */}
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div>
                        <span className="font-mono text-sm font-extrabold text-stone-900">
                          {order.id}
                        </span>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {order.time}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span className="block text-[10px] font-semibold text-stone-500 mt-1">
                          {order.type === "dine_in"
                            ? `🍽️ ${order.table}`
                            : order.type === "delivery"
                              ? "🛵 Local Delivery"
                              : "🛍️ Pick Up"}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Location Info */}
                    <div className="bg-stone-50 p-2.5 rounded-xl text-xs space-y-1 text-stone-700">
                      <div className="font-semibold text-stone-900">{order.customer}</div>
                      {order.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Phone className="w-3 h-3" /> {order.phone}
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-start gap-1 text-[11px] text-stone-600">
                          <MapPin className="w-3 h-3 shrink-0 text-emerald-600 mt-0.5" />
                          <span>{order.address}</span>
                        </div>
                      )}
                      <div className="text-[11px] font-medium text-stone-500 pt-0.5">
                        Payment status: <span className="font-bold text-stone-800">{order.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        Order Items:
                      </span>
                      <ul className="space-y-1 text-xs">
                        {order.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-start"
                          >
                            <div>
                              <span className="font-bold text-stone-800">
                                {it.qty}x
                              </span>{" "}
                              {it.name}
                              {it.addons && it.addons.length > 0 && (
                                <div className="text-[10px] text-stone-500 italic pl-4">
                                  + {it.addons.join(", ")}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer & Status Progression Buttons */}
                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold text-stone-900">
                      ₹{order.total.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1">
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                          handleUpdateOrderStatus(order.backendId, "confirmed")
                          }
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                        Confirm →
                        </button>
                      )}
                      {order.status === "confirmed" && (
                        <button
                        onClick={() => handleUpdateOrderStatus(order.backendId, "preparing")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                        Start Prep →
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                        onClick={() =>
                          handleUpdateOrderStatus(order.backendId, "ready")
                          }
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          {order.type === "delivery"
                            ? "Dispatch 🛵"
                            : "Ready to Serve 🍽️"}
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.backendId, "completed")
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Complete ✓
                        </button>
                      )}
                      {order.status === "completed" && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="text-[11px] font-bold text-red-600">Cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!kdsLoading && orders.length === 0 && !kdsError && (
            <p className="rounded-xl bg-white p-8 text-center text-stone-600">No restaurant orders yet.</p>
          )}
        </main>
      )}

      {}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="relative h-44 w-full bg-stone-100">
              <MenuItemImage
                imageUrl={customizingItem.imageUrl}
                name={customizingItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setCustomizingItem(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-stone-900">
                    {customizingItem.name}
                  </h3>
                  <span className="text-lg font-extrabold text-amber-700">
                    ₹{customizingItem.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {customizingItem.description || "No description provided."}
                </p>
              </div>
              {(customizingItem.addOns ?? []).some((addOn) => addOn.available) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-stone-900">Add extras</h4>
                  {(customizingItem.addOns ?? []).filter((addOn) => addOn.available).map((addOn) => (
                    <label key={addOn.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                      <span className="flex items-center gap-2 text-sm text-stone-800">
                        <input
                          type="checkbox"
                          checked={selectedAddOnIds.includes(addOn.id)}
                          onChange={(event) => setSelectedAddOnIds((current) =>
                            event.target.checked
                              ? [...current, addOn.id]
                              : current.filter((id) => id !== addOn.id))}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        {addOn.name}
                        {addOn.dietaryType && (
                          <span className="text-xs font-medium text-blue-700">
                            {addOn.dietaryType === "veg" ? "Veg" : "Non-Veg"}
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-stone-800">+₹{addOn.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal CTA Button */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 block">
                  Item Total:
                </span>
                <span className="text-base font-extrabold text-stone-900">
                  ₹{customizationTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleAddToCartWithCustomization}
                disabled={!customizingItem.available || customizingItem.category?.active === false}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
              >
                Confirm & Add to Tray
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-stone-900">Your Order Tray</h3>
                  <span className="text-xs font-mono bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                    {cart.length} unique
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Mode Pill in Cart */}
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs flex items-center justify-between text-amber-900">
                <span>
                  Ordering Type:{" "}
                  <strong>
                    {orderMode === "dine_in"
                      ? `Dine-In (${tableNumber})`
                      : orderMode === "delivery"
                        ? "Local Delivery"
                        : "Pickup"}
                  </strong>
                </span>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                  }}
                  className="text-amber-800 font-bold underline text-[11px]"
                >
                  Edit Mode
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-stone-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Your tray is empty.</p>
                    <p className="text-xs mt-1">
                      Add something appetizing from our menu!
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const menuItem = menuItems.find((entry) => entry.id === item.menuItem.id) ?? item.menuItem;
                    return (
                      <div
                        key={item.cartId}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-stone-900">
                              {menuItem.name}
                            </h4>
                            <p className="text-[11px] text-stone-500">
                              Base ₹{menuItem.price.toFixed(2)} each
                            </p>
                            {item.addOns.length > 0 && (
                              <ul className="pl-2 text-[11px] text-stone-600">
                                {item.addOns.map((addOn) => (
                                  <li key={addOn.id}>+ {addOn.name} ₹{addOn.price.toFixed(2)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <span className="font-extrabold text-xs text-stone-900">
                            ₹{((menuItem.price + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0))
                              * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Incrementer */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                          <span className="text-[11px] text-stone-400">
                            ₹{(menuItem.price + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0)).toFixed(2)} each
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.cartId, -1)
                              }
                              className="w-6 h-6 rounded-md bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-stone-900 w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.cartId, 1)
                              }
                              className="w-6 h-6 rounded-md bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {orderMode === "dine_in" && cart.length > 0 && (
                  <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                    Payment status starts as unpaid
                  </p>
                )}
              </div>

              {/* Drawer Footer Calculations & Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-stone-900">
                        ₹{cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                      <span>Total Due</span>
                      <span className="text-amber-700">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || !selectedTable || orderMode !== "dine_in"}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
                  >
                    <span>
                      {orderMode === "dine_in"
                        ? `Send Order to Kitchen (${tableNumber})`
                        : orderMode === "delivery"
                          ? "Delivery unavailable"
                          : "Pickup unavailable"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {orderError && (
                    <p role="alert" className="text-xs text-rose-700">{orderError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {isOrderPlacedSuccess && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                Order Placed!
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-1">
                Ticket #{lastPlacedOrderId}
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Your order was saved and sent to the kitchen. You can track its status from the order page.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 text-left space-y-1">
              <div className="flex justify-between">
                <span>Table:</span>
                <strong className="text-stone-900">
                  {selectedTable?.tableNumber}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Order status:</span>
                <strong className="text-stone-900 capitalize">
                  Pending
                </strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/order/${lastPlacedOrderId}`)}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
              >
                Track Order
              </button>
              <button
                onClick={() => setIsOrderPlacedSuccess(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-stone-600">
            {restaurant?.name ?? "Restaurant"} • QR Ordering
          </p>
          <p className="text-[11px]">
            Order from the restaurant menu using an active table QR code.
          </p>
        </div>
      </footer>
    </div>
  );
}
