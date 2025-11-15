import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminDashboard.css';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faTimes,
  faSignOutAlt,
  faUser,
  faTag,
  faFolder,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes as faClose
} from '@fortawesome/free-solid-svg-icons';
import * as categoryAPI from '../../../api/category';
import * as couponAPI from '../../../api/coupon';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [currentView, setCurrentView] = useState('categories');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', parentId: '' });
  
  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountAmount: '',
    minOrderValue: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
    applicableCategories: []
  });

  // Load categories
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await categoryAPI.getAllCategories();
      console.log('Categories API response:', response);
      if (response && response.success) {
        const categoriesList = response.categories || [];
        console.log('Loaded categories from database:', categoriesList);
        setCategories(categoriesList);
      } else {
        console.log('No categories found or invalid response');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      alert(error.response?.data?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load coupons
  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      const response = await couponAPI.getAllCoupons();
      console.log('Coupons API response:', response);
      if (response && response.success) {
        const couponsList = response.data || [];
        console.log('Loaded coupons from database:', couponsList);
        setCoupons(couponsList);
      } else {
        console.log('No coupons found or invalid response');
        setCoupons([]);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      alert(error.response?.data?.message || 'Failed to load coupons');
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadCategories();
    loadCoupons();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', parentId: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || ''
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!categoryForm.slug.trim()) {
      alert('Slug is required');
      return;
    }

    try {
      // Prepare category data - convert empty parentId to null
      const categoryData = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim().toLowerCase(),
        parentId: categoryForm.parentId && categoryForm.parentId !== '' ? categoryForm.parentId : null
      };

      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory._id, categoryData);
        alert('Category updated successfully');
      } else {
        await categoryAPI.createCategory(categoryData);
        alert('Category created successfully');
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '', slug: '', parentId: '' });
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryAPI.deleteCategory(id);
      alert('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  // Coupon handlers
  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discountAmount: '',
      minOrderValue: '',
      validUntil: '',
      usageLimit: '',
      isActive: true,
      applicableCategories: []
    });
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discountAmount: coupon.discountAmount,
      minOrderValue: coupon.minOrderValue || '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive !== false,
      applicableCategories: coupon.applicableCategories || []
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      alert('Coupon code is required');
      return;
    }
    if (!couponForm.discountAmount || couponForm.discountAmount <= 0) {
      alert('Discount amount must be greater than 0');
      return;
    }
    if (!couponForm.validUntil) {
      alert('Valid until date is required');
      return;
    }

    // Prepare coupon data
    const couponData = {
      code: couponForm.code.trim().toUpperCase(),
      description: couponForm.description?.trim() || '',
      discountAmount: Number(couponForm.discountAmount),
      minOrderValue: couponForm.minOrderValue ? Number(couponForm.minOrderValue) : 0,
      usageLimit: couponForm.usageLimit && couponForm.usageLimit !== '' ? Number(couponForm.usageLimit) : null,
      validUntil: new Date(couponForm.validUntil).toISOString(),
      isActive: couponForm.isActive,
      applicableCategories: couponForm.applicableCategories || []
    };

    try {
      if (editingCoupon) {
        await couponAPI.updateCoupon(editingCoupon._id, couponData);
        alert('Coupon updated successfully');
      } else {
        await couponAPI.createCoupon(couponData);
        alert('Coupon created successfully');
      }
      setShowCouponModal(false);
      // Reset form
      setCouponForm({
        code: '',
        description: '',
        discountAmount: '',
        minOrderValue: '',
        validUntil: '',
        usageLimit: '',
        isActive: true,
        applicableCategories: []
      });
      loadCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Failed to save coupon');
    }
  };
