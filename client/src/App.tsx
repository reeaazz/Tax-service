import React, { useState } from 'react';
import axios from 'axios';

const App: React.FC = () => {

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
  
  interface AmendSale {
    date: string;
    invoiceId: string;
    itemId: string;
    cost: number | null; 
    taxRate: number | null; 
  }

  const [activeTab, setActiveTab] = useState<'ingest' | 'query' | 'amend'>('ingest');
  const [ingestResponse, setIngestResponse] = useState<string>('');
  const [queryResponse, setQueryResponse] = useState<string>('');
  const [amendResponse, setAmendResponse] = useState<string>('');

  const initialSaleEvent:SaleEvent = {
    eventType: 'SALES',
    date: '',
    invoiceId: '',
    items: [{ itemId: '', cost: null, taxRate: null }],
  };

  const initialTaxPaymentEvent:TaxPaymentEvent = {
    eventType: 'TAX_PAYMENT',
    date: '',
    amount: null,
  };

  const initialAmendSale:AmendSale = {
    date: '',
    invoiceId: '',
    itemId: '',
    cost: null,
    taxRate: null,
  };

  const [saleEvent, setSaleEvent] = useState(initialSaleEvent);

  const [taxPaymentEvent, setTaxPaymentEvent] = useState(initialTaxPaymentEvent);

  const [queryDate, setQueryDate] = useState<string>('');

  const [amendSale, setAmendSale] = useState(initialAmendSale);

  // Function to reset forms
  const resetForm = () => {
    setSaleEvent((prevState) => ({
      ...initialSaleEvent,
      eventType: prevState.eventType, // Preserve eventType
    }));
  
    setTaxPaymentEvent((prevState) => ({
      ...initialTaxPaymentEvent,
      eventType: prevState.eventType, // Preserve eventType
    }));
  
    setAmendSale(initialAmendSale); // Reset everything
    setQueryDate(''); // Reset query date
  };

   // Function to add a new item row dynamically
   const addNewItem = () => {
    setSaleEvent((prevState) => ({
      ...prevState,
      items: [...prevState.items, { itemId: '', cost: null, taxRate: null }],
    }));
  };

  // Function to update an item in the list
  const updateItem = (index: number, field: keyof SaleItem, value: string | number | null) => {
    const updatedItems = saleEvent.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSaleEvent({ ...saleEvent, items: updatedItems });
  };

  const handleIngest = async () => {
    const event = saleEvent.eventType === 'SALES' ? saleEvent : taxPaymentEvent;

    // Check if all required fields are filled before making the request
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
      const response = await axios.post('/transactions', event);
      setIngestResponse(`Status: ${response.status}, Transaction ingested successfully!`);
      resetForm();
    } catch (error: any) {
      setIngestResponse('Error ingesting transaction: ' + (error.response.data.error || error));
    }
  };

  const handleQuery = async () => {
    // Ensure query date is entered
    if (!queryDate) {
      setQueryResponse('Please select a date before querying.');
      return;
    }

    try {
      const response = await axios.get('/tax-position', { params: { date: queryDate } });
      setQueryResponse(`Tax Position: £${(response.data.taxPosition / 100).toFixed(2)}`);
      resetForm();
    } catch (error: any) {
      setQueryResponse('Error querying tax position: ' + error.message);
    }
  };

  const handleAmend = async () => {
    // Ensure all fields are entered for amendments
    if (!amendSale.date || !amendSale.invoiceId || !amendSale.itemId || !amendSale.cost || !amendSale.taxRate) {
      setAmendResponse('Please fill in all fields before submitting.');
      return;
    }

    try {
      const response = await axios.patch('/sale', amendSale);
      setAmendResponse('Sale amended successfully!');
      resetForm();
    } catch (error: any) {
      setAmendResponse('Error amending sale: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Novabook Tax Service</h1>
      <div style={{ marginBottom: '20px' }}>
        <button type='button' onClick={() => setActiveTab('ingest')}>Ingest Transactions</button>
        <button type='button' onClick={() => setActiveTab('query')}>Query Tax Position</button>
        <button type='button' onClick={() => setActiveTab('amend')}>Amend Sale</button>
      </div>

      {activeTab === 'ingest' && (
        <div>
          <h2>Ingest Transactions</h2>
          <div>
            <label>
              Event Type:
              <select
                value={saleEvent.eventType}
                onChange={(e) =>
                  setSaleEvent({ ...saleEvent, eventType: e.target.value })
                }
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
                    const localDateTime = e.target.value; // User input: "2025-02-07T14:30:45.123"
                    // Allow partial input while the user is editing manually
                    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
                      setSaleEvent({ ...saleEvent, date: localDateTime }); // Store temporary value
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
                  onChange={(e) =>
                    setSaleEvent({ ...saleEvent, invoiceId: e.target.value })
                  }
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
            </div>
          ) : (
            <div>
              <label>
                Date:
                <input
                  type="datetime-local"
                  step="1" // Allows milliseconds input in browsers that support it
                  value={taxPaymentEvent.date ? taxPaymentEvent.date.slice(0, 23) : ""}
                  onChange={(e) => {
                    const localDateTime = e.target.value; // User input: "2025-02-07T14:30:45.123"
                    // Allow partial input while the user is editing manually
                    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
                      setTaxPaymentEvent({ ...taxPaymentEvent, date: localDateTime }); // Store temporary value
                      return;
                    }

                    // Convert to ISO 8601 only if input is fully valid
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
                  min="0" // prevent negative values
                  value={taxPaymentEvent.amount  ?? ''}
                  onChange={(e) =>
                    setTaxPaymentEvent({ ...taxPaymentEvent, amount: parseInt(e.target.value) })
                  }
                />
              </label>
            </div>
          )}

          <button type='submit' onClick={handleIngest}>Ingest</button>
          <p>{ingestResponse}</p>
        </div>
      )}

      {activeTab === 'query' && (
        <div>
          <h2>Query Tax Position</h2>
          <label>
            Date:
            <input
              type="datetime-local"
              step="1" // Allows milliseconds input in browsers that support it
              value={queryDate ? queryDate.slice(0, 23) : ""}
              onChange={(e) => {
                const localDateTime = e.target.value; // User input: "2025-02-07T14:30:45.123"
                //Allow partial input while the user is editing manually
                if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
                  setQueryDate(localDateTime); // Temporarily store the input without converting
                  return;
                }

                // Convert to ISO 8601 only if the input is fully valid
                const dateObject = new Date(localDateTime);
                if (!isNaN(dateObject.getTime())) {
                  setQueryDate(dateObject.toISOString()); // Store as full ISO 8601 format
                }
              }}
            />
          </label>
          <button type='submit' onClick={handleQuery}>Query</button>
          <p>{queryResponse}</p>
        </div>
      )}

      {activeTab === 'amend' && (
        <div>
          <h2>Amend Sale</h2>
          <label>
            Date:
            <input
              type="datetime-local"
              value={amendSale.date}
              onChange={(e) =>
                setAmendSale({ ...amendSale, date: e.target.value })
              }
            />
          </label>
          <label>
            Invoice ID:
            <input
              type="text"
              value={amendSale.invoiceId}
              onChange={(e) =>
                setAmendSale({ ...amendSale, invoiceId: e.target.value })
              }
            />
          </label>
          <label>
            Item ID:
            <input
              type="text"
              value={amendSale.itemId}
              onChange={(e) =>
                setAmendSale({ ...amendSale, itemId: e.target.value })
              }
            />
          </label>
          <label>
            Cost (in pennies):
            <input
              type="number"
              min="0" // prevent negative values
              value={amendSale.cost ?? ''}
              onChange={(e) =>
                setAmendSale({ ...amendSale, cost: parseInt(e.target.value) })
              }
            />
          </label>
          <label>
            Tax Rate:
            <input
              type="number"
              min="0" // prevent negative values
              step="0.01"
              value={amendSale.taxRate ?? ''}
              onChange={(e) =>
                setAmendSale({ ...amendSale, taxRate: parseFloat(e.target.value) })
              }
            />
          </label>
          <button type='submit' onClick={handleAmend}>Amend</button>
          <p>{amendResponse}</p>
        </div>
      )}
    </div>
  );
};

export default App;