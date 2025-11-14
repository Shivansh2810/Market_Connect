import React, { useEffect, useMemo, useState } from 'react';
import './sellerDashboard.css';
import Profile from '../profile/Profile';
import AddProduct from './AddProduct';
import ReviewManagement from './ReviewManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
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
    faSearch,
    faSync
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

// Categories for product form
const categories = [
    { _id: '507f191e810c19729de860ea', name: 'Electronics', slug: 'electronics' },
    { _id: '507f191e810c19729de860eb', name: 'Clothing', slug: 'clothing' },
    { _id: '507f191e810c19729de860ec', name: 'Food & Beverages', slug: 'food-beverages' },
    { _id: '507f191e810c19729de860ed', name: 'Accessories', slug: 'accessories' }
];

const SellerDashboard = () => {
    const { logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [returns, setReturns] = useState([]);
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [returnStatusFilter, setReturnStatusFilter] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [ordersMeta, setOrdersMeta] = useState({ currentPage: 1, totalPages: 1 });
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);
    const [isReturnsLoading, setIsReturnsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salesReport, setSalesReport] = useState([]);
    const [isSalesReportLoading, setIsSalesReportLoading] = useState(true);
    const [salesReportError, setSalesReportError] = useState(null);

    const fetchDashboard = async () => {
        setIsDashboardLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/seller/dashboard');
            if (data.success) {
                setDashboardStats(data.data);
                if (data.data.topProducts) {
                    const mappedProducts = data.data.topProducts.map((product, idx) => ({
                        id: product.productId || idx + 1,
                        title: product.product?.title || 'Unnamed product',
                        price: product.product?.price || 0,
                        stock: product.qtySold || 0,
                        category: 'Top performer',
                        rating: 4,
                        reviews: product.qtySold || 0,
                        sales: product.qtySold || 0,
                        image: product.product?.images?.[0]?.url || 'https://via.placeholder.com/300?text=Product',
                        status: 'active'
                    }));
                    setProducts(mappedProducts);
                }
            }
        } catch (err) {
            setError('Failed to load dashboard stats');
            console.error(err);
        } finally {
            setIsDashboardLoading(false);
        }
    };

    const fetchOrders = async (page = 1) => {
        setIsOrdersLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/seller/my-sales?page=${page}&limit=10`);
            if (data.success) {
                setOrders(data.data.orders || []);
                setOrdersMeta({ currentPage: data.data.currentPage, totalPages: data.data.totalPages });
            }
        } catch (err) {
            setError('Failed to load orders');
            console.error(err);
        } finally {
            setIsOrdersLoading(false);
        }
    };

    const fetchReturns = async () => {
        setIsReturnsLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/seller/my-returns');
            if (data.success) {
                setReturns(data.data || []);
            }
        } catch (err) {
            setError('Failed to load returns');
            console.error(err);
        } finally {
            setIsReturnsLoading(false);
        }
    };

    const fetchSalesReport = async () => {
        setIsSalesReportLoading(true);
        setSalesReportError(null);
        try {
            const { data } = await api.get('/seller/salesreport');
            if (data.success) {
                setSalesReport(data.data || []);
            } else {
                setSalesReport([]);
            }
        } catch (err) {
            console.error(err);
            setSalesReportError('Failed to load sales report');
        } finally {
            setIsSalesReportLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchOrders();
        fetchReturns();
        fetchSalesReport();
    }, []);

    const totalRevenue = dashboardStats?.totalRevenue || 0;
    const totalOrders = dashboardStats?.totalOrders || 0;
    const totalProducts = dashboardStats?.totalProducts || products.length;
    const pendingReturns = dashboardStats?.pendingReturns || 0;
    const avgRating = dashboardStats?.avgRating?.toFixed(1) || '0.0';
    const ratingCount = dashboardStats?.ratingCount || 0;

    const pendingOrders = useMemo(
        () =>
            orders.filter(order =>
                ['Payment Pending', 'Order Placed'].includes(order.orderStatus)
            ).length,
        [orders]
    );
    const totalSales = useMemo(
        () => orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
        [orders]
    );

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOrders = orders.filter(order =>
        orderStatusFilter === 'All' || order.orderStatus === orderStatusFilter
    );

    const filteredReturns = returns.filter(returnItem =>
        returnStatusFilter === 'All' || returnItem.status === returnStatusFilter
    );

    const salesTrend = useMemo(() => {
        if (!salesReport.length) {
            return [{ label: 'No data', total: 0 }];
        }
        return salesReport.map(point => {
            const date = new Date(point._id);
            const label = isNaN(date)
                ? point._id
                : date.toLocaleString('default', { month: 'short', day: 'numeric' });
            return {
                label,
                total: point.totalSales || 0
            };
        });
    }, [salesReport]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev =>
                prev.map(order =>
                    order._id === orderId ? { ...order, orderStatus: newStatus } : order
                )
            );
        } catch (err) {
            console.error(err);
            alert('Failed to update order status');
        }
    };

    const handleReturnResolution = async (returnId, payload) => {
        try {
            await api.put(`/seller/my-returns/${returnId}/status`, payload);
            setReturns(prev =>
                prev.map(ret =>
                    ret._id === returnId
                        ? { ...ret, status: payload.status || ret.status, resolution: payload.resolution || ret.resolution }
                        : ret
                )
            );
        } catch (err) {
            console.error(err);
            alert('Failed to update return');
        }
    };

    // Handle product actions (local-only for now)
    const handleDeleteProduct = (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    const handleSaveProduct = (productData) => {
        if (productData.id) {
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
            alert('Product updated locally!');
        } else {
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
            alert('Product added locally!');
        }
        setSelectedProduct(null);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setCurrentView('addProduct');
    };

    const handleLogout = () => {
        logout();
    };

    const lowStockProducts = products.filter(p => p.stock < 5);

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
                                <div>
                                    <h2>Seller Dashboard</h2>
                                    <p>Overview of your sales and business performance</p>
                                </div>
                                <button className="btn-secondary refresh-btn" onClick={() => {
                                    fetchDashboard();
                                    fetchOrders(ordersMeta.currentPage);
                                    fetchReturns();
                                    fetchSalesReport();
                                }}>
                                    <FontAwesomeIcon icon={faSync} />
                                    Refresh
                                </button>
                            </div>

                            {error && <div className="error-banner">{error}</div>}

                            {/* Key Metrics Cards */}
                            <div className="metrics-grid">
                                <div className="metric-card revenue">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Total Revenue</h3>
                                        <p className="metric-value">₹{totalRevenue.toLocaleString()}</p>
                                        <span className="metric-change">Last 12 months</span>
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
                                        <span className="metric-change danger">{pendingReturns} pending returns</span>
                                    </div>
                                </div>

                                <div className="metric-card sales">
                                    <div className="metric-icon">
                                        <FontAwesomeIcon icon={faShoppingBag} />
                                    </div>
                                    <div className="metric-info">
                                        <h3>Total Sales</h3>
                                        <p className="metric-value">₹{totalSales.toLocaleString()}</p>
                                        <span className="metric-change">{orders.length} recent orders</span>
                                    </div>
                                </div>
                            </div>

                            <div className="insight-grid">
                                <div className="trend-card">
                                    <div className="section-header">
                                        <h3>Sales trend</h3>
                                        <span className="product-count">Last {salesTrend.length} entries</span>
                                    </div>
                                    {isSalesReportLoading ? (
                                        <div className="loading-state small">Loading sales trend...</div>
                                    ) : (
                                        <>
                                            {salesReportError && <div className="error-banner">{salesReportError}</div>}
                                            <div className="trend-chart">
                                                {salesTrend.map(point => {
                                                    const max = Math.max(...salesTrend.map(item => item.total || 1)) || 1;
                                                    const percent = Math.round((point.total / max) * 100);
                                                    return (
                                                        <div className="trend-row" key={`${point.label}-${point.total}`}>
                                                            <span className="trend-label">{point.label}</span>
                                                            <div className="trend-bar-wrapper">
                                                                <div className="trend-bar" style={{ width: `${percent}%` }} />
                                                                <span className="trend-value">₹{Math.round(point.total).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="rating-card">
                                    <div className="section-header">
                                        <h3>Customer sentiment</h3>
                                        <span className="product-count">{ratingCount} reviews</span>
                                    </div>
                                    <div className="rating-score">
                                        <div className="score-circle">
                                            <span>{avgRating}</span>
                                            <small>/5</small>
                                        </div>
                                        <div>
                                            <p>Your buyers rate you highly. Keep delighting them!</p>
                                            <div className="rating-stars">
                                                {[...Array(5)].map((_, index) => (
                                                    <FontAwesomeIcon
                                                        key={index}
                                                        icon={faStar}
                                                        className={index < Math.round(avgRating) ? 'filled' : ''}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Selling Products */}
                            <div className="section-header">
                                <h3>Top Performing Products</h3>
                            </div>
                            <div className="products-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Units Sold</th>
                                            <th>Inventory proxy</th>
                                            <th>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="empty-state">No products to display yet</td>
                                            </tr>
                                        )}
                                        {products.slice(0, 5).map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="product-info-table">
                                                        <img src={product.image} alt={product.title} />
                                                        <span>{product.title}</span>
                                                    </div>
                                                </td>
                                                <td>{product.sales}</td>
                                                <td className={product.stock < 10 ? 'stock-low' : 'stock-ok'}>
                                                    {product.stock} units
                                                </td>
                                                <td>
                                                    <FontAwesomeIcon icon={faStar} />
                                                    {product.rating.toFixed(1)}
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
                                {isOrdersLoading ? (
                                    <div className="loading-state small">Loading orders...</div>
                                ) : (
                                    <>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Customer</th>
                                                    <th>Items</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                    <th>Placed on</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOrders.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="empty-state">No orders found</td>
                                                    </tr>
                                                )}
                                                {filteredOrders.map(order => (
                                                    <tr key={order._id}>
                                                        <td>{order._id}</td>
                                                        <td>{order.buyer?.name || order.buyer?.email || 'N/A'}</td>
                                                        <td>{order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</td>
                                                        <td>₹{order.totalPrice?.toLocaleString() || 0}</td>
                                                        <td>
                                                            <select
                                                                value={order.orderStatus}
                                                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                                className={`status-select status-${order.orderStatus.toLowerCase().replace(/\s/g, '-')}`}
                                                            >
                                                                <option value="Payment Pending">Payment Pending</option>
                                                                <option value="Order Placed">Order Placed</option>
                                                                <option value="Shipped">Shipped</option>
                                                                <option value="Delivered">Delivered</option>
                                                                <option value="Cancelled">Cancelled</option>
                                                                <option value="Returned">Returned</option>
                                                            </select>
                                                        </td>
                                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <button 
                                                                className="btn-view"
                                                                onClick={() => window.open(`/orders/${order._id}`, '_blank')}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="pagination">
                                            <button
                                                disabled={ordersMeta.currentPage === 1}
                                                onClick={() => fetchOrders(ordersMeta.currentPage - 1)}
                                            >
                                                Previous
                                            </button>
                                            <span>Page {ordersMeta.currentPage} of {ordersMeta.totalPages}</span>
                                            <button
                                                disabled={ordersMeta.currentPage === ordersMeta.totalPages}
                                                onClick={() => fetchOrders(ordersMeta.currentPage + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                )}
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
                                {isReturnsLoading ? (
                                    <div className="loading-state small">Loading returns...</div>
                                ) : (
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
                                            {filteredReturns.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="empty-state">No return requests</td>
                                                </tr>
                                            )}
                                            {filteredReturns.map(returnItem => (
                                                <tr key={returnItem._id}>
                                                    <td>{returnItem._id}</td>
                                                    <td>{returnItem.order}</td>
                                                    <td>{returnItem.buyer?.name || returnItem.buyer?.email || 'N/A'}</td>
                                                    <td>{returnItem.reason}</td>
                                                    <td>₹{returnItem.order?.totalPrice || returnItem.amount || 0}</td>
                                                    <td>
                                                        <span className={`badge status-${returnItem.status.toLowerCase().replace(/\s/g, '-')}`}>
                                                            {returnItem.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {returnItem.resolution ? (
                                                            <span className="badge resolved">{returnItem.resolution}</span>
                                                        ) : (
                                                            <div className="resolution-buttons">
                                                                <button
                                                                    className="btn-resolve refund"
                                                                    onClick={() => handleReturnResolution(returnItem._id, { status: 'Approved', resolution: 'Refund' })}
                                                                >
                                                                    Approve refund
                                                                </button>
                                                                <button
                                                                    className="btn-resolve credit"
                                                                    onClick={() => handleReturnResolution(returnItem._id, { status: 'Approved', resolution: 'Store Credit' })}
                                                                >
                                                                    Offer credit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn-view"
                                                            onClick={() => alert('Detailed return view coming soon')}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
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
