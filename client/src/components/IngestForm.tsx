import React, { useState } from 'react';
import axios from 'axios';

interface SaleItem {
  itemId: string;
  cost: number | null;
  taxRate: number | null;
}

interface SaleEvent {
  eventType: string;
  date: string;
  invoiceId: string;
  items: SaleItem[];
}

interface TaxPaymentEvent {
  eventType: string;
  date: string;
  amount: number | null;
}

const IngestForm: React.FC = () => {
  // State for the sale event, tax payment event, and response message
  const [saleEvent, setSaleEvent] = useState<SaleEvent>({
    eventType: 'SALES',
    date: '',
    invoiceId: '',
    items: [{ itemId: '', cost: null, taxRate: null }],
  });

  const [taxPaymentEvent, setTaxPaymentEvent] = useState<TaxPaymentEvent>({
    eventType: 'TAX_PAYMENT',
    date: '',
    amount: null,
  });

  const [ingestResponse, setIngestResponse] = useState<string>('');

  // Function to reset the form to its initial state
  const resetForm = () => {
    setSaleEvent({
      eventType: 'SALES',
      date: '',
      invoiceId: '',
      items: [{ itemId: '', cost: null, taxRate: null }],
    });
    setTaxPaymentEvent({
      eventType: 'TAX_PAYMENT',
      date: '',
      amount: null,
    });
  };

  // Function to add a new item row dynamically
  const addNewItem = () => {
    setSaleEvent((prevState) => ({
      ...prevState,
      items: [...prevState.items, { itemId: '', cost: null, taxRate: null }],
    }));
  };

  // Function to remove the last item row
  const removeLastItem = () => {
    setSaleEvent((prevState) => ({
      ...prevState,
      items: prevState.items.length > 1 ? prevState.items.slice(0, -1) : prevState.items,
    }));
  };

  // Function to update an item in the list
  const updateItem = (index: number, field: keyof SaleItem, value: string | number | null) => {
    const updatedItems = saleEvent.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSaleEvent({ ...saleEvent, items: updatedItems });
  };

  // Handler for ingesting a transaction
  const handleIngest = async () => {
    const event = saleEvent.eventType === 'SALES' ? saleEvent : taxPaymentEvent;

    // Validate required fields
    if (saleEvent.eventType === 'SALES') {
      if (!saleEvent.date || !saleEvent.invoiceId || !saleEvent.items[0].itemId ||
        !saleEvent.items[0].cost || !saleEvent.items[0].taxRate) {
        setIngestResponse('Please fill in all fields before submitting.');
        return;
      }
    } else if (saleEvent.eventType === 'TAX_PAYMENT') {
      if (!taxPaymentEvent.date || !taxPaymentEvent.amount) {
        setIngestResponse('Please fill in all fields before submitting.');
        return;
      }
    }

    try {
      // Make API call to ingest the transaction
      const response = await axios.post('/transactions', event);
      setIngestResponse(`Status: ${response.status}, Transaction ingested successfully!`);
      resetForm(); // Reset the form after successful ingestion
    } catch (error: any) {
      // Handle errors gracefully
      setIngestResponse('Error ingesting transaction: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <h2>Ingest Transactions</h2>
      <div>
        <label>
          Event Type:
          <select
            value={saleEvent.eventType}
            onChange={(e) => setSaleEvent({ ...saleEvent, eventType: e.target.value })}
          >
            <option value="SALES">SALES</option>
            <option value="TAX_PAYMENT">TAX_PAYMENT</option>
          </select>
        </label>
      </div>

      {saleEvent.eventType === 'SALES' ? (
        <div>
          <label>
            Date:
            <input
              type="datetime-local"
              step="1" // Allows milliseconds input in browsers that support it
              value={saleEvent.date ? saleEvent.date.slice(0, 23) : ""}
              onChange={(e) => {
                const localDateTime = e.target.value;

                // Allow partial input while the user is editing manually
                if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
                  setSaleEvent({ ...saleEvent, date: localDateTime });
                  return;
                }

                // Convert to ISO 8601 only if input is fully valid
                const dateObject = new Date(localDateTime);
                if (!isNaN(dateObject.getTime())) {
                  setSaleEvent({ ...saleEvent, date: dateObject.toISOString() });
                }
              }}
            />
          </label>
          <label>
            Invoice ID:
            <input
              type="text"
              value={saleEvent.invoiceId}
              onChange={(e) => setSaleEvent({ ...saleEvent, invoiceId: e.target.value })}
            />
          </label>
          <h3>Items</h3>
          {saleEvent.items.map((item, index) => (
            <div key={index} style={{ borderBottom: '1px solid #ddd', marginBottom: '10px', paddingBottom: '10px' }}>
              <label>
                Item ID:
                <input
                  type="text"
                  value={item.itemId}
                  onChange={(e) => updateItem(index, "itemId", e.target.value)}
                />
              </label>
              <label>
                Cost (in pennies):
                <input
                  type="number"
                  min="0"
                  value={item.cost ?? ''}
                  onChange={(e) => updateItem(index, "cost", parseInt(e.target.value))}
                />
              </label>
              <label>
                Tax Rate:
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.taxRate ?? ''}
                  onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value))}
                />
              </label>
            </div>
          ))}
          <button type="button" onClick={addNewItem}>➕ Add Item</button>
          <button type="button" onClick={removeLastItem} disabled={saleEvent.items.length === 1}>
            ➖ Remove Last Item
          </button>
        </div>
      ) : (
        <div>
          <label>
            Date:
            <input
              type="datetime-local"
              step="1"
              value={taxPaymentEvent.date ? taxPaymentEvent.date.slice(0, 23) : ""}
              onChange={(e) => {
                const localDateTime = e.target.value;
                if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
                  setTaxPaymentEvent({ ...taxPaymentEvent, date: localDateTime });
                  return;
                }
                const dateObject = new Date(localDateTime);
                if (!isNaN(dateObject.getTime())) {
                  setTaxPaymentEvent({ ...taxPaymentEvent, date: dateObject.toISOString() });
                }
              }}
            />
          </label>
          <label>
            Amount (in pennies):
            <input
              type="number"
              min="0"
              value={taxPaymentEvent.amount ?? ''}
              onChange={(e) => setTaxPaymentEvent({ ...taxPaymentEvent, amount: parseInt(e.target.value) })}
            />
          </label>
        </div>
      )}
      <br />
      <button type='submit' style={{ width: '70px', height: '30px', fontSize: '20px' }} onClick={handleIngest}>Ingest</button>
      <p>{ingestResponse}</p>
    </div>
  );
};

export default IngestForm;