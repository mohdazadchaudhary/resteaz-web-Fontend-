"use client";
import React, { useState, useMemo } from "react";
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
  DollarSign,
  CreditCard,
  ShieldCheck,
  Flame,
  Leaf,
  Store,
  Filter,
  Bell,
  RefreshCw,
  ChevronRight,
  Share2,
  ReceiptText,
} from "lucide-react";

const MENU_CATEGORIES = [
  { id: "all", name: "All Items" },
  { id: "starters", name: "Starters & Tapas" },
  { id: "mains", name: "Signature Mains" },
  { id: "woodfire", name: "Wood-Fired Pizzas" },
  { id: "drinks", name: "Beverages & Mocktails" },
  { id: "desserts", name: "Artisan Desserts" },
];

const INITIAL_MENU_ITEMS = [
  {
    id: "m1",
    name: "Truffle Mushroom Bruschetta",
    category: "starters",
    price: 9.5,
    diet: "veg",
    rating: 4.8,
    prepTime: "12 mins",
    image:
      "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80",
    description:
      "Crispy sourdough topped with wild foraged mushrooms, thyme, truffle oil, and shaved parmesan.",
    customizations: [
      { name: "Extra Shaved Parmesan", price: 1.5 },
      { name: "Gluten-Free Bread Base", price: 2.0 },
    ],
    spiceLevels: ["Mild", "Medium"],
  },
  {
    id: "m2",
    name: "Smoked Harissa Chicken Wings",
    category: "starters",
    price: 11.95,
    diet: "non-veg",
    rating: 4.9,
    prepTime: "15 mins",
    image:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
    description:
      "Slow-smoked chicken wings tossed in fiery homemade North African harissa glaze with cooling tzatziki dip.",
    customizations: [
      { name: "Blue Cheese Dip", price: 1.25 },
      { name: "Extra Ranch", price: 1.0 },
    ],
    spiceLevels: ["Medium", "Hot", "Extra Fiery 🔥"],
  },
  {
    id: "m3",
    name: "Charred Margherita Verace",
    category: "woodfire",
    price: 14.5,
    diet: "veg",
    rating: 4.9,
    prepTime: "14 mins",
    image:
      "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
    description:
      "San Marzano DOP tomato sauce, fresh buffalo mozzarella, fresh sweet basil, and extra virgin olive oil.",
    customizations: [
      { name: "Buffalo Mozzarella Stuffed Crust", price: 3.5 },
      { name: "Kalamata Olives & Capers", price: 2.0 },
    ],
    spiceLevels: ["Mild"],
  },
  {
    id: "m4",
    name: "Spicy Pepperoni & Hot Honey",
    category: "woodfire",
    price: 16.5,
    diet: "non-veg",
    rating: 4.95,
    prepTime: "16 mins",
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
    description:
      "Crispy cup-and-char artisan beef pepperoni, crushed chili flakes, and organic chili hot honey drizzle.",
    customizations: [
      { name: "Extra Hot Honey Pot", price: 1.5 },
      { name: "Add Pickled Jalapeños", price: 1.5 },
    ],
    spiceLevels: ["Medium", "Hot"],
  },
  {
    id: "m5",
    name: "Smoked Wagyu Smash Burger",
    category: "mains",
    price: 17.5,
    diet: "non-veg",
    rating: 4.9,
    prepTime: "18 mins",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    description:
      "Double seared wagyu patties, aged cheddar, caramelised shallots, smoked bacon jam, and brioche bun with skin-on fries.",
    customizations: [
      { name: "Truffle Fries Upgrade", price: 3.0 },
      { name: "Fried Pasture Egg", price: 1.75 },
    ],
    spiceLevels: ["Mild", "Medium"],
  },
  {
    id: "m6",
    name: "Pan-Seared Mediterranean Salmon",
    category: "mains",
    price: 21.0,
    diet: "non-veg",
    rating: 4.85,
    prepTime: "20 mins",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
    description:
      "Crispy skin Atlantic salmon over roasted lemon-herb couscous, asparagus spears, and saffron beurre blanc.",
    customizations: [{ name: "Extra Saffron Sauce", price: 2.0 }],
    spiceLevels: ["Mild"],
  },
  {
    id: "m7",
    name: "Buddha Superfood Bowl",
    category: "mains",
    price: 13.5,
    diet: "vegan",
    rating: 4.7,
    prepTime: "10 mins",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    description:
      "Quinoa, organic spiced chickpeas, charred broccolini, sliced avocado, edamame, and tahini-ginger dressing.",
    customizations: [
      { name: "Grilled Herb Tofu", price: 2.5 },
      { name: "Extra Avocado Scoop", price: 2.0 },
    ],
    spiceLevels: ["Mild", "Medium"],
  },
  {
    id: "m8",
    name: "Yuzu Passionfruit Sparkler",
    category: "drinks",
    price: 6.5,
    diet: "vegan",
    rating: 4.8,
    prepTime: "5 mins",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    description:
      "Japanese yuzu citrus, fresh passionfruit pulp, crushed mint leaves, and effervescent sparkling soda.",
    customizations: [
      { name: "Add Boba Pearls", price: 1.0 },
      { name: "Less Sweet / No Sugar", price: 0 },
    ],
    spiceLevels: [],
  },
  {
    id: "m9",
    name: "Valrhona Molten Lava Cake",
    category: "desserts",
    price: 9.0,
    diet: "veg",
    rating: 4.95,
    prepTime: "15 mins",
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    description:
      "Rich dark 70% chocolate warm cake with a molten center, served with Madagascar vanilla bean gelato.",
    customizations: [
      { name: "Double Scoop Gelato", price: 2.5 },
      { name: "Warm Salted Caramel Sauce", price: 1.25 },
    ],
    spiceLevels: [],
  },
];

