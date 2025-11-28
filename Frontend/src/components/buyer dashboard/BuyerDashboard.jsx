import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import './dashboard.css';
import Profile from '../profile/Profile';
import CustomerService from '../customerService/CustomerService';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useCart } from '../../contexts/CartContext';
import { useAuction } from '../../contexts/AuctionContext';
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
  faStore,
  faGavel,
  faComments,
  faRobot
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { sendAssistantQuery } from '../../../services/assistant';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location for login redirect
  const { logout, user, isAuthenticated } = useAuth();
  const { products, categories, loading: productsLoading, error: productsError, refresh } = useProducts();
  const { auctions, upcomingAuctions = [] } = useAuction();
  const {
    items,
    addToCart,
    replaceCartWith,
    updateQuantity,
    removeFromCart,
    itemCount,
    totalAmount
  } = useCart();

  const requireAuth = (actionCallback) => {
    if (isAuthenticated) {
      actionCallback();
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showChatbot, setShowChatbot] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [assistantSessionId] = useState(() => `shop_assistant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const [assistantProducts, setAssistantProducts] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const categoryOptions = useMemo(() => {
    const categoryNames = (categories || [])
      .map((category) => category?.name || category?.title)
      .filter(Boolean);
    const derivedNames = products
      .map((product) => product?.categoryId?.name)
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
    const hasAssistantResults = Array.isArray(assistantProducts);
    const sourceProducts = hasAssistantResults ? assistantProducts : products;

    return sourceProducts.filter((product) => {
      if (!product || product.isDeleted) return false;

      const matchesSearch = hasAssistantResults
        ? true
        : (
            product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );

      const matchesCategory =
        selectedCategory === 'All' ||
        product.categoryId?.name === selectedCategory;

      const price = product.price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, assistantProducts, searchTerm, selectedCategory, priceRange]);

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

  const handleAssistantSearch = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed || assistantLoading) return;

    setAssistantLoading(true);
    setAssistantError('');

    try {
      const data = await sendAssistantQuery({
        message: trimmed,
        sessionId: assistantSessionId,
      });

      if (Array.isArray(data.products) && data.products.length > 0) {
        setAssistantProducts(
          data.products.map((p) => {
            const id = p._id || p.id;
            // Try to find the full product from the loaded catalogue
            const baseProduct = products.find(
              (prod) => String(prod._id) === String(id)
            );

            const normalized = {
              ...p,
              _id: id,
              title: p.name || p.title || baseProduct?.title || 'Product',
              ratingAvg: p.rating ?? p.ratingAvg ?? baseProduct?.ratingAvg ?? 0,
              ratingCount:
                p.reviewCount ?? p.ratingCount ?? baseProduct?.ratingCount ?? 0,
              price:
                typeof p.price === 'number'
                  ? p.price
                  : baseProduct?.price ?? 0,
              currency: baseProduct?.currency || 'INR',
              stock:
                typeof baseProduct?.stock === 'number' ? baseProduct.stock : 0,
              images:
                p.images ||
                (p.image_url
                  ? [{
                      url: p.image_url,
                      publicId: 'assistant',
                      isPrimary: true,
                    }]
                  : baseProduct?.images || []),
              category: baseProduct?.category || baseProduct?.categoryId,
            };

            return baseProduct ? { ...baseProduct.toObject?.() ?? baseProduct, ...normalized } : normalized;
          })
        );
      } else {
        setAssistantProducts([]);
      }
    } catch (err) {
      console.error('Assistant search error:', err);
      setAssistantError('Assistant search failed. Please try again.');
      setAssistantProducts(null);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProductClick = (product) => {
    navigate(`/dashboard/products/${product._id}`);
  };

  const handleAddProductToCart = (product) => {
    requireAuth(() => {
      addToCart(product, 1);
      setIsCartOpen(true);
    });
  };

  const handleBuyNow = (product) => {
    requireAuth(() => {
      replaceCartWith(product, 1);
      navigate('/checkout');
    });
  };

  const handleCheckout = () => {
    requireAuth(() => {
      setIsCartOpen(false);
      navigate('/checkout');
    });
  };

  const canBecomeSeller = !isAuthenticated || (isAuthenticated && user.role !== 'seller' && user.role !== 'both');

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

  if (showChatbot) {
    return <CustomerService onBack={() => setShowChatbot(false)} />;
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
              <button
                type="button"
                className="assistant-search-btn"
                onClick={handleAssistantSearch}
                disabled={assistantLoading || !searchTerm.trim()}
                title="Smart search assistant"
              >
                <FontAwesomeIcon icon={faRobot} />
              </button>
              <div className="search-input-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
            <button
              className="action-btn"
              onClick={() => requireAuth(() => setCurrentView('profile'))}
              title={isAuthenticated ? 'View Profile' : 'Login / Register'}
            >
              <FontAwesomeIcon icon={faUser} />
            </button>
            {isAuthenticated && (
              <button className="action-btn logout-btn" onClick={handleLogout} title="Logout">
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            <div
                className="nav-item active"
                onClick={() => {
                  navigate('/dashboard');      // Redirects to dashboard route
                  setCurrentView('dashboard'); // Resets the view state if you were on a sub-view
                  setSearchTerm('');           // Optional: Resets search filters
                  setSelectedCategory('All');  // Optional: Resets category filters
                }}
                style={{ cursor: 'pointer' }} // Makes the mouse cursor look like a hand
              >
                <FontAwesomeIcon icon={faHome} />
                <span>Dashboard</span>
              </div>
            <div
              className="nav-item"
              onClick={() => requireAuth(() => navigate('/auctions'))}
              style={{ cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faGavel} />
              <span>Live Auctions</span>
              {(() => {
                const liveCount = auctions ? auctions.length : 0;
                const upcomingCount = upcomingAuctions ? upcomingAuctions.length : 0;
                const totalCount = liveCount + upcomingCount;
                return totalCount > 0 ? (
                  <span className="auction-badge">{totalCount}</span>
                ) : null;
              })()}
            </div>
            {canBecomeSeller && (
              <div
                className="nav-item become-seller-item"
                onClick={() => requireAuth(() => navigate('/become-seller'))}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faStore} />
                <span>Become a Seller</span>
              </div>
            )}
          </nav>

          <div className="filters-section">
            <div className="section-header-left">
              <h3>Featured Products</h3>
              <span className="product-count">{sortedProducts.length} products</span>
            </div>

            {assistantError && (
              <div className="assistant-error-text">{assistantError}</div>
            )}

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
                max="10000000"
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
                          {(() => {
                            const filledCount = Math.max(0, Math.min(5, Math.floor(product.ratingAvg || 0)));
                            return [...Array(5)].map((_, i) => {
                              const isFilled = i < filledCount;
                              return (
                                <FontAwesomeIcon
                                  key={i}
                                  icon={isFilled ? faStar : faStarRegular}
                                  className={isFilled ? 'filled' : ''}
                                />
                              );
                            });
                          })()}
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
          <h3>Your Cart ({isAuthenticated ? itemCount : 0} items)</h3>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="cart-drawer-content">
          {isAuthenticated ? (
            // 1. USER IS LOGGED IN
            items.length > 0 ? (
              // 1a. Logged in and has items
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
              // 1b. Logged in and cart is empty
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
            )
          ) : (
            // 2. USER IS A GUEST
            <div className="empty-cart" style={{ padding: '20px', textAlign: 'center' }}>
              <FontAwesomeIcon
                icon={faUser}
                style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}
              />
              <h4 style={{ marginBottom: '10px' }}>Please log in</h4>
              <p style={{ marginBottom: '20px' }}>Log in to view your cart and start shopping.</p>
              <button
                className="checkout-btn-drawer" // Re-use the checkout button style
                onClick={() => {
                  setIsCartOpen(false); // Close drawer
                  navigate('/login', { state: { from: location } }); // Go to login
                }}
              >
                Login / Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        className="floating-chatbot-btn"
        onClick={() => setShowChatbot(true)}
        title="Need help? Chat with us!"
      >
        <FontAwesomeIcon icon={faComments} className="chatbot-icon" />
        <span className="chatbot-badge">
          <FontAwesomeIcon icon={faRobot} />
        </span>
      </button>
    </div>
  );
};

export default BuyerDashboard;