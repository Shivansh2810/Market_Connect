import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductDetail from '../components/buyer dashboard/ProductDetail';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { getProductById as fetchProductById } from '../../api/product';
// import DebugProductData from '../components/DebugProductData'; // Uncomment for debugging

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
      try {
        setLoading(true);
        setError('');
        
        // First try to get from context
        const existingProduct = getProductById(productId);
        if (existingProduct) {
          console.log('✅ Product found in context:', existingProduct);
          setProduct(existingProduct);
          setLoading(false);
          return;
        }

        // If not in context, fetch from API
        console.log('🔄 Fetching product from API:', productId);
        const response = await fetchProductById(productId);
        console.log('📦 API Response:', response);

        let fetchedProduct = null;
        if (response?.success && response.product) {
          fetchedProduct = response.product;
        } else if (response?.data) {
          fetchedProduct = response.data;
        } else if (response?.product) {
          fetchedProduct = response.product;
        } else {
          fetchedProduct = response;
        }

        console.log('✅ Fetched product:', fetchedProduct);

        if (fetchedProduct && fetchedProduct._id) {
          setProduct(fetchedProduct);
        } else {
          console.error('❌ Invalid product data:', fetchedProduct);
          setError('Product not found.');
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch product:', fetchError);
        console.error('Error details:', fetchError.response?.data);
        setError(fetchError.response?.data?.message || 'Unable to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    } else {
      setError('No product ID provided.');
      setLoading(false);
    }
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
    <>
      <ProductDetail
        product={product}
        onBack={handleBack}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
      {/* Uncomment below to see product data in bottom-right corner */}
      {/* <DebugProductData product={product} /> */}
    </>
  );
};

export default ProductDetailPage;