import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AmendForm from '../AmendForm';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AmendForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form elements', () => {
    render(<AmendForm />);
    
    // Check for all form fields
    expect(screen.getByText('Amend Sale')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('Invoice ID:')).toBeInTheDocument();
    expect(screen.getByText('Item ID:')).toBeInTheDocument();
    expect(screen.getByText('Cost (in pennies):')).toBeInTheDocument();
    expect(screen.getByText('Tax Rate:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Amend' })).toBeInTheDocument();
  });

  test('validates empty fields', async () => {
    render(<AmendForm />);
    
    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Amend' }));
    
    expect(await screen.findByText('Please fill in all fields before submitting.')).toBeInTheDocument();
  });

  test('validates partial form submission', async () => {
    render(<AmendForm />);
    
    // Fill only some fields
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });
    
    const invoiceInput = screen.getByLabelText('Invoice ID:');
    fireEvent.change(invoiceInput, { target: { value: 'INV001' } });
    
    // Submit without filling all fields
    fireEvent.click(screen.getByRole('button', { name: 'Amend' }));
    
    expect(await screen.findByText('Please fill in all fields before submitting.')).toBeInTheDocument();
  });

  test('successfully submits amendment', async () => {
    render(<AmendForm />);
    
    // Fill all fields
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });
    
    const invoiceInput = screen.getByLabelText('Invoice ID:');
    fireEvent.change(invoiceInput, { target: { value: 'INV001' } });
    
    const itemIdInput = screen.getByLabelText('Item ID:');
    fireEvent.change(itemIdInput, { target: { value: 'ITEM001' } });
    
    const costInput = screen.getByLabelText('Cost (in pennies):');
    fireEvent.change(costInput, { target: { value: '1000' } });
    
    const taxRateInput = screen.getByLabelText('Tax Rate:');
    fireEvent.change(taxRateInput, { target: { value: '0.2' } });

    // Mock successful API response
    mockedAxios.patch.mockResolvedValueOnce({ status: 200 });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Amend' }));

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Sale amended successfully!')).toBeInTheDocument();
    });

    // Verify API call
    expect(mockedAxios.patch).toHaveBeenCalledWith('/sale', {
      date: expect.any(String),
      invoiceId: 'INV001',
      itemId: 'ITEM001',
      cost: 1000,
      taxRate: 0.2
    });
  });

  test('handles API error', async () => {
    render(<AmendForm />);
    
    // Fill all fields
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });
    
    const invoiceInput = screen.getByLabelText('Invoice ID:');
    fireEvent.change(invoiceInput, { target: { value: 'INV001' } });
    
    const itemIdInput = screen.getByLabelText('Item ID:');
    fireEvent.change(itemIdInput, { target: { value: 'ITEM001' } });
    
    const costInput = screen.getByLabelText('Cost (in pennies):');
    fireEvent.change(costInput, { target: { value: '1000' } });
    
    const taxRateInput = screen.getByLabelText('Tax Rate:');
    fireEvent.change(taxRateInput, { target: { value: '0.2' } });

    // Mock API error
    const errorMessage = 'Network error';
    mockedAxios.patch.mockRejectedValueOnce(new Error(errorMessage));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Amend' }));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText(`Error amending sale: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  test('resets form after successful submission', async () => {
    render(<AmendForm />);
    
    // Fill all fields
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });
    
    const invoiceInput = screen.getByLabelText('Invoice ID:');
    fireEvent.change(invoiceInput, { target: { value: 'INV001' } });
    
    const itemIdInput = screen.getByLabelText('Item ID:');
    fireEvent.change(itemIdInput, { target: { value: 'ITEM001' } });
    
    const costInput = screen.getByLabelText('Cost (in pennies):');
    fireEvent.change(costInput, { target: { value: '1000' } });
    
    const taxRateInput = screen.getByLabelText('Tax Rate:');
    fireEvent.change(taxRateInput, { target: { value: '0.2' } });

    // Mock successful API response
    mockedAxios.patch.mockResolvedValueOnce({ status: 200 });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Amend' }));

    // Wait for success message first
    await waitFor(() => {
      expect(screen.getByText('Sale amended successfully!')).toBeInTheDocument();
    });

    // Then check if form is reset
    await waitFor(() => expect(dateInput).toHaveValue(''));
    await waitFor(() => expect(invoiceInput).toHaveValue(''));
    await waitFor(() => expect(itemIdInput).toHaveValue(''));
    await waitFor(() => expect(costInput).toHaveDisplayValue(''));
    await waitFor(() => expect(taxRateInput).toHaveDisplayValue(''));
  });

  test('handles numeric input validation', () => {
    render(<AmendForm />);
    
    const costInput = screen.getByLabelText('Cost (in pennies):');
    const taxRateInput = screen.getByLabelText('Tax Rate:');

    // Test cost input
    fireEvent.change(costInput, { target: { value: '100' } });
    expect(costInput).toHaveValue(100);

    // Test tax rate input
    fireEvent.change(taxRateInput, { target: { value: '0.2' } });
    expect(taxRateInput).toHaveValue(0.2);
  });
});
