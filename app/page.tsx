'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatInterface } from './components/ChatInterface';
import { AppLayout } from './components/AppLayout';

export default function Home() {
  const pathname = usePathname();
  const [temperature, setTemperature] = useState(0.7);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  
  return (
    <AppLayout
      temperature={temperature}
      onTemperatureChange={setTemperature}
      selectedPlugins={selectedPlugins}
      onPluginsChange={setSelectedPlugins}
    >
      <ChatInterface key={`welcome-${pathname}-${Date.now()}`} isWelcome={true} />
    </AppLayout>
  );
}