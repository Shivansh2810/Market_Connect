import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductDetail from '../components/buyer dashboard/ProductDetail';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { getProductById } = useProducts();
  const { addToCart, replaceCartWith } = useCart();

  const product = getProductById(productId);

  if (!product) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p>The product you are looking for could not be found.</p>
        <button
          type="button"
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddToCart = (selectedProduct, quantity) => {
    addToCart(selectedProduct, quantity);
  };

  const handleBuyNow = (selectedProduct, quantity) => {
    replaceCartWith(selectedProduct, quantity);
    navigate('/checkout');
  };

  return (
    <ProductDetail
      product={product}
      onBack={handleBack}
      onAddToCart={handleAddToCart}
      onBuyNow={handleBuyNow}
    />
  );
};

export default ProductDetailPage;
