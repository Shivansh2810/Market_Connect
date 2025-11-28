import React, { useMemo, useState, useCallback, useEffect } from "react";
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
  const [priceRange, setPriceRange] = useState([0, 250000]);
  const [priceRangeDisplay, setPriceRangeDisplay] = useState('none');
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
      const matchesPrice = priceRange[0] === 0 && priceRange[1] === 250000 
        ? true // Show all products when "None" is selected
        : price >= priceRange[0] && price <= priceRange[1];

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

      console.log('Assistant response:', data);

      if (Array.isArray(data.products) && data.products.length > 0) {
        // Map assistant products to match our product structure
        const mappedProducts = data.products.map((p) => {
          const id = p.id || p._id;
          
          // Find matching product from our catalog
          const baseProduct = products.find(
            (prod) => String(prod._id) === String(id)
          );

          if (baseProduct) {
            // Use the full product from catalog
            return baseProduct;
          }

          // If not found in catalog, create a normalized product object
          return {
            _id: id,
            title: p.name || p.title || 'Product',
            description: p.description || '',
            price: typeof p.price === 'number' ? p.price : 0,
            currency: 'INR',
            ratingAvg: p.rating ?? 0,
            ratingCount: p.reviewCount ?? 0,
            stock: 10, // Default stock for assistant results
            images: p.image_url 
              ? [{ url: p.image_url, isPrimary: true }]
              : [],
            categoryId: { name: p.category || 'General' },
            category: { name: p.category || 'General' },
            isDeleted: false
          };
        });

        setAssistantProducts(mappedProducts);
        setAssistantError('');
      } else {
        setAssistantProducts([]);
        setAssistantError('No products found. Try different keywords.');
      }
    } catch (err) {
      console.error('Assistant search error:', err);
      setAssistantError('Smart search failed. Try regular search instead.');
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
        {/* Single row: Market Connect (left), Search bar (center), Actions (right) */}
        <div className="header-single-row">
          <div className="brand-section">
            <button
              className="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FontAwesomeIcon icon={showMobileMenu ? faTimes : faBars} />
            </button>
            <h1 className="brand-title">Market Connect</h1>
          </div>
          
          <div className="search-section">
            <div className="search-bar">
              <button
                type="button"
                className="assistant-search-btn"
                onClick={handleAssistantSearch}
                disabled={assistantLoading || !searchTerm.trim()}
                title={assistantLoading ? "Searching..." : "AI Smart Search - Try natural language like 'laptop for gaming' or 'gift for mom'"}
              >
                <FontAwesomeIcon 
                  icon={faRobot} 
                  className={assistantLoading ? 'spinning' : ''}
                />
              </button>
              <div className="search-input-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products... (Try AI: 'laptop for gaming' or 'gift under 5000')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      handleAssistantSearch();
                    }
                  }}
                />
              </div>
            </div>
            {assistantLoading && (
              <div className="assistant-loading-hint">
                🤖 AI is analyzing your query and finding the best products...
              </div>
            )}
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
              <h3>{assistantProducts ? 'Smart Search Results' : 'Featured Products'}</h3>
              <span className="product-count">{sortedProducts.length} products</span>
            </div>

            {assistantProducts && (
              <div className="assistant-info-text">
                <FontAwesomeIcon icon={faRobot} style={{ marginRight: '5px' }} />
                AI-powered results
                <button 
                  className="clear-assistant-btn"
                  onClick={() => {
                    setAssistantProducts(null);
                    setSearchTerm('');
                    setAssistantError('');
                  }}
                  style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px' }}
                >
                  Clear
                </button>
              </div>
            )}

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
              <label>Price Range</label>
              <select
                value={priceRangeDisplay}
                onChange={(e) => {
                  setPriceRangeDisplay(e.target.value);
                  if (e.target.value === 'none') {
                    setPriceRange([0, 250000]); // Show all products
                  } else {
                    const [min, max] = e.target.value.split('-').map(Number);
                    setPriceRange([min, max]);
                  }
                }}
              >
                <option value="none">None</option>
                <option value="0-1000">₹0 - ₹1,000</option>
                <option value="1000-2000">₹1,000 - ₹2,000</option>
                <option value="2000-5000">₹2,000 - ₹5,000</option>
                <option value="5000-10000">₹5,000 - ₹10,000</option>
                <option value="10000-20000">₹10,000 - ₹20,000</option>
                <option value="20000-50000">₹20,000 - ₹50,000</option>
                <option value="50000-100000">₹50,000 - ₹1,00,000</option>
                <option value="100000-250000">₹1,00,000 - ₹2,50,000</option>
              </select>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {/* Separate centered welcome section */}
          <div className="welcome-section">
            <div className="welcome-content">
              <h2>Welcome to Market Connect</h2>
              <p>Discover amazing products at great prices</p>
            </div>
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