/* Delivery configuration rules for local area */
const DELIVERY_CONFIG = {
  minOrder: 15.0,
  deliveryFee: 2.99,
  freeDeliveryThreshold: 40.0,
  allowedPincodes: [
    "10001",
    "10002",
    "10003",
    "10004",
    "10005",
    "90210",
    "560001",
    "560034",
    "560102",
  ],
  estimatedDeliveryTime: "30 - 45 mins",
  pickupTime: "15 - 20 mins",
};

type MenuItem = (typeof INITIAL_MENU_ITEMS)[number];
type CartItem = {
  cartId: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSpice: string;
  addons: { name: string; price: number }[];
};
type Order = {
  id: string;
  type: string;
  table?: string | null;
  address?: string | null;
  customer: string;
  phone: string;
  time: string;
  status: string;
  items: { name: string; qty: number; addons: string[] }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
};
type Notification = { message: string; type: "success" | "error" | "info" };

export default function App() {
  // Navigation View: 'customer' or 'kitchen'
  const [activeView, setActiveView] = useState("customer");

  // Ordering mode: 'dine_in' | 'delivery' | 'pickup'
  const [orderMode, setOrderMode] = useState("dine_in");

  // Table for Dine-In
  const [tableNumber, setTableNumber] = useState("Table 4");
  const [showQRSimulator, setShowQRSimulator] = useState(false);

  // Delivery details
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "Alex Morgan",
    phone: "+1 (555) 234-5678",
    pincode: "10001",
    address: "Apt 4B, 142 Riverfront Ave",
    instructions: "Ring doorbell, leave with front concierge if unavailable.",
  });

  // Menu, Search & Filter
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dietFilter, setDietFilter] = useState("all"); // 'all', 'veg', 'non-veg', 'vegan'
  const [searchQuery, setSearchQuery] = useState("");

  // Cart Management
  const [cart, setCart] = useState<CartItem[]>([
    {
      cartId: "item-demo-1",
      id: "m1",
      name: "Truffle Mushroom Bruschetta",
      price: 9.5,
      quantity: 1,
      selectedSpice: "Mild",
      addons: [{ name: "Extra Shaved Parmesan", price: 1.5 }],
    },
    {
      cartId: "item-demo-2",
      id: "m3",
      name: "Charred Margherita Verace",
      price: 14.5,
      quantity: 1,
      selectedSpice: "Mild",
      addons: [],
    },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customization Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSpice, setSelectedSpice] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);

  // Live Orders for Kitchen / Manager View
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-8941",
      type: "dine_in",
      table: "Table 2",
      customer: "Sarah Jenkins",
      phone: "+1 (555) 902-1123",
      time: "12 mins ago",
      status: "preparing", // pending, preparing, ready, completed
      items: [
        {
          name: "Smoked Wagyu Smash Burger",
          qty: 2,
          addons: ["Truffle Fries Upgrade"],
        },
        { name: "Yuzu Passionfruit Sparkler", qty: 2, addons: [] },
      ],
      total: 44.0,
      paymentMethod: "Pay at Counter",
      paymentStatus: "Unpaid",
    },
    {
      id: "ORD-8940",
      type: "delivery",
      address: "74 Greenfield Terrace, Apt 12, Pincode: 10001",
      customer: "David Chen",
      phone: "+1 (555) 887-3401",
      time: "24 mins ago",
      status: "ready", // Out for delivery
      items: [
        { name: "Charred Margherita Verace", qty: 1, addons: [] },
        {
          name: "Smoked Harissa Chicken Wings",
          qty: 1,
          addons: ["Blue Cheese Dip"],
        },
      ],
      total: 29.7,
      paymentMethod: "UPI / Online Card",
      paymentStatus: "Paid",
    },
  ]);

  // Alert / Toast Notification state
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: Notification["type"] = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3800);
  };

  const isPincodeEligible =
    orderMode !== "delivery" ||
    DELIVERY_CONFIG.allowedPincodes.includes(deliveryDetails.pincode.trim());

  const filteredMenuItems = useMemo(() => {
    return INITIAL_MENU_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesDiet = dietFilter === "all" || item.diet === dietFilter;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesDiet && matchesSearch;
    });
  }, [selectedCategory, dietFilter, searchQuery]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce(
        (aSum, add) => aSum + add.price,
        0,
      );
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (orderMode !== "delivery") return 0;
    if (cartSubtotal >= DELIVERY_CONFIG.freeDeliveryThreshold) return 0;
    return DELIVERY_CONFIG.deliveryFee;
  }, [orderMode, cartSubtotal]);

  const tax = cartSubtotal * 0.08; // 8% sales tax
  const grandTotal = cartSubtotal + deliveryFee + tax;
  const cartItemCount = cart.reduce((count, i) => count + i.quantity, 0);

  const handleOpenCustomization = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedSpice(item.spiceLevels.length > 0 ? item.spiceLevels[0] : "");
    setSelectedAddons([]);
  };

  const handleAddToCartWithCustomization = () => {
    if (!customizingItem) return;
    const cartItemId = `${customizingItem.id}-${Date.now()}`;
    const newItem = {
      cartId: cartItemId,
      id: customizingItem.id,
      name: customizingItem.name,
      price: customizingItem.price,
      quantity: 1,
      selectedSpice: selectedSpice,
      addons: selectedAddons,
    };

    setCart((prev) => [...prev, newItem]);
    setCustomizingItem(null);
    showNotification(
      `Added "${customizingItem.name}" to your tray!`,
      "success",
    );
  };

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

  const [selectedPayment, setSelectedPayment] = useState("counter");
  const [isOrderPlacedSuccess, setIsOrderPlacedSuccess] = useState(false);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState("");

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      showNotification("Your tray is empty!", "error");
      return;
    }

    if (orderMode === "delivery") {
      if (!isPincodeEligible) {
        showNotification(
          "Delivery is not available in your pincode area.",
          "error",
        );
        return;
      }
      if (cartSubtotal < DELIVERY_CONFIG.minOrder) {
        showNotification(
          `Minimum delivery order is $${DELIVERY_CONFIG.minOrder.toFixed(2)}`,
          "error",
        );
        return;
      }
      if (
        !deliveryDetails.name ||
        !deliveryDetails.phone ||
        !deliveryDetails.address
      ) {
        showNotification(
          "Please fill in complete delivery contact and address details",
          "error",
        );
        return;
      }
    }

    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderRecord = {
      id: newId,
      type: orderMode,
      table: orderMode === "dine_in" ? tableNumber : null,
      address:
        orderMode === "delivery"
          ? `${deliveryDetails.address}, Pincode: ${deliveryDetails.pincode}`
          : null,
      customer: deliveryDetails.name || "Guest User",
      phone: deliveryDetails.phone || "N/A",
      time: "Just now",
      status: "pending",
      items: cart.map((i) => ({
        name: i.name,
        qty: i.quantity,
        addons: i.addons.map((a) => a.name),
      })),
      total: grandTotal,
      paymentMethod:
        selectedPayment === "counter"
          ? orderMode === "dine_in"
            ? "Pay at Counter / Waiter"
            : "Cash on Delivery"
          : "Instant Card / UPI",
      paymentStatus: selectedPayment === "counter" ? "Unpaid" : "Paid Online",
    };

    // Push into real-time orders list for kitchen
    setOrders((prev) => [newOrderRecord, ...prev]);
    setLastPlacedOrderId(newId);
    setCart([]);
    setIsCartOpen(false);
    setIsOrderPlacedSuccess(true);
    showNotification(
      `Order ${newId} confirmed and sent to kitchen!`,
      "success",
    );
  };

  /* Handler for manager updating order status */
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      }),
    );
    showNotification(
      `Order ${orderId} updated to ${newStatus.toUpperCase()}`,
      "info",
    );
  };

  const renderDietBadge = (diet: string) => {
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
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
        <Flame className="w-3 h-3 text-rose-500" /> Non-Veg
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
                    Maison & Ember
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Live
                  </span>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block">
                  Woodfire Kitchen & Artisan Pantry
                </p>
              </div>
            </div>

            {/* View Switcher (Customer vs Kitchen/Manager) */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-medium">
              <button
                onClick={() => setActiveView("customer")}
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
                onClick={() => setActiveView("kitchen")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative ${
                  activeView === "kitchen"
                    ? "bg-stone-900 text-white shadow-sm font-semibold"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Kitchen Display
                {orders.filter((o) => o.status === "pending").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                )}
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
                  Test how customers experience instant table detection
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                "Table 1",
                "Table 2",
                "Table 4",
                "Table 7 (Patio)",
                "Bar Counter 2",
              ].map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => {
                    setOrderMode("dine_in");
                    setTableNumber(tbl);
                    showNotification(
                      `Scanned QR! Switched to Dine-In: ${tbl}`,
                      "success",
                    );
                  }}
                  className={`px-2.5 py-1 rounded border text-xs transition ${
                    tableNumber === tbl && orderMode === "dine_in"
                      ? "bg-amber-400 text-stone-900 font-bold border-amber-300"
                      : "bg-amber-800/60 hover:bg-amber-700 text-amber-200 border-amber-700"
                  }`}
                >
                  {tbl}
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
                  Dine-in with table QR order, or enjoy rapid delivery in your
                  local neighborhood.
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
                        Orders print directly to kitchen line
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-stone-600">
                      Change Table:
                    </label>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="bg-white border border-stone-300 text-stone-900 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
                    >
                      <option value="Table 1">Table 1 (Indoor)</option>
                      <option value="Table 2">Table 2 (Window)</option>
                      <option value="Table 4">Table 4 (Booth)</option>
                      <option value="Table 7 (Patio)">Table 7 (Patio)</option>
                      <option value="Bar Counter 2">Bar Counter 2</option>
                    </select>
                  </div>
                </div>
              )}

              {orderMode === "delivery" && (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-stone-800">
                        Delivery to Pincode / Postal Code:
                      </span>
                      <input
                        type="text"
                        value={deliveryDetails.pincode}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            pincode: e.target.value,
                          })
                        }
                        className="bg-white border border-stone-300 rounded px-2 py-0.5 text-xs font-mono font-bold w-24 text-center focus:outline-amber-500"
                        placeholder="e.g. 10001"
                      />
                      {isPincodeEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Serviceable Area
                          (30-45m)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Outside Local
                          Radius
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Minimum order:{" "}
                      <strong className="text-stone-800">
                        ${DELIVERY_CONFIG.minOrder.toFixed(2)}
                      </strong>{" "}
                      | Free over $
                      {DELIVERY_CONFIG.freeDeliveryThreshold.toFixed(2)}
                    </div>
                  </div>
                  {!isPincodeEligible && (
                    <p className="text-[11px] text-rose-600">
                      Try testing one of our serviced area pincodes:{" "}
                      <code className="font-bold bg-rose-50 px-1 py-0.5 rounded">
                        10001
                      </code>
                      ,{" "}
                      <code className="font-bold bg-rose-50 px-1 py-0.5 rounded">
                        10002
                      </code>
                      , or{" "}
                      <code className="font-bold bg-rose-50 px-1 py-0.5 rounded">
                        560001
                      </code>
                      .
                    </p>
                  )}
                </div>
              )}

              {orderMode === "pickup" && (
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>
                      Estimated pickup ready time:{" "}
                      <strong>15 - 20 minutes</strong> from order confirmation.
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-stone-500">
                    Pickup Counter at Front Deck
                  </span>
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
              {MENU_CATEGORIES.map((cat) => (
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
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
              <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">
                No delicious items match your search
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Try resetting your filters or search query to explore our
                complete culinary offerings.
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
                const countInCart = cart
                  .filter((c) => c.id === item.id)
                  .reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail with badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          {renderDietBadge(item.diet)}
                        </div>
                        <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {item.prepTime}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition">
                            {item.name}
                          </h3>
                          <span className="text-base font-extrabold text-stone-900">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.customizations.length > 0 && (
                          <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Add-ons & spice levels customizable
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <span className="text-xs text-stone-400">
                          ★ {item.rating} Rating
                        </span>
                        <button
                          onClick={() => handleOpenCustomization(item)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            countInCart > 0
                              ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                              : "bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {countInCart > 0
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-white p-5 rounded-2xl shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold tracking-tight">
                  Kitchen Display System & Manager Portal
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Live order queue for Table QR scans and neighborhood delivery
                orders.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  showNotification("Ticket queue refreshed", "info")
                }
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Tickets
              </button>
              <div className="text-right">
                <span className="text-xs font-mono text-amber-400 font-bold block">
                  {orders.length} ACTIVE ORDERS
                </span>
                <span className="text-[10px] text-stone-400">
                  Autosync active
                </span>
              </div>
            </div>
          </div>

          {/* Orders Column Layout / Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const statusColors: Record<string, string> = {
                pending: "bg-amber-100 text-amber-800 border-amber-300",
                preparing: "bg-blue-100 text-blue-800 border-blue-300",
                ready: "bg-emerald-100 text-emerald-800 border-emerald-300",
                completed: "bg-stone-100 text-stone-700 border-stone-300",
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
                      <div className="font-semibold text-stone-900">
                        {order.customer}
                      </div>
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
                        Payment:{" "}
                        <span className="font-bold text-stone-800">
                          {order.paymentMethod}
                        </span>{" "}
                        ({order.paymentStatus})
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
                      ${order.total.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1">
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, "preparing")
                          }
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Start Prep →
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, "ready")
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
                            handleUpdateOrderStatus(order.id, "completed")
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="relative h-44 w-full bg-stone-100">
              <img
                src={customizingItem.image}
                alt={customizingItem.name}
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
                    ${customizingItem.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {customizingItem.description}
                </p>
              </div>

              {/* Spice level options if applicable */}
              {customizingItem.spiceLevels.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Choose Spice Level:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {customizingItem.spiceLevels.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedSpice(lvl)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          selectedSpice === lvl
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Addons */}
              {customizingItem.customizations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Chef Customizations & Extras:
                  </label>
                  <div className="space-y-2">
                    {customizingItem.customizations.map((addon) => {
                      const isChecked = selectedAddons.some(
                        (a) => a.name === addon.name,
                      );
                      return (
                        <label
                          key={addon.name}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? "bg-amber-50/70 border-amber-300"
                              : "bg-stone-50 border-stone-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddons([...selectedAddons, addon]);
                                } else {
                                  setSelectedAddons(
                                    selectedAddons.filter(
                                      (a) => a.name !== addon.name,
                                    ),
                                  );
                                }
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span className="font-medium text-stone-800">
                              {addon.name}
                            </span>
                          </div>
                          <span className="font-bold text-stone-900">
                            +${addon.price.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
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
                  $
                  {(
                    customizingItem.price +
                    selectedAddons.reduce((sum, a) => sum + a.price, 0)
                  ).toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleAddToCartWithCustomization}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition"
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
                    const addonSum = item.addons.reduce(
                      (acc, a) => acc + a.price,
                      0,
                    );
                    const itemUnitTotal = item.price + addonSum;

                    return (
                      <div
                        key={item.cartId}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-stone-900">
                              {item.name}
                            </h4>
                            {item.selectedSpice && (
                              <span className="text-[11px] text-amber-700 font-medium block">
                                Spice: {item.selectedSpice}
                              </span>
                            )}
                            {item.addons.length > 0 && (
                              <p className="text-[11px] text-stone-500">
                                Extras:{" "}
                                {item.addons.map((a) => a.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="font-extrabold text-xs text-stone-900">
                            ${(itemUnitTotal * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Incrementer */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                          <span className="text-[11px] text-stone-400">
                            ${itemUnitTotal.toFixed(2)} each
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

                {/* Delivery Form (If in Delivery Mode) */}
                {orderMode === "delivery" && cart.length > 0 && (
                  <div className="mt-4 p-3 bg-stone-100/70 rounded-xl border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />{" "}
                        Delivery Address Details
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Recipient Full Name"
                        value={deliveryDetails.name}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Contact Phone Number"
                        value={deliveryDetails.phone}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            phone: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Street address, building, apartment"
                        value={deliveryDetails.address}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Delivery notes or gate entry codes"
                        value={deliveryDetails.instructions}
                        onChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            instructions: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Option Selector */}
                {cart.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-xs font-bold text-stone-700 block">
                      Select Payment Method:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedPayment("counter")}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                          selectedPayment === "counter"
                            ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                            : "bg-stone-50 border-stone-200 text-stone-600"
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {orderMode === "dine_in"
                            ? "Pay at Counter"
                            : "Cash / COD"}
                        </span>
                      </button>
                      <button
                        onClick={() => setSelectedPayment("online")}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                          selectedPayment === "online"
                            ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                            : "bg-stone-50 border-stone-200 text-stone-600"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Instant Card / UPI</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Calculations & Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-stone-900">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    {orderMode === "delivery" && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-stone-900">
                          {deliveryFee === 0 ? (
                            <span className="text-emerald-600 font-bold">
                              FREE
                            </span>
                          ) : (
                            `$${deliveryFee.toFixed(2)}`
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taxes (8%)</span>
                      <span className="font-semibold text-stone-900">
                        ${tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                      <span>Total Due</span>
                      <span className="text-amber-700">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
                  >
                    <span>
                      {orderMode === "dine_in"
                        ? `Send Order to Kitchen (${tableNumber})`
                        : orderMode === "delivery"
                          ? "Place Delivery Order"
                          : "Confirm Takeaway Order"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
                Order Confirmed!
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-1">
                Ticket #{lastPlacedOrderId}
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                {orderMode === "dine_in"
                  ? `Your ticket was sent to the kitchen station for ${tableNumber}. Your chef is on it!`
                  : `Your local delivery order is being prepared and will arrive within 30-45 minutes.`}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 text-left space-y-1">
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <strong className="text-stone-900">
                  {orderMode === "dine_in" ? "12 - 18 Mins" : "30 - 45 Mins"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Service Mode:</span>
                <strong className="text-stone-900 capitalize">
                  {orderMode.replace("_", " ")}
                </strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsOrderPlacedSuccess(false);
                  setActiveView("kitchen");
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
              >
                View in KDS
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
            Maison & Ember • QR Ordering & Neighborhood Delivery Engine
          </p>
          <p className="text-[11px]">
            Designed for instant browser-based table ordering, contactless
            menus, and local dispatching.
          </p>
        </div>
      </footer>
    </div>
  );
}
