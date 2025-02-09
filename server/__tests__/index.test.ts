import request from 'supertest';
import { Express } from 'express';
import { getTestApp } from './setup';
import app from '../index';

// Import types
interface SaleItem {
    itemId: string;
    cost: number;
    taxRate: number;
}

interface SaleEvent {
    eventType: 'SALES';
    invoiceId: string;
    date: string;
    items: SaleItem[];
}

interface TaxPaymentEvent {
    eventType: 'TAX_PAYMENT';
    date: string;
    amount: number;
}

describe('Tax Service API', () => {
    let testApp: Express;

    beforeEach(async () => {
        testApp = await getTestApp();
    });

    afterEach(() => {
        jest.resetModules();
    });

    describe('POST /transactions', () => {
        test('successfully ingests a sales event', async () => {
            const saleEvent: SaleEvent = {
                eventType: 'SALES',
                invoiceId: 'INV001',
                date: '2024-01-01T12:00:00Z',
                items: [
                    { itemId: 'ITEM1', cost: 1000, taxRate: 0.2 }
                ]
            };

            await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(202);
        });

        test('successfully ingests a tax payment event', async () => {
            const taxPayment: TaxPaymentEvent = {
                eventType: 'TAX_PAYMENT',
                date: '2024-01-01T12:00:00Z',
                amount: 200
            };

            await request(app)
                .post('/transactions')
                .send(taxPayment)
                .expect(202);
        });

        test('rejects duplicate sales event', async () => {
            const saleEvent: SaleEvent = {
                eventType: 'SALES',
                invoiceId: 'INV001',
                date: '2024-01-01T12:00:00Z',
                items: [
                    { itemId: 'ITEM1', cost: 1000, taxRate: 0.2 }
                ]
            };

            // First submission should succeed
            await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(202);

            // Reset the data stores to ensure clean state
            jest.isolateModules(() => {
                require('../index');
            });

            // Duplicate submission
            const response = await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(409);

            expect(response.body).toEqual({ error: 'Duplicate sale event detected' });
        });

        test('rejects invalid event type', async () => {
            const invalidEvent = {
                eventType: 'INVALID',
                date: '2024-01-01T12:00:00Z'
            };

            const response = await request(app)
                .post('/transactions')
                .send(invalidEvent)
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid event type' });
        });
    });

    describe('GET /tax-position', () => {
        test('calculates correct tax position', async () => {
            // First ingest a sale
            const saleEvent: SaleEvent = {
                eventType: 'SALES',
                invoiceId: 'INV001',
                date: '2024-01-01T12:00:00Z',
                items: [
                    { itemId: 'ITEM1', cost: 1000, taxRate: 0.2 }
                ]
            };

            await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(202);

            // Then ingest a tax payment
            const taxPayment: TaxPaymentEvent = {
                eventType: 'TAX_PAYMENT',
                date: '2024-01-02T12:00:00Z',
                amount: 100
            };

            await request(app)
                .post('/transactions')
                .send(taxPayment)
                .expect(202);

            // Query tax position
            const response = await request(app)
                .get('/tax-position')
                .query({ date: '2024-01-03T12:00:00Z' })
                .expect(200);

            // Expected tax: (1000 * 0.2) = 200 tax due, minus 100 payment = 100 position
            expect(response.body.taxPosition).toBe(100);
        });

        test('handles invalid date format', async () => {
            const response = await request(app)
                .get('/tax-position')
                .query({ date: 'invalid-date' })
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid date format' });
        });

        test('considers amendments in tax calculation', async () => {
            // First ingest a sale
            const saleEvent: SaleEvent = {
                eventType: 'SALES',
                invoiceId: 'INV001',
                date: '2024-01-01T12:00:00Z',
                items: [
                    { itemId: 'ITEM1', cost: 1000, taxRate: 0.2 }
                ]
            };

            await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(202);

            // Then amend the sale
            await request(app)
                .patch('/sale')
                .send({
                    date: '2024-01-02T12:00:00Z',
                    invoiceId: 'INV001',
                    itemId: 'ITEM1',
                    cost: 2000,
                    taxRate: 0.2
                })
                .expect(202);

            // Query tax position after amendment
            const response = await request(app)
                .get('/tax-position')
                .query({ date: '2024-01-03T12:00:00Z' })
                .expect(200);

            // Expected tax: (2000 * 0.2) = 400 tax due, no payments = 400 position
            expect(response.body.taxPosition).toBe(400);
        });
    });

    describe('PATCH /sale', () => {
        test('successfully amends a sale', async () => {
            const amendment = {
                date: '2024-01-01T12:00:00Z',
                invoiceId: 'INV001',
                itemId: 'ITEM1',
                cost: 2000,
                taxRate: 0.2
            };

            await request(app)
                .patch('/sale')
                .send(amendment)
                .expect(202);
        });

        test('rejects amendment with missing fields', async () => {
            const invalidAmendment = {
                date: '2024-01-01T12:00:00Z',
                invoiceId: 'INV001'
                // Missing required fields
            };

            const response = await request(app)
                .patch('/sale')
                .send(invalidAmendment)
                .expect(400);

            expect(response.body).toEqual({ error: 'Missing required fields' });
        });

        test('handles multiple amendments for the same item', async () => {
            // First ingest a sale
            const saleEvent: SaleEvent = {
                eventType: 'SALES',
                invoiceId: 'INV001',
                date: '2024-01-01T12:00:00Z',
                items: [
                    { itemId: 'ITEM1', cost: 1000, taxRate: 0.2 }
                ]
            };

            await request(app)
                .post('/transactions')
                .send(saleEvent)
                .expect(202);

            // First amendment
            await request(app)
                .patch('/sale')
                .send({
                    date: '2024-01-01T12:00:00Z',
                    invoiceId: 'INV001',
                    itemId: 'ITEM1',
                    cost: 2000,
                    taxRate: 0.2
                })
                .expect(202);

            // Second amendment
            await request(app)
                .patch('/sale')
                .send({
                    date: '2024-01-02T12:00:00Z',
                    invoiceId: 'INV001',
                    itemId: 'ITEM1',
                    cost: 3000,
                    taxRate: 0.2
                })
                .expect(202);

            // Query tax position between amendments
            const response = await request(app)
                .get('/tax-position')
                .query({ date: '2024-01-01T23:00:00Z' })
                .expect(200);

            // Should use the first amendment: (2000 * 0.2) = 400 tax due, no payments = 400 position
            expect(response.body.taxPosition).toBe(400);

            // Query tax position after both amendments
            const laterResponse = await request(app)
                .get('/tax-position')
                .query({ date: '2024-01-03T12:00:00Z' })
                .expect(200);

            // Should use the second amendment: (3000 * 0.2) = 600 tax due, no payments = 600 position
            expect(laterResponse.body.taxPosition).toBe(600);
        });
    });
});
