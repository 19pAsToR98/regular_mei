import React, { useState, useEffect, useRef } from 'react';
import { CNPJResponse, DasItem, DasnItem, FiscalData, ServiceCTA, ConnectionConfig } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

interface CnpjConsultPageProps {
  onBack: () => void;
  connectionConfig: ConnectionConfig;
  onNavigateToService: (service: string) => void; // NOVA PROP
}

// ... keep existing code (servicesData, helpers)

const CnpjConsultPage: React.FC<CnpjConsultPageProps> = ({ onBack, connectionConfig, onNavigateToService }) => {
  // ... keep existing code (states)

  const handleResolveDasn = () => {
      onNavigateToService('dasn-service');
  };

  const handleServiceClick = (serviceId: string) => {
      if (serviceId === 'declaracao') {
          onNavigateToService('dasn-service');
      } else {
          showError('Funcionalidade será ativada em breve!');
      }
  };

  // ... keep existing code (rest of component)
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        {/* ... rest of JSX */}
    </div>
  );
};

export default CnpjConsultPage;