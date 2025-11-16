import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductDetail from '../components/buyer dashboard/ProductDetail';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { getProductById as fetchProductById } from '../../api/product';
import api from '../../api/axios'; // Import the base api instance

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { loading: productsLoading } = useProducts(); // Keep this for the initial load feel
  const { addToCart, replaceCartWith } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]); // <-- 1. ADD REVIEWS STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 2. MODIFIED THIS ENTIRE FUNCTION
    const loadProductAndReviews = async () => {
      if (!productId) {
        setError('No product ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Fetch both product and reviews in parallel
        const [productResponse, reviewsResponse] = await Promise.all([
          fetchProductById(productId), // This is api.get(`/products/${productId}`)
          api.get(`/reviews/product/${productId}`) // Fetch reviews
        ]);

        // --- Process Product ---
        let fetchedProduct = null;
        if (productResponse?.success && productResponse.product) {
          fetchedProduct = productResponse.product;
        } else if (productResponse?.data?.product) { 
          fetchedProduct = productResponse.data.product;
        } else if (productResponse?.product) {
          fetchedProduct = productResponse.product;
        } else if (productResponse?._id) { // Handle case where raw product is returned
          fetchedProduct = productResponse;
        }

        if (fetchedProduct && fetchedProduct._id) {
          setProduct(fetchedProduct);
        } else {
          throw new Error('Product not found.');
        }

        // --- Process Reviews ---
        if (reviewsResponse?.data?.success && Array.isArray(reviewsResponse.data.data)) {
          setReviews(reviewsResponse.data.data);
        } else {
          console.warn('Could not fetch reviews.');
          setReviews([]);
        }

      } catch (fetchError) {
        console.error('❌ Failed to fetch product data:', fetchError);
        setError(fetchError.response?.data?.message || 'Unable to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndReviews();
  }, [productId]); // No longer need getProductById from context

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
    <>
      <ProductDetail
        product={product}
        reviews={reviews} // <-- 3. PASS REVIEWS AS A PROP
        onBack={handleBack}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </>
  );
};

export default ProductDetailPage;