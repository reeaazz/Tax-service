import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import IngestForm from '../IngestForm';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IngestForm Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders form elements', () => {
    render(<IngestForm />);
    
    // Check for basic form elements
    expect(screen.getByText('Ingest Transactions')).toBeInTheDocument();
    expect(screen.getByText('Event Type:')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
  });

  test('switches between sale and tax payment forms', () => {
    render(<IngestForm />);
    
    // Initially shows sales form
    expect(screen.getByText('Invoice ID:')).toBeInTheDocument();
    
    // Switch to tax payment
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'TAX_PAYMENT' } });
    
    // Check tax payment specific fields
    expect(screen.getByText('Amount (in pennies):')).toBeInTheDocument();
    expect(screen.queryByText('Invoice ID:')).not.toBeInTheDocument();
  });

  test('handles adding and removing items in sales form', () => {
    render(<IngestForm />);
    
    // Initially one item
    const initialItemInputs = screen.getAllByLabelText('Item ID:');
    expect(initialItemInputs).toHaveLength(1);
    
    // Add an item
    fireEvent.click(screen.getByText('➕ Add Item'));
    expect(screen.getAllByLabelText('Item ID:')).toHaveLength(2);
    
    // Remove an item
    fireEvent.click(screen.getByText('➖ Remove Last Item'));
    expect(screen.getAllByLabelText('Item ID:')).toHaveLength(1);
  });

  test('validates required fields for sales event', async () => {
    render(<IngestForm />);
    
    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Ingest'));
    
    expect(await screen.findByText('Please fill in all fields before submitting.')).toBeInTheDocument();
  });

  test('validates required fields for tax payment event', async () => {
    render(<IngestForm />);
    
    // Switch to tax payment
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'TAX_PAYMENT' } });
    
    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Ingest'));
    
    expect(await screen.findByText('Please fill in all fields before submitting.')).toBeInTheDocument();
  });

  test('successfully submits sales event', async () => {
    render(<IngestForm />);
    
    // Fill in the form
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
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });

    // Submit the form
    fireEvent.click(screen.getByText('Ingest'));

    // Check if success message appears
    await waitFor(() => {
      expect(screen.getByText(/Transaction ingested successfully!/)).toBeInTheDocument();
    });

    // Verify API was called with correct data
    expect(mockedAxios.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({
      eventType: 'SALES',
      invoiceId: 'INV001',
      items: [expect.objectContaining({
        itemId: 'ITEM001',
        cost: 1000,
        taxRate: 0.2
      })]
    }));
  });

  test('successfully submits tax payment event', async () => {
    render(<IngestForm />);
    
    // Switch to tax payment
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'TAX_PAYMENT' } });
    
    // Fill in the form
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });
    
    const amountInput = screen.getByLabelText('Amount (in pennies):');
    fireEvent.change(amountInput, { target: { value: '5000' } });

    // Mock successful API response
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });

    // Submit the form
    fireEvent.click(screen.getByText('Ingest'));

    // Check if success message appears
    await waitFor(() => {
      expect(screen.getByText(/Transaction ingested successfully!/)).toBeInTheDocument();
    });

    // Verify API was called with correct data
    expect(mockedAxios.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({
      eventType: 'TAX_PAYMENT',
      amount: 5000
    }));
  });

  test('handles API error', async () => {
    render(<IngestForm />);
    
    // Fill required fields
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
    mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

    // Submit the form
    fireEvent.click(screen.getByText('Ingest'));

    // Check if error message appears
    await waitFor(() => {
      expect(screen.getByText(`Error ingesting transaction: ${errorMessage}`)).toBeInTheDocument();
    });
  });
});
