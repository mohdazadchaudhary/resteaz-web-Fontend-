const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function resolveImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, API_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

export interface Restaurant {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  active?: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  dietaryType?: 'veg' | 'non-veg' | 'vegan' | null;
  preparationTimeMinutes?: number | null;
  available: boolean;
  category?: Category;
  restaurant?: Restaurant;
  addOns?: AddOn[];
}

export interface AddOn {
  id: number;
  name: string;
  description?: string;
  price: number;
  dietaryType?: 'veg' | 'non-veg' | null;
  available: boolean;
}

export interface AddOnRequest {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  dietaryType?: 'veg' | 'non-veg' | '';
  available?: boolean;
}

export interface Table {
  id: number;
  tableNumber: string;
  qrToken: string;
  active: boolean;
  restaurant: Restaurant;
}

export interface TableRequest {
  restaurantId: number;
  tableNumber: string;
}

export interface TableStatusRequest {
  active: boolean;
}

export interface CategoryRequest {
  name: string;
}

export interface CategoryStatusRequest {
  active: boolean;
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  dietaryType?: 'veg' | 'non-veg' | 'vegan' | '';
  preparationTimeMinutes?: number;
  categoryId: number;
  available: boolean;
  addOns?: AddOnRequest[];
}

export interface MenuItemAvailabilityRequest {
  available: boolean;
}

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  addOns?: { addOnId: number; quantity: number }[];
}

export interface OrderRequest {
  qrToken: string;
  idempotencyKey: string;
  restaurantId: number;
  tableId: number;
  customerName?: string;
  customerPhone?: string;
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addOns: OrderItemAddOnResponse[];
}

export interface OrderItemAddOnResponse {
  addOnId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  restaurantId: number;
  tableId: number;
  tableNumber: string;
  status: string;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Table APIs
  async getAllTables(): Promise<Table[]> {
    return this.request<Table[]>('/api/tables');
  }

  async createTable(request: TableRequest): Promise<Table> {
    return this.request<Table>('/api/tables', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTableByQrToken(qrToken: string): Promise<Table> {
    return this.request<Table>(`/api/tables/${qrToken}`);
  }

  async updateTableStatus(id: number, request: TableStatusRequest): Promise<Table> {
    return this.request<Table>(`/api/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Restaurant APIs
  async getRestaurants(): Promise<Restaurant[]> {
    return this.request<Restaurant[]>('/api/restaurants');
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    return this.request<Restaurant>(`/api/restaurants/${id}`);
  }

  // Menu APIs
  async getMenu(): Promise<MenuItem[]> {
    return this.request<MenuItem[]>('/api/menu');
  }

  // Category APIs
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  async createCategory(request: CategoryRequest): Promise<Category> {
    return this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateCategory(id: number, request: CategoryRequest): Promise<Category> {
    return this.request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async updateCategoryStatus(id: number, request: CategoryStatusRequest): Promise<Category> {
    return this.request<Category>(`/api/categories/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Menu Item APIs
  async getMenuItemById(id: number): Promise<MenuItem> {
    return this.request<MenuItem>(`/api/menu/${id}`);
  }

  async getAddOns(): Promise<AddOn[]> {
    return this.request<AddOn[]>('/api/add-ons');
  }

  async createAddOn(request: AddOnRequest): Promise<AddOn> {
    return this.request<AddOn>('/api/add-ons', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateAddOn(id: number, request: AddOnRequest): Promise<AddOn> {
    return this.request<AddOn>(`/api/add-ons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async uploadMenuImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/menu/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createMenuItem(request: MenuItemRequest): Promise<MenuItem> {
    return this.request<MenuItem>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateMenuItem(id: number, request: MenuItemRequest): Promise<MenuItem> {
    return this.request<MenuItem>(`/api/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteMenuItem(id: number): Promise<void> {
    return this.request<void>(`/api/menu/${id}`, {
      method: 'DELETE',
    });
  }

  async updateMenuItemAvailability(id: number, request: MenuItemAvailabilityRequest): Promise<MenuItem> {
    return this.request<MenuItem>(`/api/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Order APIs
  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrderById(id: number): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/orders/${id}`);
  }

  async getRestaurantOrders(restaurantId: number): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>(`/api/orders/restaurant/${restaurantId}`);
  }

  async getTableOrders(tableId: number): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>(`/api/orders/table/${tableId}`);
  }

  async updateOrderStatus(id: number, status: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(id: number): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/orders/${id}/cancel`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
