const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: Category;
  restaurant?: Restaurant;
  active?: boolean;
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
}

export const apiService = new ApiService();
