import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExchangeAlt, FaTimes } from 'react-icons/fa';
import './CompareSelector.css';

const CompareSelector = () => {
  const [compareList, setCompareList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('compareProducts');
    if (stored) {
      setCompareList(JSON.parse(stored));
    }

    // Listen for storage events to update the list
    const handleStorageChange = () => {
      const updated = localStorage.getItem('compareProducts');
      setCompareList(updated ? JSON.parse(updated) : []);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const removeFromCompare = (productId) => {
    const updated = compareList.filter(p => p._id !== productId);
    setCompareList(updated);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
  };

  const handleCompare = () => {
    if (compareList.length === 2) {
      const ids = compareList.map(p => p._id).join(',');
      navigate(`/compare?ids=${ids}`);
    }
  };

  const clearAll = () => {
    setCompareList([]);
    localStorage.removeItem('compareProducts');
  };

  if (compareList.length === 0) return null;

  return (
    <div className="compare-selector-widget">
      <div className="compare-header">
        <FaExchangeAlt />
        <span>Compare Products ({compareList.length}/2)</span>
        <button onClick={clearAll} className="clear-all-btn">
          Clear All
        </button>
      </div>
      
      <div className="compare-products-list">
        {compareList.map((product) => (
          <div key={product._id} className="compare-product-item">
            <img 
              src={product.images?.[0]?.url || '/placeholder.png'} 
              alt={product.title} 
            />
            <span className="product-name">{product.title}</span>
            <button 
              onClick={() => removeFromCompare(product._id)}
              className="remove-btn"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {compareList.length === 2 && (
        <button onClick={handleCompare} className="compare-now-btn">
          Compare Now
        </button>
      )}
      
      {compareList.length < 2 && (
        <p className="compare-hint">Add one more product to compare</p>
      )}
    </div>
  );
};

export default CompareSelector;

// Update CompareSelector to listen for storage events
export const updateCompareList = () => {
  window.dispatchEvent(new Event('storage'));
};
