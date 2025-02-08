import React, { useState } from 'react';
import IngestForm from './components/IngestForm';
import QueryForm from './components/QueryForm';
import AmendForm from './components/AmendForm';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingest' | 'query' | 'amend'>('ingest');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Novabook Tax Service</h1>
      <div style={{ marginBottom: '20px' }}>
        <button type='button' onClick={() => setActiveTab('ingest')}>Ingest Transactions</button>
        <button type='button' onClick={() => setActiveTab('query')}>Query Tax Position</button>
        <button type='button' onClick={() => setActiveTab('amend')}>Amend Sale</button>
      </div>

      {activeTab === 'ingest' && <IngestForm />}
      {activeTab === 'query' && <QueryForm />}
      {activeTab === 'amend' && <AmendForm />}
    </div>
  );
};

export default App;