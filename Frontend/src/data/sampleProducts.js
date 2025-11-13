// Sample product and category data used across the buyer experience.
// This mirrors the backend Product and Category schemas closely so that
// the UI can be wired up to actual API data later with minimal changes.

export const categories = [
  { _id: "all", name: "All", slug: "all" },
  { _id: "507f191e810c19729de860ea", name: "Electronics", slug: "electronics" },
  { _id: "507f191e810c19729de860eb", name: "Clothing", slug: "clothing" },
  { _id: "507f191e810c19729de860ec", name: "Food & Beverages", slug: "food-beverages" },
  { _id: "507f191e810c19729de860ed", name: "Accessories", slug: "accessories" }
];

export const sampleProducts = [
  {
    _id: "507f1f77bcf86cd799439011",
    sellerId: "507f191e810c19729de860ea",
    title: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    description:
      "High-quality wireless Bluetooth headphones with noise cancellation and 20-hour battery life.",
    categoryId: "507f191e810c19729de860ea",
    category: {
      _id: "507f191e810c19729de860ea",
      name: "Electronics",
      slug: "electronics"
    },
    price: 1299,
    currency: "INR",
    stock: 45,
    condition: "new",
    tags: ["wireless", "bluetooth", "audio"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/headphones-1",
        isPrimary: true
      }
    ],
    specs: {
      Brand: "AudioTech",
      Connectivity: "Bluetooth 5.0",
      Battery: "20 hours",
      Weight: "180g"
    },
    ratingAvg: 4.5,
    ratingCount: 128,
    isDeleted: false,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439012",
    sellerId: "507f191e810c19729de860ea",
    title: "Smart Fitness Watch",
    slug: "smart-fitness-watch",
    description:
      "Advanced fitness tracking smartwatch with heart rate monitor, GPS, and water resistance.",
    categoryId: "507f191e810c19729de860ea",
    category: {
      _id: "507f191e810c19729de860ea",
      name: "Electronics",
      slug: "electronics"
    },
    price: 2499,
    currency: "INR",
    stock: 12,
    condition: "new",
    tags: ["fitness", "smartwatch", "wearable"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/watch-1",
        isPrimary: true
      }
    ],
    specs: {
      Brand: "FitTech",
      Display: "1.4 inch AMOLED",
      Battery: "7 day backup",
      Sensors: "Heart rate, SpO2, GPS"
    },
    ratingAvg: 4.8,
    ratingCount: 89,
    isDeleted: false,
    createdAt: "2024-01-02T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439013",
    sellerId: "507f191e810c19729de860eb",
    title: "Organic Cotton T-Shirt",
    slug: "organic-cotton-t-shirt",
    description:
      "100% organic cotton t-shirt, comfortable, breathable, and eco-friendly everyday wear.",
    categoryId: "507f191e810c19729de860eb",
    category: {
      _id: "507f191e810c19729de860eb",
      name: "Clothing",
      slug: "clothing"
    },
    price: 399,
    currency: "INR",
    stock: 3,
    condition: "new",
    tags: ["organic", "cotton", "casual"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/tshirt-1",
        isPrimary: true
      }
    ],
    specs: {
      Material: "100% Organic Cotton",
      Sizes: "M, L, XL",
      Care: "Machine wash cold"
    },
    ratingAvg: 4.2,
    ratingCount: 45,
    isDeleted: false,
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-17T10:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439014",
    sellerId: "507f191e810c19729de860ec",
    title: "Premium Coffee Beans",
    slug: "premium-coffee-beans",
    description:
      "Premium quality Arabica coffee beans from Karnataka with a balanced medium roast profile.",
    categoryId: "507f191e810c19729de860ec",
    category: {
      _id: "507f191e810c19729de860ec",
      name: "Food & Beverages",
      slug: "food-beverages"
    },
    price: 349,
    currency: "INR",
    stock: 28,
    condition: "new",
    tags: ["coffee", "premium", "organic"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/coffee-1",
        isPrimary: true
      }
    ],
    specs: {
      Origin: "Chikkamagaluru, Karnataka",
      Weight: "500g",
      Roast: "Medium",
      Notes: "Caramel, chocolate, nuts"
    },
    ratingAvg: 4.7,
    ratingCount: 67,
    isDeleted: false,
    createdAt: "2024-01-04T10:00:00Z",
    updatedAt: "2024-01-18T10:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439015",
    sellerId: "507f191e810c19729de860ea",
    title: "Wired Studio Headphones",
    slug: "wired-studio-headphones",
    description:
      "Professional studio-grade wired headphones designed for precision audio monitoring.",
    categoryId: "507f191e810c19729de860ea",
    category: {
      _id: "507f191e810c19729de860ea",
      name: "Electronics",
      slug: "electronics"
    },
    price: 899,
    currency: "INR",
    stock: 0,
    condition: "new",
    tags: ["wired", "audio", "headphones"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/headphone-wired-1",
        isPrimary: true
      }
    ],
    specs: {
      Brand: "SoundMax",
      Type: "Over-ear",
      CableLength: "1.2m",
      Impedance: "32Ω"
    },
    ratingAvg: 4.3,
    ratingCount: 34,
    isDeleted: false,
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-19T10:00:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439016",
    sellerId: "507f191e810c19729de860ed",
    title: "Handcrafted Leather Wallet",
    slug: "handcrafted-leather-wallet",
    description:
      "Genuine leather wallet with handcrafted stitching, RFID protection, and multiple card slots.",
    categoryId: "507f191e810c19729de860ed",
    category: {
      _id: "507f191e810c19729de860ed",
      name: "Accessories",
      slug: "accessories"
    },
    price: 1199,
    currency: "INR",
    stock: 15,
    condition: "new",
    tags: ["leather", "wallet", "handmade"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
        publicId: "Market-Connect/Products/wallet-1",
        isPrimary: true
      }
    ],
    specs: {
      Material: "Genuine Leather",
      Color: "Brown",
      Slots: "6 card slots",
      Lining: "Polyester"
    },
    ratingAvg: 4.6,
    ratingCount: 23,
    isDeleted: false,
    createdAt: "2024-01-06T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z"
  }
];

export const getProductById = (id) =>
  sampleProducts.find((product) => product._id === id);

export const getProductBySlug = (slug) =>
  sampleProducts.find((product) => product.slug === slug);
