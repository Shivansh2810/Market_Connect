import React, { useState } from 'react';
import './dashboard.css';
import Profile from '../profile/Profile';
import ProductDetail from './ProductDetail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faShoppingCart, 
    faUser, 
    faFilter,
    faStar,
    faChevronDown,
    faBars,
    faTimes,
    faHome,
    faShoppingBag,
    faBell,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

// Sample product data - Matching backend Product model structure exactly
// Backend Product model: sellerId, title, slug, description, categoryId, tags, images, price, currency, stock, condition, specs, ratingAvg, ratingCount, isDeleted
const sampleProducts = [
    {
        _id: "507f1f77bcf86cd799439011",
        sellerId: "507f191e810c19729de860ea",
        title: "Wireless Bluetooth Headphones",
        slug: "wireless-bluetooth-headphones",
        description: "High-quality wireless Bluetooth headphones with noise cancellation and 20-hour battery life.",
        categoryId: "507f191e810c19729de860ea", // ObjectId reference to Category
        category: { // Populated category data (as returned by backend with populate)
            _id: "507f191e810c19729de860ea",
            name: "Electronics",
            slug: "electronics"
        },
        price: 1299,
        currency: "INR",
        stock: 45,
        condition: "new", // enum: ["new", "used", "refurbished"]
        tags: ["wireless", "bluetooth", "audio"],
        images: [
            {
                url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/headphones-1",
                isPrimary: true
            }
        ],
        specs: { // Backend uses Map type, but JSON serializes to object
            "Brand": "AudioTech",
            "Connectivity": "Bluetooth 5.0",
            "Battery": "20 hours"
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
        description: "Advanced fitness tracking smartwatch with heart rate monitor and GPS.",
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
                url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/watch-1",
                isPrimary: true
            }
        ],
        specs: {
            "Brand": "FitTech",
            "Display": "1.4 inch",
            "Battery": "7 days"
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
        description: "100% organic cotton t-shirt, comfortable and eco-friendly.",
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
                url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/tshirt-1",
                isPrimary: true
            }
        ],
        specs: {
            "Material": "100% Organic Cotton",
            "Size": "M, L, XL",
            "Color": "White"
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
        description: "Premium quality coffee beans from Karnataka, medium roast.",
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
                url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/coffee-1",
                isPrimary: true
            }
        ],
        specs: {
            "Origin": "Karnataka",
            "Weight": "500g",
            "Roast": "Medium"
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
        title: "Wired Headphone",
        slug: "wired-headphone",
        description: "High-quality wired headphones with excellent sound quality.",
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
                url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/headphone-wired-1",
                isPrimary: true
            }
        ],
        specs: {
            "Brand": "SoundMax",
            "Type": "Wired",
            "Length": "1.2m"
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
        title: "Leather Wallet",
        slug: "leather-wallet",
        description: "Genuine leather wallet with multiple card slots and cash compartment.",
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
        tags: ["leather", "wallet", "accessories"],
        images: [
            {
                url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
                publicId: "Market-Connect/Products/wallet-1",
                isPrimary: true
            }
        ],
        specs: {
            "Material": "Genuine Leather",
            "Color": "Brown",
            "Slots": "6 card slots"
        },
        ratingAvg: 4.6,
        ratingCount: 23,
        isDeleted: false,
        createdAt: "2024-01-06T10:00:00Z",
        updatedAt: "2024-01-20T10:00:00Z"
    }
];

// Categories matching backend Category model: name, slug, parentId
const categories = [
    { _id: "all", name: "All", slug: "all" },
    { _id: "507f191e810c19729de860ea", name: "Electronics", slug: "electronics" },
    { _id: "507f191e810c19729de860eb", name: "Clothing", slug: "clothing" },
    { _id: "507f191e810c19729de860ec", name: "Food & Beverages", slug: "food-beverages" },
    { _id: "507f191e810c19729de860ed", name: "Accessories", slug: "accessories" }
];

const BuyerDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [sortBy, setSortBy] = useState('popularity');
    const [priceRange, setPriceRange] = useState([0, 3000]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Helper function to get primary image URL
    const getPrimaryImage = (product) => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : product.images[0].url;
        }
        return '';
    };

    // Helper function to convert specs Map to object for display
    // Backend Product model uses Map type for specs, frontend converts to object
    const getSpecsObject = (specs) => {
        if (!specs) return {};
        if (specs instanceof Map) {
            const obj = {};
            specs.forEach((value, key) => {
                obj[key] = value;
            });
            return obj;
        }
        return specs; // Already an object
    };

    // Filter products based on search and category
    // Backend returns products with populated category (category.name)
    const filteredProducts = sampleProducts.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || 
                               (product.category && product.category.name === selectedCategory) ||
                               (product.categoryId === selectedCategory);
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        const notDeleted = !product.isDeleted; // Backend filters out deleted products
        return matchesSearch && matchesCategory && matchesPrice && notDeleted;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.ratingAvg - a.ratingAvg;
            case 'popularity':
            default:
                return b.ratingCount - a.ratingCount;
        }
    });

    // Add to cart function - matches backend cartSchema structure
    // Backend cartSchema: { productId (ObjectId ref Product), quantity, price, addedAt, _id }
    // Backend cartController.addToCart expects: { productId, quantity }
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product._id);
        if (existingItem) {
            setCart(cart.map(item => 
                item.productId === product._id 
                    ? { 
                        ...item, 
                        quantity: item.quantity + 1,
                        price: product.price // Update price in case it changed
                    }
                    : item
            ));
        } else {
            // Create cart item matching backend cartSchema
            const newCartItem = {
                _id: `cart_${Date.now()}`, // Temporary ID for frontend
                productId: product._id, // ObjectId reference
                quantity: 1,
                price: product.price, // Required field in backend
                addedAt: new Date().toISOString(),
                // Keep product details for display (not sent to backend)
                productDetails: {
                    title: product.title,
                    price: product.price,
                    currency: product.currency,
                    image: getPrimaryImage(product)
                }
            };
            setCart([...cart, newCartItem]);
        }
        // Open cart drawer
        setIsCartOpen(true);
    };

    // Buy now function - adds to cart and shows checkout
    // Matches backend cartSchema structure
    const buyNow = (product) => {
        // Clear cart and add only this product
        const newCartItem = {
            _id: `cart_${Date.now()}`,
            productId: product._id,
            quantity: 1,
            price: product.price,
            addedAt: new Date().toISOString(),
            productDetails: {
                title: product.title,
                price: product.price,
                currency: product.currency,
                image: getPrimaryImage(product)
            }
        };
        setCart([newCartItem]);
        // Open cart drawer
        setIsCartOpen(true);
    };

    // Remove item from cart function
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Update quantity function - matches backend cartController.updateCartItem
    // Backend expects: { quantity } in body, itemId in params
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item => 
                item.productId === productId 
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    // Calculate cart total - matches backend cartController.getCart response structure
    // Backend returns: { items: [...], summary: { subtotal, totalItems, totalItemsCount } }
    const cartTotal = cart.reduce((total, item) => {
        // Backend cart item has price field directly
        const price = item.price || item.productDetails?.price || 0;
        return total + (price * item.quantity);
    }, 0);

    // Render profile page if currentView is 'profile'
    if (currentView === 'profile') {
        return <Profile onBack={() => setCurrentView('dashboard')} />;
    }

    // Render product detail page if currentView is 'productDetail'
    if (currentView === 'productDetail' && selectedProduct) {
        return (
            <ProductDetail 
                product={selectedProduct}
                onBack={() => {
                    setCurrentView('dashboard');
                    setSelectedProduct(null);
                }}
                onAddToCart={(product, quantity) => {
                    const existingItem = cart.find(item => item.productId === product._id);
                    if (existingItem) {
                        setCart(cart.map(item => 
                            item.productId === product._id 
                                ? { 
                                    ...item, 
                                    quantity: item.quantity + quantity,
                                    price: product.price
                                }
                                : item
                        ));
                    } else {
                        const newCartItem = {
                            _id: `cart_${Date.now()}`,
                            productId: product._id,
                            quantity,
                            price: product.price,
                            addedAt: new Date().toISOString(),
                            productDetails: {
                                title: product.title,
                                price: product.price,
                                currency: product.currency,
                                image: getPrimaryImage(product)
                            }
                        };
                        setCart([...cart, newCartItem]);
                    }
                    setIsCartOpen(true);
                    setCurrentView('dashboard');
                    setSelectedProduct(null);
                }}
                onBuyNow={(product, quantity) => {
                    const newCartItem = {
                        _id: `cart_${Date.now()}`,
                        productId: product._id,
                        quantity,
                        price: product.price,
                        addedAt: new Date().toISOString(),
                        productDetails: {
                            title: product.title,
                            price: product.price,
                            currency: product.currency,
                            image: getPrimaryImage(product)
                        }
                    };
                    setCart([newCartItem]);
                    setIsCartOpen(true);
                    setCurrentView('dashboard');
                    setSelectedProduct(null);
                }}
            />
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Market Connect</h1>
                        <button 
                            className="mobile-menu-btn"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            <FontAwesomeIcon icon={showMobileMenu ? faTimes : faBars} />
                        </button>
                    </div>
                    
                    <div className="search-section">
                        <div className="search-bar">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="header-actions">
                        <button 
                            className="action-btn cart-toggle-btn" 
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            title="Cart"
                        >
                            <FontAwesomeIcon icon={faShoppingCart} />
                            {cart.length > 0 && (
                                <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            )}
                        </button>
                        <button className="action-btn" onClick={() => setCurrentView('profile')}>
                            <FontAwesomeIcon icon={faUser} />
                        </button>
                        <button className="action-btn logout-btn" onClick={() => setCurrentView('profile')}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Sidebar */}
                <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
                    <nav className="sidebar-nav">
                        <div className="nav-item active">
                            <FontAwesomeIcon icon={faHome} />
                            <span>Dashboard</span>
                        </div>
                    </nav>

                    {/* Filters */}
                    <div className="filters-section">
                        <div className="section-header-left">
                            <h3>Featured Products</h3>
                            <span className="product-count">{sortedProducts.length} products</span>
                        </div>
                        
                        <div className="filter-group">
                            <label>Category</label>
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map(category => (
                                    <option key={category._id} value={category.name}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sort By</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="popularity">Popularity</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Rating</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</label>
                            <input
                                type="range"
                                min="0"
                                max="3000"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    <div className="content-header">
                        <h2>Welcome to Market Connect</h2>
                        <p>Discover amazing products at great prices</p>
                    </div>

                    {/* Featured Products */}
                    <section className="products-section">

                        <div className="products-grid">
                            {sortedProducts.map(product => {
                                const isInStock = product.stock > 0;
                                const primaryImage = getPrimaryImage(product);
                                return (
                                <div 
                                    key={product._id} 
                                    className="product-card"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setCurrentView('productDetail');
                                    }}
                                >
                                    <div className="product-image">
                                        <img src={primaryImage} alt={product.title} />
                                    </div>
                                    
                                    <div className="product-info">
                                        <h4 className="product-name">{product.title}</h4>
                                        {/* Category display - matches backend populated category */}
                                        {product.category && (
                                            <span className="product-category-badge" style={{fontSize: '12px', color: '#666', marginBottom: '5px', display: 'block'}}>
                                                {product.category.name}
                                            </span>
                                        )}
                                        <div className="product-rating">
                                            <div className="stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <FontAwesomeIcon 
                                                        key={i} 
                                                        icon={faStar} 
                                                        className={i < Math.floor(product.ratingAvg || 0) ? 'filled' : ''}
                                                    />
                                                ))}
                                            </div>
                                            <span className="rating-text">({product.ratingCount || 0})</span>
                                        </div>
                                        
                                        <div className="product-price">
                                            <span className="current-price">
                                                {product.currency === 'USD' ? '$' : '₹'}{product.price}
                                            </span>
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <span className="stock-warning" style={{fontSize: '12px', color: '#ff9800', marginLeft: '10px'}}>
                                                    Only {product.stock} left!
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className={`add-to-cart-btn ${!isInStock ? 'out-of-stock' : ''}`}
                                                onClick={() => isInStock && addToCart(product)}
                                                disabled={!isInStock}
                                            >
                                                {isInStock ? 'Add to Cart' : 'Out of Stock'}
                                            </button>
                                            <button 
                                                className={`buy-now-btn ${!isInStock ? 'out-of-stock' : ''}`}
                                                onClick={() => isInStock && buyNow(product)}
                                                disabled={!isInStock}
                                            >
                                                {isInStock ? 'Buy Now' : 'Out of Stock'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </section>
                </main>
            </div>

            {/* Cart Drawer - Right Side Panel (Amazon Style) */}
            <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
            <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-drawer-header">
                    <h3>Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</h3>
                    <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="cart-drawer-content">
                    {cart.length > 0 ? (
                        <>
                            <div className="cart-items-list">
                                {cart.map(item => (
                                    <div key={item.productId} className="cart-item-drawer">
                                        <img src={item.productDetails?.image || ''} alt={item.productDetails?.title || 'Product'} />
                                        <div className="cart-item-info">
                                            <span className="cart-item-title">{item.productDetails?.title || 'Product'}</span>
                                            <div className="cart-item-pricing">
                                                <span className="cart-item-price">
                                                    {item.productDetails?.currency === 'USD' ? '$' : '₹'}{item.productDetails?.price || 0}
                                                </span>
                                                <div className="quantity-controls-drawer">
                                                    <button 
                                                        className="quantity-btn-drawer"
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="quantity-drawer">{item.quantity}</span>
                                                    <button 
                                                        className="quantity-btn-drawer"
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-drawer-footer">
                                <div className="cart-total-drawer">
                                    <div className="subtotal">
                                        <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                                        <strong>₹{cartTotal.toFixed(2)}</strong>
                                    </div>
                                </div>
                                <button className="checkout-btn-drawer">Proceed to Checkout</button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-cart">
                            <FontAwesomeIcon icon={faShoppingCart} style={{fontSize: '48px', color: '#ccc', marginBottom: '20px'}} />
                            <p>Your cart is empty</p>
                            <button className="continue-shopping-btn" onClick={() => setIsCartOpen(false)}>
                                Continue Shopping
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;
