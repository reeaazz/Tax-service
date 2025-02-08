"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const winston_1 = __importDefault(require("winston"));
// Initialize Express app
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
// Initialize logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()],
});
// Data storage
const salesEvents = [];
const taxPaymentEvents = [];
const amendments = {};
// Helper function to calculate tax for an item
const calculateTax = (cost, taxRate) => {
    return cost * taxRate;
};
// Ingest endpoint
app.post("/transactions", (req, res) => {
    const event = req.body;
    // Validate event type
    if (event.eventType === 'SALES') {
        salesEvents.push(event);
        logger.info('Ingested sales event', { event });
    }
    else if (event.eventType === 'TAX_PAYMENT') {
        taxPaymentEvents.push(event);
        logger.info('Ingested tax payment event', { event });
    }
    else {
        return res.status(400).json({ error: 'Invalid event type' });
    }
    res.status(202).send();
});
// Query tax position endpoint
app.get("/tax-position", (req, res) => {
    const queryDate = new Date(req.query.date);
    if (isNaN(queryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    // Calculate total tax from sales
    let totalSalesTax = 0;
    salesEvents.forEach((sale) => {
        const saleDate = new Date(sale.date);
        if (saleDate <= queryDate) {
            sale.items.forEach((item) => {
                const amendmentKey = `${sale.invoiceId}-${item.itemId}`;
                const amendment = amendments[amendmentKey];
                const cost = amendment ? amendment.cost : item.cost;
                const taxRate = amendment ? amendment.taxRate : item.taxRate;
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
    logger.info('Calculated tax position', { date: queryDate, taxPosition });
    res.status(200).json({
        date: queryDate.toISOString(),
        taxPosition: Math.round(taxPosition), // Round to nearest penny
    });
});
// Amend sale endpoint
app.patch('/sale', (req, res) => {
    const { date, invoiceId, itemId, cost, taxRate } = req.body;
    if (!date || !invoiceId || !itemId || cost === undefined || taxRate === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const amendmentKey = `${invoiceId}-${itemId}`;
    amendments[amendmentKey] = { date, invoiceId, itemId, cost, taxRate };
    logger.info('Amended sale item', { amendmentKey, cost, taxRate });
    res.status(202).send();
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
