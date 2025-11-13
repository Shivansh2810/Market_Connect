import React, { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import Profile from '../profile/Profile';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useCart } from '../../contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faShoppingCart,
  faUser,
  faStar,
  faBars,
  faTimes,
  faHome,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { products, categories, loading: productsLoading, error: productsError, refresh } = useProducts();
  const {
    items,
    addToCart,
    replaceCartWith,
    updateQuantity,
    removeFromCart,
    itemCount,
    totalAmount
  } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const categoryOptions = useMemo(() => {
    const categoryNames = (categories || [])
      .map((category) => category?.name || category?.title)
      .filter(Boolean);
    const derivedNames = products
      .map((product) => product?.category?.name || product?.category)
      .filter(Boolean);
    const unique = Array.from(new Set(['All', ...categoryNames, ...derivedNames]));
    return unique;
  }, [categories, products]);

  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return 'https://via.placeholder.com/300?text=Market+Connect';
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product || product.isDeleted) return false;

      const matchesSearch =
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        product.category?.name === selectedCategory ||
        product.categoryId === selectedCategory ||
        product.category === selectedCategory;

      const price = product.price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, priceRange]);

  const sortedProducts = useMemo(() => {
    const productsToSort = [...filteredProducts];
    return productsToSort.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.ratingAvg || 0) - (a.ratingAvg || 0);
        case 'popularity':
        default:
          return (b.ratingCount || 0) - (a.ratingCount || 0);
      }
    });
  }, [filteredProducts, sortBy]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProductClick = (product) => {
    navigate(`/dashboard/products/${product._id}`);
  };

  const handleAddProductToCart = (product) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product) => {
    replaceCartWith(product, 1);
    navigate('/checkout');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  if (productsLoading) {
    return (
      <div className="dashboard loading-state">
        <div className="loading-screen">
          <div className="spinner"></div>
          <h3>Loading products...</h3>
          <p>Please wait while we fetch the latest catalogue</p>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="dashboard error-state">
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h3>We couldn’t load products</h3>
          <p>{productsError}</p>
          <button onClick={refresh} className="retry-btn">
            Try Again
          </button>
          <button onClick={handleLogout} className="retry-btn secondary">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'profile') {
    return <Profile onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="dashboard">
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
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </button>
            <button className="action-btn" onClick={() => setCurrentView('profile')}>
              <FontAwesomeIcon icon={faUser} />
            </button>
            <button className="action-btn logout-btn" onClick={handleLogout} title="Logout">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            <div className="nav-item active">
              <FontAwesomeIcon icon={faHome} />
              <span>Dashboard</span>
            </div>
          </nav>

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
                {categoryOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
                max="5000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-header">
            <h2>Welcome to Market Connect</h2>
            <p>Discover amazing products at great prices</p>
          </div>

          <section className="products-section">
            <div className="products-grid">
              {sortedProducts.map((product) => {
                const isInStock = (product.stock || 0) > 0;
                const primaryImage = getPrimaryImage(product);

                return (
                  <div
                    key={product._id}
                    className="product-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="product-image">
                      <img src={primaryImage} alt={product.title} />
                    </div>

                    <div className="product-info">
                      <h4 className="product-name">{product.title}</h4>
                      {product.category && (
                        <span className="product-category-badge">
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
                          {product.currency === 'USD' ? '$' : '₹'}
                          {product.price}
                        </span>
                        {isInStock && product.stock <= 5 && (
                          <span className="stock-warning">Only {product.stock} left!</span>
                        )}
                      </div>

                      <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`add-to-cart-btn ${!isInStock ? 'out-of-stock' : ''}`}
                          onClick={() => isInStock && handleAddProductToCart(product)}
                          disabled={!isInStock}
                        >
                          {isInStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button
                          className={`buy-now-btn ${!isInStock ? 'out-of-stock' : ''}`}
                          onClick={() => isInStock && handleBuyNow(product)}
                          disabled={!isInStock}
                        >
                          {isInStock ? 'Buy Now' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      <div
        className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      ></div>
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h3>Your Cart ({itemCount} items)</h3>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="cart-drawer-content">
          {items.length > 0 ? (
            <>
              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.productId} className="cart-item-drawer">
                    <img
                      src={item.productDetails?.image || ''}
                      alt={item.productDetails?.title || 'Product'}
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{item.productDetails?.title}</span>
                      <div className="cart-item-pricing">
                        <span className="cart-item-price">
                          {item.productDetails?.currency === 'USD' ? '$' : '₹'}
                          {item.productDetails?.price || 0}
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
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-drawer-footer">
                <div className="cart-total-drawer">
                  <div className="subtotal">
                    <span>Subtotal ({itemCount} items):</span>
                    <strong>₹{totalAmount.toFixed(2)}</strong>
                  </div>
                </div>
                <button className="checkout-btn-drawer" onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <FontAwesomeIcon
                icon={faShoppingCart}
                style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}
              />
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