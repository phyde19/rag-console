'use client';

import { useState } from 'react';

// Hard-coded list of vector indices
const vectorIndices = [
  { id: 'company_docs', name: 'Company Documents' },
  { id: 'product_docs', name: 'Product Documentation' },
  { id: 'engineering_wiki', name: 'Engineering Wiki' },
  { id: 'support_kb', name: 'Support Knowledge Base' },
  { id: 'research_papers', name: 'Research Papers' },
];

export function VectorIndexSelect() {
  const [selectedIndex, setSelectedIndex] = useState(vectorIndices[0].id);

  return (
    <select 
      className="w-full p-2 border border-[var(--border-color)] bg-[var(--input-bg)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={selectedIndex}
      onChange={(e) => setSelectedIndex(e.target.value)}
    >
      {vectorIndices.map((index) => (
        <option key={index.id} value={index.id}>
          {index.name}
        </option>
      ))}
    </select>
  );
}