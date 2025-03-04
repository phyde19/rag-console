'use client';

import { useState } from 'react';

// Hard-coded list of embedding models
const embeddingModels = [
  { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002' },
  { id: 'text-embedding-3-small', name: 'text-embedding-3-small' },
  { id: 'text-embedding-3-large', name: 'text-embedding-3-large' },
  { id: 'e5-base-v2', name: 'e5-base-v2' },
  { id: 'cohere-embed-english-v3.0', name: 'cohere-embed-english-v3.0' },
];

export function EmbeddingModelSelect() {
  const [selectedModel, setSelectedModel] = useState(embeddingModels[0].id);

  return (
    <select 
      className="w-full p-2 border border-[var(--border-color)] bg-[var(--input-bg)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
    >
      {embeddingModels.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
}