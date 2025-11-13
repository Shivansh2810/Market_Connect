import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductDetail from '../components/buyer dashboard/ProductDetail';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { getProductById as fetchProductById } from '../../api/product';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { getProductById, loading: productsLoading } = useProducts();
  const { addToCart, replaceCartWith } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      const existingProduct = getProductById(productId);
      if (existingProduct) {
        setProduct(existingProduct);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await fetchProductById(productId);

        let fetchedProduct = null;
        if (response?.success && response.product) {
          fetchedProduct = response.product;
        } else if (response?.data) {
          fetchedProduct = response.data;
        } else {
          fetchedProduct = response;
        }

        if (fetchedProduct) {
          setProduct(fetchedProduct);
        } else {
          setError('Product not found.');
        }
      } catch (fetchError) {
        console.error('Failed to fetch product', fetchError);
        setError(fetchError.response?.data?.message || 'Unable to load product.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, getProductById]);

  if (loading || productsLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading product...</h2>
        <p>Please wait while we fetch the latest details.</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p>{error || 'The product you are looking for could not be found.'}</p>
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