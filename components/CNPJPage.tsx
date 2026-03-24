import React, { useState, useEffect, useRef } from 'react';
import { CNPJResponse, DasItem, DasnItem, FiscalData, ServiceCTA, ConnectionConfig } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

interface CNPJPageProps {
  cnpj?: string;
  fiscalData: FiscalData | null;
  onUpdateFiscalData: (data: FiscalData) => void;
  onUpdateCnpjData: (data: CNPJResponse) => void;
  connectionConfig: ConnectionConfig;
  cnpjData?: CNPJResponse | null;
  onNavigateToService: (service: string) => void; // NOVA PROP
}

// ... keep existing code (servicesData, helpers)

const CNPJPage: React.FC<CNPJPageProps> = ({ cnpj, fiscalData, onUpdateFiscalData, onUpdateCnpjData, connectionConfig, cnpjData, onNavigateToService }) => {
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* ... rest of JSX */}
    </div>
  );
};

export default CNPJPage;