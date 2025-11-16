import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faSave,
  faEye,
  faClock,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';
import * as auctionAPI from '../../../api/auction';
import * as productAPI from '../../../api/product';
import './adminAuctionManagement.css';

const AdminAuctionManagement = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    imageUrls: [''],
    price: '',
    condition: 'new',
    specs: {},
    startTime: '',
    endTime: '',
    startPrice: '',
  });

  const [categories, setCategories] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.categories || response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const data = await auctionAPI.getAllAuctionsAdmin();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading auctions:', error);
      alert('Failed to load auctions');
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
    loadCategories();
  }, []);

  const handleCreateAuction = () => {
    setEditingAuction(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditAuction = (auction) => {
    setEditingAuction(auction);
    setFormData({
      title: auction.title,
      description: auction.description,
      categoryId: auction.categoryId?._id || auction.categoryId,
      imageUrls: auction.images?.map(img => img.url || img) || [''],
      price: auction.price || '',
      condition: auction.condition || 'new',
      specs: auction.specs || {},
      startTime: new Date(auction.auctionDetails.startTime).toISOString().slice(0, 16),
      endTime: new Date(auction.auctionDetails.endTime).toISOString().slice(0, 16),
      startPrice: auction.auctionDetails.startPrice,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, imageUrls: newUrls }));
  };

  const handleAddImageUrl = () => {
    setFormData(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ''],
    }));
  };

  const handleRemoveImageUrl = (index) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      imageUrls: newUrls.length === 0 ? [''] : newUrls,
    }));
  };

  const handleSpecChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value,
      },
    }));
  };

  const handleAddSpecField = () => {
    const newKey = `spec_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [newKey]: '',
      },
    }));
  };

  const handleRemoveSpecField = (key) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData(prev => ({
      ...prev,
      specs: newSpecs,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.categoryId) errors.categoryId = 'Category is required';
    if (formData.imageUrls.filter(url => url.trim()).length === 0) {
      errors.imageUrls = 'At least one image URL is required';
    }
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (!formData.startPrice) errors.startPrice = 'Starting price is required';

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    if (startTime >= endTime) {
      errors.endTime = 'End time must be after start time';
    }

    return errors;
  };

  const handleSaveAuction = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);

      // Filter out empty image URLs
      const images = formData.imageUrls.filter(url => url.trim() !== '');

      // Prepare auction data with product details
      const auctionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        images: images.map(url => ({ url })),
        price: formData.price || 0,
        condition: formData.condition,
        stock: 1,
        specs: formData.specs,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        startPrice: parseFloat(formData.startPrice),
      };

      if (editingAuction) {
        // Update mode - only update auction timing and price
        await auctionAPI.updateAuction(editingAuction._id, {
          startTime: auctionData.startTime,
          endTime: auctionData.endTime,
          startPrice: auctionData.startPrice,
        });
        alert('Auction updated successfully!');
      } else {
        // Create mode - create new product with auction details
        await auctionAPI.createAuction(auctionData);
        alert('Auction created successfully!');
      }

      setShowModal(false);
      resetForm();
      loadAuctions();
    } catch (error) {
      console.error('Error saving auction:', error);
      alert(error.response?.data?.message || 'Failed to save auction');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this auction?')) {
      return;
    }

    try {
      await auctionAPI.cancelAuction(id);
      alert('Auction cancelled successfully');
      loadAuctions();
    } catch (error) {
      console.error('Error deleting auction:', error);
      alert('Failed to cancel auction');
    }
  };

  const handleViewDetails = (auction) => {
    setSelectedAuction(auction);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setEditingAuction(null);
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      imageUrls: [''],
      price: '',
      condition: 'new',
      specs: {},
      startTime: '',
      endTime: '',
      startPrice: '',
    });
    setFormErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Pending':
        return 'status-pending';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const timeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="admin-auction-container">
      <div className="auction-header">
        <h2>Auction Management</h2>
        <button className="btn-create" onClick={handleCreateAuction}>
          <FontAwesomeIcon icon={faPlus} /> Create Auction
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading auctions...</div>
      ) : auctions.length === 0 ? (
        <div className="no-auctions">
          <p>No auctions found. Create one to get started!</p>
        </div>
      ) : (
        <div className="auctions-grid">
          {auctions.map(auction => (
            <div key={auction._id} className="auction-card">
              <div className="auction-image">
                <img 
                  src={auction.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'} 
                  alt={auction.title}
                />
                <span className={`status-badge ${getStatusColor(auction.auctionDetails.status)}`}>
                  {auction.auctionDetails.status}
                </span>
              </div>
              
              <div className="auction-info">
                <h3>{auction.title}</h3>
                
                <div className="auction-details">
                  <div className="detail-row">
                    <span className="label">Base Price:</span>
                    <span className="value">₹{auction.auctionDetails.startPrice}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Current Bid:</span>
                    <span className="value">₹{auction.auctionDetails.currentBid}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Highest Bidder:</span>
                    <span className="value">
                      {auction.auctionDetails.highestBidder?.name || 'No bids yet'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Bid Count:</span>
                    <span className="value">{auction.auctionDetails.bidHistory?.length || 0}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Time Remaining:</span>
                    <span className="value timer">
                      <FontAwesomeIcon icon={faClock} /> {timeRemaining(auction.auctionDetails.endTime)}
                    </span>
                  </div>
                </div>

                <div className="auction-dates">
                  <small>Starts: {formatDate(auction.auctionDetails.startTime)}</small>
                  <small>Ends: {formatDate(auction.auctionDetails.endTime)}</small>
                </div>

                <div className="auction-actions">
                  <button 
                    className="btn-view"
                    onClick={() => handleViewDetails(auction)}
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEditAuction(auction)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteAuction(auction._id)}
                    title="Cancel"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal with inline product creation */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAuction ? 'Edit Auction' : 'Create New Auction with Product Details'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body scroll">
              <form onSubmit={handleSaveAuction}>
                {/* Product Information Section */}
                <fieldset className="form-section">
                  <legend>Product Information</legend>

                  {/* Title */}
                  <div className="form-group">
                    <label htmlFor="title">
                      Product Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter product title"
                      disabled={editingAuction ? true : false}
                    />
                    {formErrors.title && <span className="error">{formErrors.title}</span>}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label htmlFor="description">
                      Description <span className="required">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter product description"
                      rows="4"
                      disabled={editingAuction ? true : false}
                    />
                    {formErrors.description && <span className="error">{formErrors.description}</span>}
                  </div>

                  {/* Row: Category and Condition */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="categoryId">
                        Category <span className="required">*</span>
                      </label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        disabled={editingAuction ? true : false}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.categoryId && <span className="error">{formErrors.categoryId}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="condition">Condition</label>
                      <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        disabled={editingAuction ? true : false}
                      >
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="refurbished">Refurbished</option>
                      </select>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label htmlFor="price">Price (Optional - Display Price)</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter base price (optional)"
                      disabled={editingAuction ? true : false}
                    />
                  </div>

                  {/* Image URLs */}
                  <div className="form-group">
                    <label>
                      Product Images <span className="required">*</span>
                    </label>
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="image-url-input">
                        <input
                          type="url"
                          value={url}
                          onChange={e => handleImageUrlChange(index, e.target.value)}
                          placeholder={`Image URL ${index + 1} (e.g., https://example.com/image.jpg)`}
                          disabled={editingAuction ? true : false}
                        />
                        {formData.imageUrls.length > 1 && !editingAuction && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemoveImageUrl(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {formErrors.imageUrls && <span className="error">{formErrors.imageUrls}</span>}
                    {!editingAuction && (
                      <button
                        type="button"
                        className="btn-add-image"
                        onClick={handleAddImageUrl}
                      >
                        + Add Another Image
                      </button>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="form-group">
                    <label>Specifications</label>
                    {Object.entries(formData.specs).map(([key, value]) => (
                      <div key={key} className="spec-input">
                        <input
                          type="text"
                          value={key}
                          placeholder="Spec name (e.g., Brand)"
                          disabled
                          className="spec-name"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={e => handleSpecChange(key, e.target.value)}
                          placeholder="Spec value"
                          disabled={editingAuction ? true : false}
                        />
                        {!editingAuction && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemoveSpecField(key)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {!editingAuction && (
                      <button
                        type="button"
                        className="btn-add-spec"
                        onClick={handleAddSpecField}
                      >
                        + Add Specification
                      </button>
                    )}
                  </div>
                </fieldset>

                {/* Auction Details Section */}
                <fieldset className="form-section">
                  <legend>Auction Details</legend>

                  {/* Row: Start and End Time */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="startTime">
                        Start Time <span className="required">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                      />
                      {formErrors.startTime && <span className="error">{formErrors.startTime}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="endTime">
                        End Time <span className="required">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                      />
                      {formErrors.endTime && <span className="error">{formErrors.endTime}</span>}
                    </div>
                  </div>

                  {/* Starting Price */}
                  <div className="form-group">
                    <label htmlFor="startPrice">
                      Starting Price <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="startPrice"
                      name="startPrice"
                      value={formData.startPrice}
                      onChange={handleInputChange}
                      placeholder="Enter starting bid price"
                      step="0.01"
                      min="0"
                    />
                    {formErrors.startPrice && <span className="error">{formErrors.startPrice}</span>}
                  </div>
                </fieldset>

                {/* Form Actions */}
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    <FontAwesomeIcon icon={faSave} /> {loading ? 'Saving...' : editingAuction ? 'Update Auction' : 'Create Auction'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Auction Details</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body detail-view">
              <div className="detail-section">
                <h4>Product Information</h4>
                <p><strong>Title:</strong> {selectedAuction.title}</p>
                <p><strong>Description:</strong> {selectedAuction.description}</p>
                <p><strong>Category:</strong> {selectedAuction.categoryId?.name || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h4>Auction Details</h4>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusColor(selectedAuction.auctionDetails.status)}`}>{selectedAuction.auctionDetails.status}</span></p>
                <p><strong>Starting Price:</strong> ₹{selectedAuction.auctionDetails.startPrice}</p>
                <p><strong>Current Bid:</strong> ₹{selectedAuction.auctionDetails.currentBid}</p>
                <p><strong>Start Time:</strong> {formatDate(selectedAuction.auctionDetails.startTime)}</p>
                <p><strong>End Time:</strong> {formatDate(selectedAuction.auctionDetails.endTime)}</p>
              </div>

              <div className="detail-section">
                <h4>Bidding Information</h4>
                <p><strong>Total Bids:</strong> {selectedAuction.auctionDetails.bidHistory?.length || 0}</p>
                <p><strong>Highest Bidder:</strong> {selectedAuction.auctionDetails.highestBidder?.name || 'No bids yet'}</p>
                
                {selectedAuction.auctionDetails.bidHistory && selectedAuction.auctionDetails.bidHistory.length > 0 && (
                  <div className="bid-history">
                    <h5>Recent Bids</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Bidder</th>
                          <th>Amount</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.auctionDetails.bidHistory.slice(0, 10).map((bid, idx) => (
                          <tr key={idx}>
                            <td>{bid.user?.name || 'Anonymous'}</td>
                            <td>₹{bid.amount}</td>
                            <td>{formatDate(bid.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionManagement;
