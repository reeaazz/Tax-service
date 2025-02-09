import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import QueryForm from '../QueryForm';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QueryForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form elements', () => {
    render(<QueryForm />);
    
    expect(screen.getByText('Query Tax Position')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument();
  });

  test('validates empty date field', async () => {
    render(<QueryForm />);
    
    // Try to submit without date
    fireEvent.click(screen.getByRole('button', { name: 'Query' }));
    
    expect(await screen.findByText('Please select a date before querying.')).toBeInTheDocument();
  });

  test('successfully queries tax position', async () => {
    render(<QueryForm />);
    
    // Fill in date
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });

    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: { taxPosition: 50000 } // £500.00 in pennies
    });

    // Submit query
    fireEvent.click(screen.getByRole('button', { name: 'Query' }));

    // Check if formatted response appears
    await waitFor(() => {
      expect(screen.getByText('Tax Position: £500.00')).toBeInTheDocument();
    });

    // Verify API was called with correct parameters
    expect(mockedAxios.get).toHaveBeenCalledWith('/tax-position', {
      params: expect.objectContaining({
        date: expect.any(String)
      })
    });
  });

  test('handles API error', async () => {
    render(<QueryForm />);
    
    // Fill in date
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });

    // Mock API error
    const errorMessage = 'Network error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    // Submit query
    fireEvent.click(screen.getByRole('button', { name: 'Query' }));

    // Check if error message appears
    await waitFor(() => {
      expect(screen.getByText(`Error querying tax position: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  test('resets form after successful query', async () => {
    render(<QueryForm />);
    
    // Fill in date
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });

    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: { taxPosition: 50000 }
    });

    // Submit query
    fireEvent.click(screen.getByRole('button', { name: 'Query' }));

    // Check if date field is reset
    await waitFor(() => {
      expect(dateInput).toHaveValue('');
    });
  });

  test('formats tax position correctly for different amounts', async () => {
    render(<QueryForm />);
    
    // Test cases with different amounts
    const testCases = [
      { amount: 10050, expected: '£100.50' },  // Test decimal places
      { amount: 100, expected: '£1.00' },      // Test small amount
      { amount: 1000000, expected: '£10000.00' } // Test large amount
    ];

    for (const testCase of testCases) {
      // Fill in date
      const dateInput = screen.getByLabelText('Date:');
      fireEvent.change(dateInput, { target: { value: '2024-01-01T12:00' } });

      // Mock API response with test amount
      mockedAxios.get.mockResolvedValueOnce({
        data: { taxPosition: testCase.amount }
      });

      // Submit query
      fireEvent.click(screen.getByRole('button', { name: 'Query' }));

      // Check if formatted amount appears correctly
      await waitFor(() => {
        expect(screen.getByText(`Tax Position: ${testCase.expected}`)).toBeInTheDocument();
      });
    }
  });

  test('handles date input changes correctly', () => {
    render(<QueryForm />);
    
    const dateInput = screen.getByLabelText('Date:');

    // Test complete date input
    const testDate = '2024-01-01T12:00';
    fireEvent.change(dateInput, { target: { value: testDate } });
    
    // The component will convert it to ISO string and slice it for display
    const dateObject = new Date(testDate);
    const expectedValue = dateObject.toISOString().slice(0, 16);
    expect(dateInput).toHaveValue(expectedValue);
  });
});