useEffect(() => {
  console.log('🔄 AdminDashboard useEffect running');
  console.log('User:', user);
  
  if (!user) {
    console.log('❌ No user, returning');
    return;
  }
  
  if (user.role !== 'admin') {
    console.log('❌ Not admin, redirecting');
    navigate('/dashboard');
    return;
  }
  
  console.log('✅ User is admin, loading data...');
  loadCategories();
  loadCoupons();
}, [user, navigate]);
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      await couponAPI.deleteCoupon(id);
      alert('Coupon deleted successfully');
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Market Connect - Admin</h1>
            <button
              className="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FontAwesomeIcon icon={showMobileMenu ? faTimes : faBars} />
            </button>
          </div>

          <div className="header-actions">
            <button className="action-btn" onClick={() => navigate('/dashboard')} title="Profile">
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
            <div
              className={`nav-item ${currentView === 'categories' ? 'active' : ''}`}
              onClick={() => setCurrentView('categories')}
            >
              <FontAwesomeIcon icon={faFolder} />
              <span>Categories</span>
            </div>
            <div
              className={`nav-item ${currentView === 'coupons' ? 'active' : ''}`}
              onClick={() => setCurrentView('coupons')}
            >
              <FontAwesomeIcon icon={faTag} />
              <span>Coupons</span>
            </div>
          </nav>
        </aside>

        <main className="main-content">
          {/* Categories View */}
          {currentView === 'categories' && (
            <>
              <div className="content-header">
                <h2>Category Management</h2>
                <button className="btn-primary" onClick={handleCreateCategory}>
                  <FontAwesomeIcon icon={faPlus} />
                  Add Category
                </button>
              </div>

              {categoriesLoading ? (
                <div className="loading-state">Loading categories...</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Parent Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="empty-state">
                            No categories found. Create your first category!
                          </td>
                        </tr>
                      ) : (
                        categories.map((category) => (
                          <tr key={category._id}>
                            <td>{category.name}</td>
                            <td>{category.slug}</td>
                            <td>
                              {category.parentId
                                ? categories.find((c) => c._id === category.parentId || c._id?.toString() === category.parentId?.toString())?.name || 'N/A'
                                : 'None'}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-edit"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="btn-delete"
                                  onClick={() => handleDeleteCategory(category._id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Coupons View */}
          {currentView === 'coupons' && (
            <>
              <div className="content-header">
                <h2>Coupon Management</h2>
                <button className="btn-primary" onClick={handleCreateCoupon}>
                  <FontAwesomeIcon icon={faPlus} />
                  Add Coupon
                </button>
              </div>

              {couponsLoading ? (
                <div className="loading-state">Loading coupons...</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Discount</th>
                        <th>Min Order</th>
                        <th>Valid Until</th>
                        <th>Usage Limit</th>
                        <th>Used</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="empty-state">
                            No coupons found. Create your first coupon!
                          </td>
                        </tr>
                      ) : (
                        coupons.map((coupon) => (
                          <tr key={coupon._id}>
                            <td><strong>{coupon.code}</strong></td>
                            <td>{coupon.description || 'N/A'}</td>
                            <td>₹{coupon.discountAmount}</td>
                            <td>₹{coupon.minOrderValue || 0}</td>
                            <td>{new Date(coupon.validUntil).toLocaleDateString()}</td>
                            <td>{coupon.usageLimit || 'Unlimited'}</td>
                            <td>{coupon.usedCount || 0}</td>
                            <td>
                              <span className={`badge ${coupon.isActive ? 'active' : 'inactive'}`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-edit"
                                  onClick={() => handleEditCoupon(coupon)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="btn-delete"
                                  onClick={() => handleDeleteCoupon(coupon._id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <FontAwesomeIcon icon={faClose} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="Enter URL slug (e.g., electronics)"
                />
                <small style={{color: '#666', fontSize: '12px', marginTop: '5px', display: 'block'}}>
                  This will be used in URLs. Use lowercase letters, numbers, and hyphens.
                </small>
              </div>
              <div className="form-group">
                <label>Parent Category (Optional)</label>
                <select
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                >
                  <option value="">None</option>
                  {categories
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveCategory}>
                <FontAwesomeIcon icon={faSave} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button className="modal-close" onClick={() => setShowCouponModal(false)}>
                <FontAwesomeIcon icon={faClose} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                  />
                </div>
                <div className="form-group">
                  <label>Discount Amount (₹) *</label>
                  <input
                    type="number"
                    value={couponForm.discountAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, discountAmount: e.target.value })}
                    placeholder="e.g., 100"
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Coupon description"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until *</label>
                  <input
                    type="date"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usage Limit (Optional)</label>
                  <input
                    type="number"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.value === 'true' })}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCouponModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveCoupon}>
                <FontAwesomeIcon icon={faSave} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;