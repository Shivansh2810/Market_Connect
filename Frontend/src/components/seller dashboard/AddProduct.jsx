import React, { useState } from 'react';
import { useProducts } from '../../contexts/ProductsContext'; // <-- 1. IMPORTED
import './AddProduct.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faTimes,
  faPlus,
  faTrash,
  faImage,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../api/axios';

const AddProduct = ({ onBack, onSave, product = null }) => {
  const { categories, loading: categoriesLoading } = useProducts(); // <-- 2. ADDED HOOK
  const isEditing = product !== null;

  // Initialize form data - if editing, pre-fill with product data
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    categoryId: product?.categoryId || product?.category?._id || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    discount: product?.discount || '',
    currency: product?.currency || 'INR',
    stock: product?.stock || '',
    condition: product?.condition || 'new',
    tags: product?.tags || [],
    images: product?.images || [],
    specs: product?.specs || {}
  });

  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // 3. DELETED the hardcoded 'categories' array

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice, discountPercent) => {
    if (!originalPrice || !discountPercent) return originalPrice;
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate slug from title
    if (field === 'title') {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: generateSlug(value)
      }));
    }

    // Auto-calculate discount percentage when original price or price changes
    if (field === 'originalPrice' && value && formData.price) {
      const discount = calculateDiscount(parseFloat(value), parseFloat(formData.price));
      setFormData(prev => ({
        ...prev,
        originalPrice: value,
        discount: discount.toString()
      }));
    }
    
    if (field === 'price' && value && formData.originalPrice) {
      const discount = calculateDiscount(parseFloat(formData.originalPrice), parseFloat(value));
      setFormData(prev => ({
        ...prev,
        price: value,
        discount: discount.toString()
      }));
    }

    // Auto-calculate price when discount percentage changes
    if (field === 'discount' && value && formData.originalPrice) {
      const discountedPrice = calculateDiscountedPrice(parseFloat(formData.originalPrice), parseFloat(value));
      setFormData(prev => ({
        ...prev,
        discount: value,
        price: discountedPrice.toString()
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Add spec
  const handleAddSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specs: {
          ...prev.specs,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  // Remove spec
  const handleRemoveSpec = (keyToRemove) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[keyToRemove];
    setFormData(prev => ({
      ...prev,
      specs: newSpecs
    }));
  };

  // Handle image upload (mock - in real app, this would upload to cloud storage)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imagePromises = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            url: event.target.result,
            publicId: `temp_${Date.now()}_${Math.random()}`,
            isPrimary:
              formData.images.length === 0 && index === 0,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
      setImageFiles((prev) => [...prev, ...files]);
    });
  };

  // Remove image
  const handleRemoveImage = (index) => {
    const currentImage = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);

    // Track backend images to delete by publicId
    if (
      currentImage &&
      currentImage.publicId &&
      !String(currentImage.publicId).startsWith('temp_')
    ) {
      setImagesToDelete((prev) =>
        prev.includes(currentImage.publicId)
          ? prev
          : [...prev, currentImage.publicId]
      );
    }

    // Make first image primary if we removed the primary one
    if (newImages.length > 0 && currentImage?.isPrimary) {
      newImages[0].isPrimary = true;
    }

    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));

    setImageFiles((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  // Set primary image
  const handleSetPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare product data matching backend structure for local UI update
    const productData = {
      title: formData.title.trim(),
      slug: generateSlug(formData.title),
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
      currency: formData.currency,
      stock: parseInt(formData.stock, 10),
      condition: formData.condition,
      tags: formData.tags,
      images: formData.images,
      specs: formData.specs,
    };

    // Add product ID if editing (backend _id is passed via product.id or product._id)
    if (isEditing && product) {
      productData.id = product._id || product.id;
      productData._id = product._id || product.id;
    }

    try {
      const formDataPayload = new FormData();

      formDataPayload.append('title', productData.title);
      formDataPayload.append('slug', productData.slug);
      formDataPayload.append('description', productData.description);
      formDataPayload.append('categoryId', productData.categoryId);
      formDataPayload.append('price', String(productData.price));
      if (productData.originalPrice !== null) {
        formDataPayload.append(
          'originalPrice',
          String(productData.originalPrice)
        );
      }
      if (productData.discount !== null) {
        formDataPayload.append('discount', String(productData.discount));
      }
      formDataPayload.append('currency', productData.currency);
      formDataPayload.append('stock', String(productData.stock));
      formDataPayload.append('condition', productData.condition);

      // tags -> repeated field so backend sees an array
      productData.tags.forEach((tag) => {
        formDataPayload.append('tags', tag);
      });

      // specs -> flatten as specs[key] = value
      Object.entries(productData.specs || {}).forEach(([key, value]) => {
        formDataPayload.append(`specs[${key}]`, value);
      });

      // New images to upload
      imageFiles.forEach((file) => {
        formDataPayload.append('images', file);
      });

      // Images to delete for edits
      if (isEditing && imagesToDelete.length) {
        imagesToDelete.forEach((publicId) => {
          formDataPayload.append('imagesToDelete', publicId);
        });
      }

      let response;
      const productId = product?._id || product?.id;
      if (isEditing && productId) {
        response = await api.put(`/products/${productId}`, formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/products', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const savedProduct = response?.data?.product;
      if (savedProduct) {
        productData.id = savedProduct._id;
        productData._id = savedProduct._id;
      }

      if (onSave) {
        onSave(productData);
      } else {
        console.log('Product data to save:', productData);
        alert('Product saved successfully! (This is a mock - integrate with API)');
        onBack();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <div className="add-product-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Products
          </button>
          <h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <form className="add-product-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">
                Product Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="Enter product title"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="slug">Slug (Auto-generated)</label>
              <input
                type="text"
                id="slug"
                value={generateSlug(formData.title)}
                readOnly
                className="readonly"
                placeholder="Slug will be generated from title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'error' : ''}
                placeholder="Enter product description"
                rows="5"
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              {/* --- 4. UPDATED THIS SECTION --- */}
              <div className="form-group">
                <label htmlFor="categoryId">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={errors.categoryId ? 'error' : ''}
                  disabled={categoriesLoading} 
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
              </div>
              {/* --- END OF UPDATE --- */}

              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing & Inventory</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="originalPrice">
                  Original Price
                </label>
                <input
                  type="number"
                  id="originalPrice"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <small className="form-hint">Leave empty if no discount</small>
              </div>

              <div className="form-group">
                <label htmlFor="discount">
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="discount"
                  value={formData.discount}
                  onChange={(e) => handleInputChange('discount', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                />
                <small className="form-hint">Auto-calculated if original price set</small>
              </div>

              <div className="form-group">
                <label htmlFor="price">
                  Selling Price <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={errors.price ? 'error' : ''}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {formData.originalPrice && formData.price && (
                  <div className="discount-badge">
                    {calculateDiscount(parseFloat(formData.originalPrice), parseFloat(formData.price))}% OFF
                  </div>
                )}
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="stock">
                  Stock Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className={errors.stock ? 'error' : ''}
                  placeholder="0"
                  min="0"
                />
                {errors.stock && <span className="error-message">{errors.stock}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Product Images</h3>
            <div className="form-group">
              <label>
                Upload Images <span className="required">*</span>
              </label>
              <div className="image-upload-area">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="upload-button">
                  <FontAwesomeIcon icon={faUpload} />
                  Upload Images
                </label>
              </div>
              {errors.images && <span className="error-message">{errors.images}</span>}
              
              {formData.images.length > 0 && (
                <div className="images-preview">
                  {formData.images.map((image, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={image.url} alt={`Preview ${index + 1}`} />
                      <div className="image-overlay">
                        {image.isPrimary && (
                          <span className="primary-badge">Primary</span>
                        )}
                        <div className="image-actions">
                          {!image.isPrimary && (
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleSetPrimaryImage(index)}
                              title="Set as primary"
                            >
                              <FontAwesomeIcon icon={faImage} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-btn delete"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Tags</h3>
            <div className="form-group">
              <label>Product Tags</label>
              <div className="tags-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Enter tag and press Enter"
                />
                <button
                  type="button"
                  className="btn-add-tag"
                  onClick={handleAddTag}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Tag
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Specifications</h3>
            <div className="form-group">
              <label>Product Specifications</label>
              <div className="specs-input">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Specification name (e.g., Brand)"
                />
                <input
                  type="text"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="Specification value (e.g., AudioTech)"
                />
                <button
                  type="button"
                  className="btn-add-spec"
                  onClick={handleAddSpec}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Spec
                </button>
              </div>
              {Object.keys(formData.specs).length > 0 && (
                <div className="specs-list">
                  {Object.entries(formData.specs).map(([key, value]) => (
                    <div key={key} className="spec-item">
                      <span className="spec-key">{key}:</span>
                      <span className="spec-value">{value}</span>
                      <button
                        type="button"
                        className="spec-remove"
                        onClick={() => handleRemoveSpec(key)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onBack}>
              <FontAwesomeIcon icon={faTimes} />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <FontAwesomeIcon icon={faSave} />
              {isEditing ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;