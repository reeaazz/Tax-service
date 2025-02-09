import { Express } from 'express';
import bodyParser from 'body-parser';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset module registry before each test
beforeEach(() => {
  jest.resetModules();
});

// Import the app and resetData function
import app, { resetData } from '../index';

// Export the app for tests
export const getTestApp = async (): Promise<Express> => {
  // Reset data stores before each test
  resetData();
  return app;
};

// Mock winston logger globally
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn()
  }),
  format: {
    json: jest.fn()
  },
  transports: {
    Console: jest.fn()
  }
}));
