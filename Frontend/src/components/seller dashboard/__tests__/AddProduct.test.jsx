import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const categoriesFixture = [
  { _id: 'cat-1', name: 'Electronics' },
  { _id: 'cat-2', name: 'Accessories' },
];

const useProductsMock = vi.fn();
const apiPostMock = vi.fn();
const apiPutMock = vi.fn();

vi.mock('../../../contexts/ProductsContext', () => ({
  useProducts: () => useProductsMock(),
}));

vi.mock('../../../../services/axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => apiPostMock(...args),
    put: (...args) => apiPutMock(...args),
  },
}));

let AddProduct;

const mockOnBack = vi.fn();
const mockOnSave = vi.fn();

const renderAddProduct = (product = null, overrides = {}, options = {}) => {
  useProductsMock.mockReturnValue({
    categories: categoriesFixture,
    loading: false,
    ...overrides,
  });

  return render(
    <AddProduct
      onBack={mockOnBack}
      onSave={options.omitOnSave ? undefined : mockOnSave}
      product={product}
    />
  );
};

const getFileInput = () => screen.getByLabelText(/Upload Images/i);

const createImageFile = (name) => new File(['image'], name, { type: 'image/png' });

beforeAll(async () => {
  class MockFileReader {
    readAsDataURL(file) {
      if (this.onload) {
        setTimeout(() => {
          this.onload({ target: { result: `data-${file.name}` } });
        }, 0);
      }
    }
  }

  global.FileReader = MockFileReader;
  AddProduct = (await import('../AddProduct')).default;
});

const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

beforeEach(() => {
  useProductsMock.mockReset();
  apiPostMock.mockReset();
  apiPutMock.mockReset();
  mockOnBack.mockReset();
  mockOnSave.mockReset();
  alertMock.mockClear();
});

afterAll(() => {
  alertMock.mockRestore();
});

