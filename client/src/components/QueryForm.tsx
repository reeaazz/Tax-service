import React, { useState } from 'react';
import axios from 'axios';

const QueryForm: React.FC = () => {
  // State for the query date and response message
  const [queryDate, setQueryDate] = useState<string>('');
  const [queryResponse, setQueryResponse] = useState<string>('');

  // Function to reset the form
  const resetForm = () => {
    setQueryDate('');
  };

  // Handler for querying tax position
  const handleQuery = async () => {
    // Validate query date
    if (!queryDate) {
      setQueryResponse('Please select a date before querying.');
      return;
    }

    try {
      // Make API call to fetch tax position
      const response = await axios.get('/tax-position', { params: { date: queryDate } });
      // Format and display the tax position
      setQueryResponse(`Tax Position: £${(response.data.taxPosition / 100).toFixed(2)}`);
      resetForm(); // Reset the form after successful query
    } catch (error: any) {
      // Handle errors gracefully
      setQueryResponse('Error querying tax position: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Query Tax Position</h2>
      <label>
        Date:
        <input
          type="datetime-local"
          step="1" // Allows milliseconds input
          value={queryDate ? queryDate.slice(0, 23) : ""}
          onChange={(e) => {
            const localDateTime = e.target.value;
            // Allow partial input while the user is editing
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(localDateTime)) {
              setQueryDate(localDateTime);
              return;
            }
            // Convert to ISO 8601 if input is valid
            const dateObject = new Date(localDateTime);
            if (!isNaN(dateObject.getTime())) {
              setQueryDate(dateObject.toISOString());
            }
          }}
        />
      </label>
      <button type='submit' onClick={handleQuery}>Query</button>
      <p>{queryResponse}</p>
    </div>
  );
};

export default QueryForm;