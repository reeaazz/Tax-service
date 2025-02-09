# Novabook Tax Service

A full-stack application for managing tax calculations and transactions, featuring a React TypeScript frontend and Node.js/Express backend.

## Project Overview

The Novabook Tax Service is designed to handle various tax-related operations including:
- Ingesting sales and tax payment transactions
- Querying tax positions at specific dates
- Amending sale records
- Calculating tax liabilities
  
The service must handle:
- Past or future dates in event payloads
- Amendments to sales events that may not yet exist
- No financial years (tax position accumulates indefinitely)
- Single-user service (no authentication or multi-tenancy)


## Tech Stack

### Frontend
- React 18
- TypeScript
- Testing Library/Jest
- Axios for API calls

### Backend
- Node.js
- Express
- TypeScript
- Winston for logging
- Jest & Supertest for testing

## Project Structure

```
Tax_service/
├── client/             # Frontend React application
│
├── server/             # Backend Express application
│
└── package.json        # Root package.json for managing both client and server
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/reeaazz/Tax-service.git
   cd Tax-service
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client && npm install

   # Install server dependencies
   cd ../server && npm install
   ```

3. Start the development environment:
   ```bash
   # From the root directory
   npm run dev
   ```

## Available Scripts

In the root directory:
- `npm run dev` - Starts both client and server in development mode
- `npm run client` - Starts only the client
- `npm run server` - Starts only the server
- `npm test` - Runs all tests (both client and server)
- `npm run test:client` - Runs only client tests
- `npm run test:server` - Runs only server tests
- `npm run build` - Builds the client application

## API Endpoints

### POST /transactions
Ingests sales events and tax payments.

#### Sales Event Example:
```json
{
  "eventType": "SALES",
  "invoiceId": "INV001",
  "date": "2024-01-01T12:00:00Z",
  "items": [
    {
      "itemId": "ITEM1",
      "cost": 1000,
      "taxRate": 0.2
    }
  ]
}
```

#### Tax Payment Example:
```json
{
  "eventType": "TAX_PAYMENT",
  "date": "2024-01-01T12:00:00Z",
  "amount": 200
}
```

### GET /tax-position
Queries the tax position at a specific date.

Query Parameters:
- `date`: ISO 8601 formatted date string

### PATCH /sale
Amends an existing sale record.

Request Body:
```json
{
  "date": "2024-01-01T12:00:00Z",
  "invoiceId": "INV001",
  "itemId": "ITEM1",
  "cost": 2000,
  "taxRate": 0.2
}
```

## Testing

The project includes comprehensive test suites for both frontend and backend:

### Frontend Tests
- Component rendering tests
- User interaction tests
- Form validation tests
- API integration tests

### Backend Tests
- API endpoint tests
- Data validation tests
- Tax calculation tests
- Error handling tests

Run tests using:
```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:client

# Run backend tests only
npm run test:server
```

## Error Handling

The application implements comprehensive error handling:
- Frontend form validation
- API error responses with meaningful messages
- Duplicate transaction detection
- Invalid date format handling
- Missing field validation

## Data Storage

The server uses in-memory storage for:
- Sales events
- Tax payment events
- Sale amendments


## Known Ambiguities & Assumptions

### 1️. Duplicate Transactions
- **Ambiguity**: The spec does not define what makes a transaction duplicate.
- **Current Implementation**:
  - For sales: Transactions are considered duplicates if invoiceId, date, and items match exactly (using JSON.stringify comparison)
  - For tax payments: Transactions are duplicates if date and amount match
- **Improvement Opportunity**: Consider more granular duplicate detection logic based on business requirements

### 2️. Multiple Amendments for the Same Item
- **Ambiguity**: How to handle multiple amendments for the same item over time
- **Current Implementation**:
  - All amendments are stored in an array under a key combining invoiceId and itemId
  - When calculating tax position, only amendments before the query date are considered
  - The latest applicable amendment is used for calculations
- **Verification**: The system maintains amendment history and applies them chronologically

### 3️. Tax Position Calculation
- **Ambiguity**: How to calculate tax position at a specific point in time
- **Current Implementation**:
  - Returns tax position for a single date point
  - Includes all sales and amendments up to that date
  - Subtracts all tax payments up to that date
  - Can result in negative tax position (representing tax credit)
- **Enhancement Possibility**: Add support for date range queries

### 4. Date Handling
- **Ambiguity**: Timezone and date precision requirements
- **Current Implementation**:
  - Uses ISO 8601 date format
  - Stores full timestamp precision
  - Does not store date for when the transaction events were ingested through APIs
  - Performs date comparisons using JavaScript Date objects


### 5. Logging & Observability
- **Ambiguity**: Required level of system observability
- **Current Implementation**:
  - Uses Winston logger
  - Logs all transaction ingestions
  - Logs tax position calculations
  - Logs amendment operations