describe('AddProduct Component', () => {
  it('renders provided categories and handles loading state', () => {
    const { unmount } = renderAddProduct();

    expect(screen.getByText(/Add New Product/i)).toBeInTheDocument();
    const select = screen.getByLabelText(/Category/i);
    expect(select).toHaveValue('');
    expect(screen.getByText('Electronics')).toBeInTheDocument();

    unmount();
    renderAddProduct(null, { categories: [], loading: true });
    expect(screen.getByLabelText(/Category/i)).toBeDisabled();
    expect(screen.getByText(/Loading categories/i)).toBeInTheDocument();
  });

  it('validates required fields and clears errors when corrected', async () => {
    renderAddProduct();

    fireEvent.click(screen.getByRole('button', { name: /Save Product/i }));

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Category is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Valid price is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Valid stock quantity is required/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one image is required/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Product Title/i), { target: { value: 'Camera' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Compact camera' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '4' } });

    expect(screen.queryByText(/Title is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Description is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Category is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Valid price is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Valid stock quantity is required/i)).not.toBeInTheDocument();
  });

  it('generates slug and recalculates discount and price', async () => {
    renderAddProduct();

    const titleInput = screen.getByLabelText(/Product Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Product Name' } });
    expect(screen.getByLabelText(/Slug/i)).toHaveValue('test-product-name');

    const originalPrice = screen.getByLabelText(/Original Price/i);
    const price = screen.getByLabelText(/Selling Price/i);
    const discount = screen.getByLabelText(/Discount/i);
    const currency = screen.getByLabelText(/Currency/i);

    fireEvent.change(originalPrice, { target: { value: '1000' } });
    fireEvent.change(price, { target: { value: '800' } });
    expect(discount).toHaveValue(20);

    fireEvent.change(discount, { target: { value: '15' } });

    await waitFor(() => {
      expect(price).toHaveValue(850);
    });

    fireEvent.change(price, { target: { value: '1000' } });
    await waitFor(() => {
      expect(discount).toHaveValue(0);
    });

    fireEvent.change(currency, { target: { value: 'USD' } });
    expect(currency).toHaveValue('USD');
  });

  it('manages tags and specifications', () => {
    renderAddProduct();

    const tagInput = screen.getByPlaceholderText(/Enter tag/i);
    fireEvent.change(tagInput, { target: { value: 'electronics' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Tag/i }));
    expect(screen.getAllByText('electronics')).toHaveLength(1);

    fireEvent.change(tagInput, { target: { value: 'electronics' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Tag/i }));
    expect(screen.getAllByText('electronics')).toHaveLength(1);

    const tagChip = screen.getByText('electronics').closest('.tag-item');
    fireEvent.click(within(tagChip).getByRole('button'));
    expect(screen.queryByText('electronics')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Specification name/i), { target: { value: 'Brand' } });
    fireEvent.change(screen.getByPlaceholderText(/Specification value/i), { target: { value: 'Acme' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Spec/i }));
    expect(screen.getByText('Brand:')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();

    const specItem = screen.getByText('Brand:').closest('.spec-item');
    fireEvent.click(within(specItem).getByRole('button'));
    expect(screen.queryByText('Brand:')).not.toBeInTheDocument();
  });

  it('ignores empty image selections', () => {
    renderAddProduct();
    fireEvent.change(getFileInput(), { target: { files: [] } });
    expect(screen.queryByAltText(/Preview/i)).toBeNull();
  });

  it('handles image upload, primary selection, and removal', async () => {
    renderAddProduct();

    const input = getFileInput();
    fireEvent.change(input, { target: { files: [createImageFile('one.png'), createImageFile('two.png')] } });

    const previews = await screen.findAllByAltText(/Preview/i);
    expect(previews).toHaveLength(2);
    expect(screen.getAllByText(/Primary/)).toHaveLength(1);

    const setPrimaryButtons = screen.getAllByTitle(/Set as primary/i);
    fireEvent.click(setPrimaryButtons[0]);

    await waitFor(() => {
      const containers = screen.getAllByText(/Primary/).map((badge) => badge.closest('.image-preview-item'));
      expect(containers).toHaveLength(1);
      expect(within(containers[0]).getByText(/Primary/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle(/Remove image/i)[0]);
    await waitFor(() => {
      expect(screen.getAllByAltText(/Preview/i)).toHaveLength(1);
      expect(screen.getByText(/Primary/)).toBeInTheDocument();
    });
  });

  it('submits new product data and invokes onSave', async () => {
    apiPostMock.mockResolvedValue({ data: { product: { _id: 'server-1' } } });
    renderAddProduct();

    fireEvent.change(screen.getByLabelText(/Product Title/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Great gadget' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText(/Original Price/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '800' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '5' } });

    const file = createImageFile('primary.png');
    fireEvent.change(getFileInput(), { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getAllByAltText(/Preview/i)).toHaveLength(1);
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter tag/i), { target: { value: 'electronics' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Tag/i }));
    fireEvent.change(screen.getByPlaceholderText(/Specification name/i), { target: { value: 'Brand' } });
    fireEvent.change(screen.getByPlaceholderText(/Specification value/i), { target: { value: 'Acme' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Spec/i }));

    fireEvent.click(screen.getByRole('button', { name: /Save Product/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });

    const [url, payload] = apiPostMock.mock.calls[0];
    expect(url).toBe('/products');
    expect(payload.get('title')).toBe('New Product');
    expect(payload.get('slug')).toBe('new-product');
    expect(payload.get('description')).toBe('Great gadget');
    expect(payload.get('categoryId')).toBe('cat-1');
    expect(payload.get('price')).toBe('800');
    expect(payload.get('stock')).toBe('5');
    expect(payload.getAll('tags')).toEqual(['electronics']);

    const savedProduct = mockOnSave.mock.calls[0][0];
    expect(savedProduct).toMatchObject({
      title: 'New Product',
      slug: 'new-product',
      price: 800,
      originalPrice: 1000,
      discount: 20,
      stock: 5,
      currency: 'INR',
      tags: ['electronics'],
      specs: { Brand: 'Acme' },
      _id: 'server-1',
    });
    expect(Array.isArray(savedProduct.images)).toBe(true);
  });

  it('alerts when product submission fails', async () => {
    apiPostMock.mockRejectedValueOnce(new Error('Network issue'));
    renderAddProduct();

    fireEvent.change(screen.getByLabelText(/Product Title/i), { target: { value: 'Failure Product' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Bad luck' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '1' } });
    fireEvent.change(getFileInput(), { target: { files: [createImageFile('fail.png')] } });
    await waitFor(() => {
      expect(screen.getAllByAltText(/Preview/i)).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Product/i }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to save product. Please try again.');
    });
  });

  it('falls back to alert flow when onSave is absent', async () => {
    apiPostMock.mockResolvedValue({ data: { product: { _id: 'local-1' } } });
    renderAddProduct(null, {}, { omitOnSave: true });

    fireEvent.change(screen.getByLabelText(/Product Title/i), { target: { value: 'Standalone Product' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'No callback' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '2' } });
    fireEvent.change(getFileInput(), { target: { files: [createImageFile('solo.png')] } });

    await waitFor(() => {
      expect(screen.getAllByAltText(/Preview/i)).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Product/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Product saved successfully! (This is a mock - integrate with API)');
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });
  it('updates existing product via PUT and tracks deleted images', async () => {
    apiPutMock.mockResolvedValue({ data: { product: { _id: 'prod-1' } } });
    const existingProduct = {
      _id: 'prod-1',
      title: 'Existing Product',
      description: 'Existing description',
      categoryId: 'cat-2',
      price: 500,
      originalPrice: 700,
      discount: 29,
      currency: 'INR',
      stock: 3,
      condition: 'used',
      tags: ['legacy'],
      images: [
        { url: 'one.jpg', publicId: 'old-one', isPrimary: true },
        { url: 'two.jpg', publicId: 'old-two', isPrimary: false },
      ],
      specs: { Warranty: '1 year' },
    };

    renderAddProduct(existingProduct);

    fireEvent.change(screen.getByLabelText(/Product Title/i), { target: { value: 'Existing Product Updated' } });
    fireEvent.click(screen.getAllByTitle(/Remove image/i)[0]);
    fireEvent.change(getFileInput(), { target: { files: [createImageFile('added.png')] } });

    fireEvent.click(screen.getByRole('button', { name: /Update Product/i }));

    await waitFor(() => {
      expect(apiPutMock).toHaveBeenCalledWith('/products/prod-1', expect.any(FormData), expect.any(Object));
      expect(mockOnSave).toHaveBeenCalled();
    });

    const [, payload] = apiPutMock.mock.calls[0];
    expect(payload.getAll('imagesToDelete')).toEqual(['old-one']);

    const savedProduct = mockOnSave.mock.calls[0][0];
    expect(savedProduct).toMatchObject({
      title: 'Existing Product Updated',
      _id: 'prod-1',
      id: 'prod-1',
      tags: ['legacy'],
    });
    expect(savedProduct.images.length).toBeGreaterThan(0);
  });

  it('invokes onBack from toolbar and footer controls', () => {
    renderAddProduct();

    fireEvent.click(screen.getByRole('button', { name: /Back to Products/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockOnBack).toHaveBeenCalledTimes(2);
  });
});
