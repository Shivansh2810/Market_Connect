import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddProduct from '../AddProduct';
import { ProductsProvider } from '../../../contexts/ProductsContext';
import api from '../../../../services/axios';

vi.mock('../../../../services/axios');
vi.mock('../../../../services/product');

const mockOnBack = vi.fn();
const mockOnSave = vi.fn();

const renderAddProduct = (product = null) => {
  return render(
    <ProductsProvider>
      <AddProduct onBack={mockOnBack} onSave={mockOnSave} product={product} />
    </ProductsProvider>
  );
};

describe('AddProduct Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add product form', () => {
    renderAddProduct();
    
    expect(screen.getByText(/Add New Product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderAddProduct();
    
    const submitButton = screen.getByText(/Save Product/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });

  it('handles title input', () => {
    renderAddProduct();
    
    const titleInput = screen.getByLabelText(/Product Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Product' } });
    
    expect(titleInput.value).toBe('Test Product');
  });

  it('auto-generates slug from title', () => {
    renderAddProduct();
    
    const titleInput = screen.getByLabelText(/Product Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Product Name' } });
    
    const slugInput = screen.getByLabelText(/Slug/i);
    expect(slugInput.value).toBe('test-product-name');
  });

  it('calculates discount percentage', () => {
    renderAddProduct();
    
    const originalPriceInput = screen.getByLabelText(/Original Price/i);
    const priceInput = screen.getByLabelText(/Selling Price/i);
    
    fireEvent.change(originalPriceInput, { target: { value: '1000' } });
    fireEvent.change(priceInput, { target: { value: '800' } });
    
    const discountInput = screen.getByLabelText(/Discount/i);
    expect(discountInput.value).toBe('20');
  });

  it('adds tags', () => {
    renderAddProduct();
    
    const tagInput = screen.getByPlaceholderText(/Enter tag/i);
    fireEvent.change(tagInput, { target: { value: 'electronics' } });
    
    const addTagButton = screen.getByText(/Add Tag/i);
    fireEvent.click(addTagButton);
    
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('removes tags', () => {
    renderAddProduct();
    
    const tagInput = screen.getByPlaceholderText(/Enter tag/i);
    fireEvent.change(tagInput, { target: { value: 'electronics' } });
    
    const addTagButton = screen.getByText(/Add Tag/i);
    fireEvent.click(addTagButton);
    
    const removeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('electronics')).not.toBeInTheDocument();
  });

  it('handles back button', () => {
    renderAddProduct();
    
    const backButton = screen.getByText(/Back to Products/i);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('pre-fills form when editing product', () => {
    const mockProduct = {
      _id: '1',
      title: 'Existing Product',
      description: 'Test description',
      price: 999,
      stock: 10,
      categoryId: 'cat1',
      images: []
    };
    
    renderAddProduct(mockProduct);
    
    expect(screen.getByText(/Edit Product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Title/i).value).toBe('Existing Product');
  });
});
