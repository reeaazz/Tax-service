import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  test('renders app title', () => {
    render(<App />);
    expect(screen.getByText('Novabook Tax Service')).toBeInTheDocument();
  });

  test('renders all navigation buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Ingest Transactions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Query Tax Position' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Amend Sale' })).toBeInTheDocument();
  });

  test('shows IngestForm by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Ingest Transactions', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Query Tax Position', level: 2 })).not.toBeInTheDocument();
  });

  test('switches to QueryForm when Query button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Query Tax Position' }));
    expect(screen.getByRole('heading', { name: 'Query Tax Position', level: 2 })).toBeInTheDocument();
  });

  test('switches to AmendForm when Amend button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Amend Sale' }));
    expect(screen.getByRole('heading', { name: 'Amend Sale', level: 2 })).toBeInTheDocument();
  });

  test('switches back to IngestForm when Ingest button is clicked', () => {
    render(<App />);
    // First switch to another tab
    fireEvent.click(screen.getByRole('button', { name: 'Query Tax Position' }));
    // Then switch back to Ingest
    fireEvent.click(screen.getByRole('button', { name: 'Ingest Transactions' }));
    expect(screen.getByRole('heading', { name: 'Ingest Transactions', level: 2 })).toBeInTheDocument();
  });
});
