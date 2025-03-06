'use client';

import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AppLayout } from './components/AppLayout';

export default function Home() {
  const [temperature, setTemperature] = useState(0.7);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  
  return (
    <AppLayout
      temperature={temperature}
      onTemperatureChange={setTemperature}
      selectedPlugins={selectedPlugins}
      onPluginsChange={setSelectedPlugins}
    >
      <ChatInterface key="welcome" isWelcome={true} />
    </AppLayout>
  );
}