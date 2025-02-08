import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Initialize logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
});

// Define types
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

interface Amendment {
    date: string;
    invoiceId: string;
    itemId: string;
    cost: number;
    taxRate: number;
}

// Combined type for the request
type TransactionRequest = SaleEvent | TaxPaymentEvent;

// Data storage
const salesEvents: SaleEvent[] = [];
const taxPaymentEvents: TaxPaymentEvent[] = [];
const amendments: Record<string, Amendment[]> = {}; // Store multiple amendments as an array

// Helper function to calculate tax for an item
const calculateTax = (cost: number, taxRate: number): number => {
    return cost * taxRate;
};

// Ingest endpoint
app.post('/transactions', (req: Request, res: Response) => {
    const event: TransactionRequest = req.body;

    // Validate event type
    if (event.eventType === 'SALES') {
        const duplicate = salesEvents.some(sale =>
            sale.invoiceId === event.invoiceId &&
            sale.date === event.date &&
            JSON.stringify(sale.items) === JSON.stringify(event.items) // Compare items too
        );
        if (duplicate) {
            return res.status(409).json({ error: 'Duplicate sale event detected' });
        }
        salesEvents.push(event);
        logger.info('Ingested sales event', { event });
        logger.info('All Sales events', {salesEvents})

    } else if (event.eventType === 'TAX_PAYMENT') {
        const duplicate = taxPaymentEvents.some(payment =>
            payment.date === event.date &&
            payment.amount === event.amount
        );
        if (duplicate) {
            return res.status(409).json({ error: 'Duplicate tax payment detected' });
        }
        taxPaymentEvents.push(event);
        logger.info('Ingested tax payment event', { event });
        logger.info('All Tax payments events', {taxPaymentEvents})

    } else {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    res.status(202).send();
});

// Query tax position endpoint
app.get('/tax-position', (req: Request, res: Response) => {
    const queryDate = new Date(req.query.date as string);

    if (isNaN(queryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    let totalSalesTax = 0;
    salesEvents.forEach((sale) => {
        const saleDate = new Date(sale.date);
        if (saleDate <= queryDate) {
            sale.items.forEach((item) => {
                const amendmentKey = `${sale.invoiceId}-${item.itemId}`;
                const relevantAmendments = amendments[amendmentKey]?.filter(a => new Date(a.date) <= queryDate) || [];

                // Get the latest amendment before the query date
                const latestAmendment = relevantAmendments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                const cost = latestAmendment ? latestAmendment.cost : item.cost;
                const taxRate = latestAmendment ? latestAmendment.taxRate : item.taxRate;

                totalSalesTax += calculateTax(cost, taxRate);
            });
        }
    });

    // Calculate total tax payments
    let totalTaxPayments = 0;
    taxPaymentEvents.forEach((payment) => {
        const paymentDate = new Date(payment.date);
        if (paymentDate <= queryDate) {
            totalTaxPayments += payment.amount;
        }
    });

    // Calculate tax position
    const taxPosition = totalSalesTax - totalTaxPayments;

    logger.info('Calculated tax position', { date: queryDate, totalSalesTax, totalTaxPayments, taxPosition });

    res.status(200).json({
        date: queryDate.toISOString(),
        taxPosition: taxPosition,
    });
});

// Amend sale endpoint
app.patch('/sale', (req: Request, res: Response) => {
    const { date, invoiceId, itemId, cost, taxRate } = req.body;

    if (!date || !invoiceId || !itemId || cost === undefined || taxRate === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const amendmentKey = `${invoiceId}-${itemId}`;
    
    if (!amendments[amendmentKey]) {
        amendments[amendmentKey] = []; // Initialize the array if it doesn't exist
    }

    amendments[amendmentKey].push({ date, invoiceId, itemId, cost, taxRate });

    logger.info('Amended sale item', { amendmentKey, cost, taxRate });
    logger.info('All amendments', {amendments})

    res.status(202).send();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
