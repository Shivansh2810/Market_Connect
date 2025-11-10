import React, { useState } from 'react';
import './sellerDashboard.css';
import Profile from '../profile/Profile';
import AddProduct from './AddProduct';
import ReviewManagement from './ReviewManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome,
    faShoppingBag,
    faBox,
    faShoppingCart,
    faUndo,
    faStar,
    faUser,
    faSignOutAlt,
    faBars,
    faTimes,
    faChartLine,
    faEdit,
    faTrash,
    faPlus,
    faBell,
    faExclamationTriangle,
    faSearch
} from '@fortawesome/free-solid-svg-icons';

// Sample data - In real app, this would come from API
const sampleProducts = [
    {
        id: 1,
        title: "Wireless Bluetooth Headphones",
        price: 1299,
        stock: 45,
        category: "Electronics",
        rating: 4.5,
        reviews: 128,
        views: 1520,
        sales: 89,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
        status: "active"
    },
    {
        id: 2,
        title: "Smart Fitness Watch",
        price: 2499,
        stock: 12,
        category: "Electronics",
        rating: 4.8,
        reviews: 89,
        views: 980,
        sales: 67,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
        status: "active"
    },
    {
        id: 3,
        title: "Organic Cotton T-Shirt",
        price: 399,
        stock: 3,
        category: "Clothing",
        rating: 4.2,
        reviews: 45,
        views: 450,
        sales: 34,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
        status: "active"
    },
];

const sampleOrders = [
    {
        id: 'ORD-001',
        customer: 'John Doe',
        items: 2,
        total: 3798,
        status: 'Processing',
        date: '2024-01-15',
        products: ['Wireless Headphones', 'Smart Watch']
    },
    {
        id: 'ORD-002',
        customer: 'Jane Smith	st',
        items: 1,
        total: 1299,
        status: 'Shipped',
        date: '2024-01-14',
        products: ['Wireless Headphones']
    },
    {
        id: 'ORD-003',
        customer: 'Mike Johnson',
        items: 3,
        total: 6797,
        status: 'Delivered',
        date: '2024-01-13',
        products: ['Wireless Headphones', 'Smart Watch', 'T-Shirt']
    },
];

const sampleReturns = [
    {
        id: 'RET-001',
        orderId: 'ORD-002',
        customer: 'Jane Smith',
        reason: 'Wrong Item Sent',
        status: 'Requested',
        amount: 1299,
        items: ['Wireless Headphones'],
        date: '2024-01-16'
    },
    {
        id: 'RET-002',
        orderId: 'ORD-003',
        customer: 'Mike Johnson',
        reason: 'Damaged Item',
        status: 'Approved',
        amount: 399,
        items: ['T-Shirt'],
        date: '2024-01-15'
    },
];

// Categories for product form
const categories = [
    { _id: '507f191e810c19729de860ea', name: 'Electronics', slug: 'electronics' },
    { _id: '507f191e810c19729de860eb', name: 'Clothing', slug: 'clothing' },
    { _id: '507f191e810c19729de860ec', name: 'Food & Beverages', slug: 'food-beverages' },
    { _id: '507f191e810c19729de860ed', name: 'Accessories', slug: 'accessories' }
];

const SellerDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState(sampleProducts);
    const [orders, setOrders] = useState(sampleOrders);
    const [returns, setReturns] = useState(sampleReturns);
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [returnStatusFilter, setReturnStatusFilter] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Calculate dashboard metrics
    const totalRevenue = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Processing').length;
    const lowStockProducts = products.filter(p => p.stock < 10);
    const totalProducts = products.length;
    const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('accountType');
        localStorage.removeItem('userName');
        localStorage.removeItem('rememberMe');
        window.location.href = '/';
    };

    // Filter products
    const filteredProducts = products.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter orders
    const filteredOrders = orders.filter(order => 
        orderStatusFilter === 'All' || order.status === orderStatusFilter
    );

    // Filter returns
    const filteredReturns = returns.filter(returnItem => 
        returnStatusFilter === 'All' || returnItem.status === returnStatusFilter
    );

    // Handle order status update
    const updateOrderStatus = (orderId, newStatus) => {
        setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        ));
    };

    // Handle return resolution
    const handleReturnResolution = (returnId, resolution) => {
        setReturns(returns.map(ret => 
            ret.id === returnId 
                ? { ...ret, status: 'Completed', resolution } 
                : ret
        ));
    };

    // Handle product actions
    const handleDeleteProduct = (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    // Handle save product (both add and edit)
    const handleSaveProduct = (productData) => {
        // In real app, this would make an API call to save/update the product
        if (productData.id) {
            // Editing existing product
            const updatedProducts = products.map(p => 
                p.id === productData.id 
                    ? {
                        ...p,
                        title: productData.title,
                        price: productData.price,
                        originalPrice: productData.originalPrice,
                        discount: productData.discount,
                        stock: productData.stock,
                        category: categories.find(c => c._id === productData.categoryId)?.name || p.category,
                        categoryId: productData.categoryId,
                        description: productData.description,
                        condition: productData.condition,
                        tags: productData.tags,
                        images: productData.images,
                        specs: productData.specs
                    }
                    : p
            );
            setProducts(updatedProducts);
            setCurrentView('products');
            alert('Product updated successfully!');
        } else {
            // Adding new product
            const newProduct = {
                id: products.length + 1,
                title: productData.title,
                price: productData.price,
                originalPrice: productData.originalPrice,
                discount: productData.discount,
                stock: productData.stock,
                category: categories.find(c => c._id === productData.categoryId)?.name || 'Unknown',
                categoryId: productData.categoryId,
                description: productData.description,
                condition: productData.condition,
                tags: productData.tags,
                images: productData.images,
                specs: productData.specs,
                rating: 0,
                reviews: 0,
                sales: 0,
                image: productData.images[0]?.url || '',
                status: 'active'
            };
            setProducts([...products, newProduct]);
            setCurrentView('products');
            alert('Product added successfully!');
        }
        setSelectedProduct(null);
    };

    // Handle edit product
    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setCurrentView('addProduct');
    };

    // Render profile page
    if (currentView === 'profile') {
        return <Profile onBack={() => setCurrentView('dashboard')} />;
    }

    // Render add/edit product page
    if (currentView === 'addProduct') {
        return (
            <AddProduct 
                onBack={() => {
                    setCurrentView('products');
                    setSelectedProduct(null);
                }}
                onSave={handleSaveProduct}
                product={selectedProduct}
            />
        );
    }

    // Render review management page
    if (currentView === 'reviewManagement') {
        return (
            <ReviewManagement 
                product={selectedProduct}
                onBack={() => {
                    setCurrentView('reviews');
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
                        <h1>Market Connect - Seller</h1>
                        <button 
                            className="mobile-menu-btn"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            <FontAwesomeIcon icon={showMobileMenu ? faTimes : faBars} />
                        </button>
                    </div>

                    <div className="header-actions">
                        <button 
                            className="action-btn" 
                            onClick={() => setCurrentView('profile')}
                            title="Profile"
                        >
                            <FontAwesomeIcon icon={faUser} />
                        </button>
                        <button 
                            className="action-btn logout-btn" 
                            onClick={handleLogout} 
                            title="Logout"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Sidebar */}
                <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
                    <nav className="sidebar-nav">
                        <div 
                            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setCurrentView('dashboard')}
                        >
                            <FontAwesomeIcon icon={faChartLine} />
                            <span>Dashboard</span>
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'products' ? 'active' : ''}`}
                            onClick={() => setCurrentView('products')}
                        >
                            <FontAwesomeIcon icon={faBox} />
                            <span>Products</span>
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
                            onClick={() => setCurrentView('orders')}
                        >
                            <FontAwesomeIcon icon={faShoppingCart} />
                            <span>Orders</span>
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'returns' ? 'active' : ''}`}
                            onClick={() => setCurrentView('returns')}
                        >
                            <FontAwesomeIcon icon={faUndo} />
                            <span>Returns</span>
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'reviews' ? 'active' : ''}`}
                            onClick={() => setCurrentView('reviews')}
                        >
                            <FontAwesomeIcon icon={faStar} />
                            <span>Reviews</span>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {/* Dashboard View - Reports & Analytics */}
                    {currentView === 'dashboard' && (
                        <>
                            <div className="content-header">
                                <h2>Seller Dashboard</h2>
                                <p>Overview of your sales and business performance</p>
                            </div>

                            {/* Key Metrics Cards */}
                            <div className="metrics-grid">
                                <div className="metric-card revenue">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Total Revenue</h3>
                                        <p className="metric-value">₹{totalRevenue.toLocaleString()}</p>
                                        <span className="metric-change">+12% from last month</span>
                                    </div>
                                </div>

                                <div className="metric-card orders">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faShoppingCart} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Total Orders</h3>
                                        <p className="metric-value">{totalOrders}</p>
                                        <span className="metric-change">{pendingOrders} pending</span>
                                    </div>
                                </div>

                                <div className="metric-card products">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faBox} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Products</h3>
                                        <p className="metric-value">{totalProducts}</p>
                                        <span className="metric-change danger">{lowStockProducts.length} low stock</span>
                                    </div>
                                </div>

                                <div className="metric-card sales">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faShoppingBag} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Total Sales</h3>
                                        <p className="metric-value">{totalSales}</p>
                                        <span className="metric-change">Across all products</span>
                                    </div>
                                </div>
                            </div>

                            {/* Low Stock Alerts */}
                            {lowStockProducts.length > 0 && (
                                <div className="alert-section">
                                    <div className="alert-header">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        <h3>Low Stock Alerts</h3>
                                    </div>
                                    <div className="alert-list">
                                        {lowStockProducts.map(product => (
                                            <div key={product.id} className="alert-item">
                                                <span className="product-name">{product.title}</span>
                                                <span className="stock-count danger">Only {product.stock} left</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Selling Products */}
                            <div className="section-header">
                                <h3>Top Selling Products</h3>
                            </div>
                            <div className="products-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Sales</th>
                                            <th>Stock</th>
                                            <th>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...products]
                                            .sort((a, b) => b.sales - a.sales)
                                            .slice(0, 5)
                                            .map(product => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <div className="product-info-table">
                                                            <img src={product.image} alt={product.title} />
                                                            <span>{product.title}</span>
                                                        </div>
                                                    </td>
                                                    <td>{product.sales}</td>
                                                    <td className={product.stock < 10 ? 'stock-low' : 'stock-ok'}>{product.stock}</td>
                                                    <td>
                                                        <FontAwesomeIcon icon={faStar} />
                                                        {product.rating.toFixed(1)} ({product.reviews})
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Products Management View */}
                    {currentView === 'products' && (
                        <>
                            <div className="content-header">
                                <h2>Product Management</h2>
                                <button className="btn-primary" onClick={() => setCurrentView('addProduct')}>
                                    <FontAwesomeIcon icon={faPlus} />
                                    Add New Product
                                </button>
                            </div>

                            <div className="product-search-section">
                                <div className="search-bar">
                                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="product-card">
                                        <div className="product-image">
                                            <img src={product.image} alt={product.title} />
                                            <div className="product-actions">
                                                <button 
                                                    className="action-icon edit"
                                                    onClick={() => handleEditProduct(product)}
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button 
                                                    className="action-icon delete"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    title="Delete"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="product-info">
                                            <h3>{product.title}</h3>
                                            <p className="product-price">₹{product.price.toLocaleString()}</p>
                                            <div className="product-stats">
                                                <span>
                                                    <span className={`stat-value ${product.stock < 10 ? 'stock-low' : 'stock-ok'}`}>
                                                        {product.stock}
                                                    </span>
                                                    <span className="stat-label">Stock</span>
                                                </span>
                                                <span>
                                                    <span className="stat-value">{product.sales}</span>
                                                    <span className="stat-label">Sales</span>
                                                </span>
                                            </div>
                                            <div className={`stock-badge ${product.stock < 10 ? 'stock-low' : 'stock-ok'}`}>
                                                {product.stock < 10 ? 'Low Stock' : 'In Stock'}
                                            </div>
                                            <div className="product-rating">
                                                <FontAwesomeIcon icon={faStar} />
                                                <span className="rating-value">{product.rating.toFixed(1)}</span>
                                                <span className="rating-count">({product.reviews} reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Orders Management View */}
                    {currentView === 'orders' && (
                        <>
                            <div className="content-header">
                                <h2>Order Management</h2>
                            </div>

                            <div className="filter-section">
                                <select 
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                    className="status-filter"
                                >
                                    <option value="All">All Orders</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="orders-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(order => (
                                            <tr key={order.id}>
                                                <td>{order.id}</td>
                                                <td>{order.customer}</td>
                                                <td>{order.items} items</td>
                                                <td>₹{order.total}</td>
                                                <td>
                                                    <select 
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        className={`status-select status-${order.status.toLowerCase()}`}
                                                    >
                                                        <option value="Processing">Processing</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td>{order.date}</td>
                                                <td>
                                                    <button 
                                                        className="btn-view"
                                                        onClick={() => alert(`View Order ${order.id} Details`)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Returns Management View */}
                    {currentView === 'returns' && (
                        <>
                            <div className="content-header">
                                <h2>Returns & Refunds Management</h2>
                            </div>

                            <div className="filter-section">
                                <select 
                                    value={returnStatusFilter}
                                    onChange={(e) => setReturnStatusFilter(e.target.value)}
                                    className="status-filter"
                                >
                                    <option value="All">All Returns</option>
                                    <option value="Requested">Requested</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div className="returns-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Return ID</th>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Reason</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Resolution</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReturns.map(returnItem => (
                                            <tr key={returnItem.id}>
                                                <td>{returnItem.id}</td>
                                                <td>{returnItem.orderId}</td>
                                                <td>{returnItem.customer}</td>
                                                <td>{returnItem.reason}</td>
                                                <td>₹{returnItem.amount}</td>
                                                <td>
                                                    <span className={`badge status-${returnItem.status.toLowerCase()}`}>
                                                        {returnItem.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {returnItem.status === 'Approved' && !returnItem.resolution && (
                                                        <div className="resolution-buttons">
                                                            <button 
                                                                className="btn-resolve refund"
                                                                onClick={() => handleReturnResolution(returnItem.id, 'Refund')}
                                                            >
                                                                Full Refund
                                                            </button>
                                                            <button 
                                                                className="btn-resolve credit"
                                                                onClick={() => handleReturnResolution(returnItem.id, 'Store Credit')}
                                                            >
                                                                Store Credit
                                                            </button>
                                                        </div>
                                                    )}
                                                    {returnItem.resolution && (
                                                        <span className="badge resolved">{returnItem.resolution}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn-view"
                                                        onClick={() => alert(`View Return ${returnItem.id} Details`)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Reviews Management View */}
                    {currentView === 'reviews' && (
                        <>
                            <div className="content-header">
                                <h2>Customer Reviews</h2>
                            </div>

                            <div className="reviews-list">
                                {products.map(product => (
                                    <div key={product.id} className="review-card">
                                        <div className="review-product">
                                            <img src={product.image} alt={product.title} />
                                            <div>
                                                <h4>{product.title}</h4>
                                                <div className="product-rating">
                                                    <FontAwesomeIcon icon={faStar} />
                                                    {product.rating.toFixed(1)} ({product.reviews} reviews)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="review-actions">
                                            <button 
                                                className="btn-view"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setCurrentView('reviewManagement');
                                                }}
                                            >
                                                View Reviews
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SellerDashboard;

