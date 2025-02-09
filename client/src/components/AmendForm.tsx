import React, { useState } from 'react';
import axios from 'axios';

interface AmendSale {
  date: string;
  invoiceId: string;
  itemId: string;
  cost: number | null;
  taxRate: number | null;
}

const AmendForm: React.FC = () => {
  // State for the amendment form and response message
  const [amendSale, setAmendSale] = useState<AmendSale>({
    date: '',
    invoiceId: '',
    itemId: '',
    cost: null,
    taxRate: null,
  });
  const [amendResponse, setAmendResponse] = useState<string>('');

  // Function to reset the form
  const resetForm = () => {
    setAmendSale({
      date: '',
      invoiceId: '',
      itemId: '',
      cost: null,
      taxRate: null,
    });
  };

  // Handler for amending a sale
  const handleAmend = async () => {
    // Validate all fields
    if (!amendSale.date || !amendSale.invoiceId || !amendSale.itemId || !amendSale.cost || !amendSale.taxRate) {
      setAmendResponse('Please fill in all fields before submitting.');
      return;
    }

    try {
      // Make API call to amend the sale
      const response = await axios.patch('/sale', amendSale);
      setAmendResponse(`Status: ${response.status},Sale amended successfully!`);
      resetForm(); // Reset the form after successful amendment
    } catch (error: any) {
      // Handle errors gracefully
      setAmendResponse('Error amending sale: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Amend Sale</h2>
      <label>
        Date:
        <input
          type="datetime-local"
          step="1" // Allows milliseconds input
          value={amendSale.date ? amendSale.date.slice(0, 23) : ""}
          onChange={(e) => {
            const localDateTime = e.target.value;
            // Allow partial input while the user is editing
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
              setAmendSale({ ...amendSale, date: localDateTime });
              return;
            }
            // Convert to ISO 8601 if input is valid
            const dateObject = new Date(localDateTime);
            if (!isNaN(dateObject.getTime())) {
              setAmendSale({ ...amendSale, date: dateObject.toISOString() });
            }
          }}
        />
      </label>
      <label>
        Invoice ID:
        <input
          type="text"
          value={amendSale.invoiceId}
          onChange={(e) => setAmendSale({ ...amendSale, invoiceId: e.target.value })}
        />
      </label>
      <label>
        Item ID:
        <input
          type="text"
          value={amendSale.itemId}
          onChange={(e) => setAmendSale({ ...amendSale, itemId: e.target.value })}
        />
      </label>
      <label>
        Cost (in pennies):
        <input
          type="number"
          min="0" // Prevent negative values
          value={amendSale.cost ?? ''}
          onChange={(e) => setAmendSale({ ...amendSale, cost: parseInt(e.target.value) })}
        />
      </label>
      <label>
        Tax Rate:
        <input
          type="number"
          min="0" // Prevent negative values
          step="0.01"
          value={amendSale.taxRate ?? ''}
          onChange={(e) => setAmendSale({ ...amendSale, taxRate: parseFloat(e.target.value) })}
        />
      </label>
      <button type='submit' onClick={handleAmend}>Amend</button>
      <p>{amendResponse}</p>
    </div>
  );
};

export default AmendForm;