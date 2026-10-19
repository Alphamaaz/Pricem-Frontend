import { api } from "./api";

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
  order: number;
  productCount?: number;
  createdAt?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Mobile Phones", slug: "mobile-phones", icon: "Smartphone", description: "Smartphones, feature phones, cases, and mobile accessories", isActive: true, order: 1 },
  { name: "Laptops & Desktops", slug: "laptops-desktops", icon: "Laptop", description: "Laptops, desktop computers, monitors, parts, and computer accessories", isActive: true, order: 2 },
  { name: "Kids & Toys", slug: "kids-toys", icon: "Baby", description: "Toys, educational games, baby wear, gear, and nursery items", isActive: true, order: 3 },
  { name: "Beauty & Skin Care", slug: "beauty-skincare", icon: "Sparkles", description: "Skincare, cosmetics, hair care, fragrance, and personal hygiene", isActive: true, order: 4 },
  { name: "Equipment & Tools", slug: "equipment-tools", icon: "Wrench", description: "Power tools, hand tools, workshop equipment, generators, and hardware", isActive: true, order: 5 },
  { name: "Electronics & Tech", slug: "electronics", icon: "Headphones", description: "Audio gear, cameras, TV, smart devices, and consumer electronics", isActive: true, order: 6 },
  { name: "Fashion & Apparel", slug: "fashion", icon: "Shirt", description: "Clothing, footwear, bags, watches, and jewelry", isActive: true, order: 7 },
  { name: "Home & Furniture", slug: "home", icon: "HomeIcon", description: "Furniture, home decor, kitchen appliances, and living essentials", isActive: true, order: 8 },
  { name: "Gaming & Consoles", slug: "gaming", icon: "Gamepad2", description: "PlayStation, Xbox, Nintendo consoles, controllers, and game discs", isActive: true, order: 9 },
  { name: "Books & Education", slug: "books", icon: "BookOpen", description: "Textbooks, literature, professional guides, and stationery", isActive: true, order: 10 },
  { name: "General Goods", slug: "other", icon: "Package", description: "Miscellaneous products, general merchandise, and other items", isActive: true, order: 11 },
];

/**
 * Public: Fetch active categories. Falls back to DEFAULT_CATEGORIES if network fails.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await api<{ categories: Category[] }>("/categories");
    if (res?.categories && res.categories.length > 0) {
      return res.categories;
    }
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Super Admin: Fetch all categories (active & inactive) with product count.
 */
export async function getAdminCategories(): Promise<{ categories: Category[] }> {
  try {
    return await api<{ categories: Category[] }>("/categories/admin");
  } catch (err) {
    // If endpoint is not reachable yet, return defaults
    return { categories: DEFAULT_CATEGORIES };
  }
}

/**
 * Super Admin: Create a new category.
 */
export async function createAdminCategory(data: {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}): Promise<{ message: string; category: Category }> {
  return api<{ message: string; category: Category }>("/categories/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Super Admin: Update an existing category.
 */
export async function updateAdminCategory(
  id: string,
  data: Partial<Category>
): Promise<{ message: string; category: Category }> {
  return api<{ message: string; category: Category }>(`/categories/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Super Admin: Delete / deactivate a category.
 */
export async function deleteAdminCategory(
  id: string
): Promise<{ message: string; category?: Category }> {
  return api<{ message: string; category?: Category }>(`/categories/admin/${id}`, {
    method: "DELETE",
  });
}
