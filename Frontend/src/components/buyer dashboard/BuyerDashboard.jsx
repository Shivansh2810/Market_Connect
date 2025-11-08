import React, { useState } from 'react';
import './dashboard.css';
import Profile from '../profile/Profile';
import ProductDetail from './ProductDetail';
import CustomerService from '../customerservice/CustomerService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faShoppingCart, 
    faUser,
    faStar,
    faBars,
    faTimes,
    faHome,
    faSignOutAlt,
    faHeadset,
    faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

// Sample product data
const sampleProducts = [
    {
        _id: "507f1f77bcf86cd799439011",
        title: "Wireless Bluetooth Headphones",
        price: 1299,
        currency: "INR",
        ratingAvg: 4.5,
        ratingCount: 128,
        images: [
            {
                url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                publicId: "headphones-1",
                isPrimary: true
            }
        ],
        categoryName: "Electronics",
        stock: 45,
        condition: "new",
        tags: ["wireless", "bluetooth", "audio"],
        specs: {
            "Brand": "AudioTech",
            "Connectivity": "Bluetooth 5.0",
            "Battery": "20 hours"
        }
    },
    {
        _id: "507f1f77bcf86cd799439012",
        title: "Smart Fitness Watch",
        price: 2499,
        currency: "INR",
        ratingAvg: 4.8,
        ratingCount: 89,
        images: [
            {
                url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
                publicId: "watch-1",
                isPrimary: true
            }
        ],
        categoryName: "Electronics",
        stock: 12,
        condition: "new",
        tags: ["fitness", "smartwatch", "wearable"],
        specs: {
            "Brand": "FitTech",
            "Display": "1.4 inch",
            "Battery": "7 days"
        }
    },
    {
        _id: "507f1f77bcf86cd799439013",
        title: "Organic Cotton T-Shirt",
        price: 399,
        currency: "INR",
        ratingAvg: 4.2,
        ratingCount: 45,
        images: [
            {
                url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
                publicId: "tshirt-1",
                isPrimary: true
            }
        ],
        categoryName: "Clothing",
        stock: 3,
        condition: "new",
        tags: ["organic", "cotton", "casual"],
        specs: {
            "Material": "100% Organic Cotton",
            "Size": "M, L, XL",
            "Color": "White"
        }
    }
];

const categories = ["All", "Electronics", "Clothing", "Food & Beverages", "Accessories"];

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

    // Filter products based on search and category
    const filteredProducts = sampleProducts.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.categoryName === selectedCategory;
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
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

    // Add to cart function
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product._id);
        if (existingItem) {
            setCart(cart.map(item => 
                item.productId === product._id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { 
                productId: product._id, 
                quantity: 1,
                productDetails: {
                    title: product.title,
                    price: product.price,
                    currency: product.currency,
                    image: getPrimaryImage(product)
                }
            }]);
        }
        setIsCartOpen(true);
    };

    // Buy now function
    const buyNow = (product) => {
        setCart([{ 
            productId: product._id, 
            quantity: 1,
            productDetails: {
                title: product.title,
                price: product.price,
                currency: product.currency,
                image: getPrimaryImage(product)
            }
        }]);
        setIsCartOpen(true);
    };

    // Remove item from cart
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Update quantity
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

    // Calculate cart total
    const cartTotal = cart.reduce((total, item) => {
        const price = item.productDetails?.price || 0;
        return total + (price * item.quantity);
    }, 0);

    // Render profile page
    if (currentView === 'profile') {
        return <Profile onBack={() => setCurrentView('dashboard')} />;
    }

    // Render customer service page
    if (currentView === 'customerService') {
        return <CustomerService onBack={() => setCurrentView('dashboard')} />;
    }

    // Render product detail page
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
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ));
                    } else {
                        setCart([...cart, { 
                            productId: product._id, 
                            quantity,
                            productDetails: {
                                title: product.title,
                                price: product.price,
                                currency: product.currency,
                                image: getPrimaryImage(product)
                            }
                        }]);
                    }
                    setIsCartOpen(true);
                    setCurrentView('dashboard');
                    setSelectedProduct(null);
                }}
                onBuyNow={(product, quantity) => {
                    setCart([{ 
                        productId: product._id, 
                        quantity,
                        productDetails: {
                            title: product.title,
                            price: product.price,
                            currency: product.currency,
                            image: getPrimaryImage(product)
                        }
                    }]);
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
                            className="action-btn customer-service-btn" 
                            onClick={() => setCurrentView('customerService')}
                            title="Customer Service"
                        >
                            <FontAwesomeIcon icon={faHeadset} />
                        </button>
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
                                    <option key={category} value={category}>{category}</option>
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

            {/* Cart Drawer */}
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