"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardSummaryCards from './components/DashboardSummaryCards';
import RevenueChart from './components/RevenueChart';
import Reminders from './components/Reminders';
import Thermometer from './components/Thermometer';
import RecentTransactions from './components/RecentTransactions';
import AIAnalysis from './components/AIAnalysis';
import NewsSlider from './components/NewsSlider';
import CashFlowPage from './components/CashFlowPage';
import InvoicesPage from './components/InvoicesPage';
import CalendarPage from './components/CalendarPage';
import CNPJPage from './components/CNPJPage';
import ToolsPage from './components/ToolsPage';
import NewsPage from './components/NewsPage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/OnboardingPage';
import IntroWalkthrough from './components/IntroWalkthrough';
import FinancialScore from './components/FinancialScore';
import MobileDashboard from './components/MobileDashboard';
import InstallPrompt from './components/InstallPrompt';
import ExternalTransactionModal from './components/ExternalTransactionModal';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import BalanceForecastCard from './components/BalanceForecastCard';
import VirtualAssistantButton from './components/VirtualAssistantButton';
import AssistantChat from './components/AssistantChat';
import LandingPage from './components/LandingPage';
import CnpjConsultPage from "./components/CnpjConsultPage";
import MobileBottomNav from './components/MobileBottomNav';
import MorePage from './components/MorePage';
import DashboardViewSelector from './components/DashboardViewSelector';
import TransactionModal from './components/TransactionModal';
import ProductsByCnaePage from './components/ProductsByCnaePage';
import ResetPasswordPage from './components/ResetPasswordPage';
import DasnServicePage from './components/DasnServicePage'; // NOVO IMPORT
import { Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote, CNPJResponse } from './types';
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast, showWarning } from './utils/toastUtils';
import { scheduleTransactionReminder, scheduleAppointmentReminder, deleteScheduledReminder } from './utils/whatsappUtils';

// ... keep existing code (categorias padrão)

const App: React.FC = () => {
  // ... keep existing code (states)

  const renderContent = () => {
      if (activeTab === 'admin' && user?.role !== 'admin') {
          return (
              <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
                  <span className="material-icons text-6xl text-red-500 mb-4">lock</span>
                  <h2 className="2xl font-bold text-slate-800 dark:text-white mb-2">Acesso Negado</h2>
                  <p className="text-slate-500 dark:text-slate-400">Você não tem permissão para acessar a área de administração.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="mt-4 text-primary font-medium hover:underline">Voltar ao Dashboard</button>
              </div>
          );
      }

      if (isPageInMaintenance(activeTab)) {
          return <MaintenanceOverlay type="page" />;
      }

      switch (activeTab) {
          case 'dashboard':
              return (
                <>
                <div className="md:hidden">
                   {connectionConfig.ai.enabled && (
                       <div className="grid grid-cols-12 mb-6">
                           <AIAnalysis enabled={connectionConfig.ai.enabled} />
                       </div>
                   )}
                   <MobileDashboard 
                        transactions={transactions} 
                        user={user} 
                        appointments={appointments}
                        fiscalData={fiscalData}
                        onNavigate={setActiveTab}
                   />
                   <div className="mt-6">
                      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 px-2">Últimas Movimentações</h3>
                      <div className="h-[400px]">
                         <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
                      </div>
                   </div>
                   <div className="mt-8 mb-4">
                      <NewsSlider news={news} onViewNews={handleViewNews} />
                   </div>
                </div>
                <div className="hidden md:block space-y-6">
                  <div className="flex justify-between items-center gap-4">
                      <DashboardViewSelector viewMode={dashboardViewMode} setViewMode={setDashboardViewMode} />
                      <div className="flex gap-4">
                          <button 
                              onClick={() => setQuickAddModalType('receita')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm"
                          >
                              <span className="material-icons text-lg">arrow_upward</span> Nova Receita
                          </button>
                          <button 
                              onClick={() => setQuickAddModalType('despesa')}
                              className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm"
                          >
                              <span className="material-icons text-lg">arrow_downward</span> Nova Despesa
                          </button>
                      </div>
                  </div>
                  <DashboardSummaryCards metrics={dashboardMetrics} />
                  {connectionConfig.ai.enabled && (
                      <div className="grid grid-cols-12">
                          <AIAnalysis enabled={connectionConfig.ai.enabled} />
                      </div>
                  )}
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-8 h-full">
                      <RevenueChart transactions={transactions} globalViewMode={dashboardViewMode} />
                    </div>
                    <div className="col-span-12 xl:col-span-4 h-full">
                        <Reminders transactions={transactions} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-4 h-full">
                        <FinancialScore transactions={transactions} viewMode={dashboardViewMode} />
                    </div>
                    <div className="col-span-12 xl:col-span-4 h-full">
                        <Thermometer transactions={transactions} />
                    </div>
                    <div className="col-span-12 xl:col-span-4 h-full">
                        <BalanceForecastCard transactions={transactions} viewMode={dashboardViewMode} />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 h-full">
                        <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <NewsSlider news={news} onViewNews={handleViewNews} />
                  </div>
                </div>
              </>
              );
          case 'cashflow': 
            return <CashFlowPage 
                transactions={transactions}
                revenueCats={revenueCats}
                expenseCats={expenseCats}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteTransactionSeries={handleDeleteTransactionSeries}
            />;
          case 'invoices': return <InvoicesPage />;
          case 'calendar': 
            return <CalendarPage 
                transactions={transactions}
                appointments={appointments}
                revenueCats={revenueCats}
                expenseCats={expenseCats}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                userId={user!.id}
            />;
          case 'cnpj': 
            return <CNPJPage 
                cnpj={cnpj} 
                fiscalData={fiscalData} 
                onUpdateFiscalData={handleUpdateFiscalData} 
                onUpdateCnpjData={handleUpdateCnpjData}
                connectionConfig={connectionConfig} 
                cnpjData={user?.cnpjData} 
            />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={(id) => setReadingNewsId(id)} />;
          case 'offers': 
            return <ProductsByCnaePage 
                user={user!} 
                productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl}
            />;
          case 'admin':
            return <AdminPage 
                offers={offers}
                onAddOffer={handleAddOffer}
                onUpdateOffer={handleUpdateOffer}
                onDeleteOffer={handleDeleteOffer}
                news={news}
                onAddNews={handleAddNews}
                onUpdateNews={handleUpdateNews}
                onDeleteNews={handleDeleteNewsClick}
                notifications={notifications}
                onAddNotification={handleAddNotification}
                onUpdateNotification={handleUpdateNotification}
                onDeleteNotification={handleDeleteNotification}
                maintenance={maintenance}
                onUpdateMaintenance={handleUpdateMaintenance}
                connectionConfig={connectionConfig}
                onUpdateConnectionConfig={handleUpdateConnectionConfig}
                users={allUsers}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />;
          case 'settings': 
            return <SettingsPage 
              user={user}
              onUpdateUser={handleUpdateUser}
              onUpdateUserPhone={handleUpdateUserPhone}
              onUpdateUserEmail={handleUpdateUserEmail}
              cnpj={cnpj} 
              onCnpjChange={setCnpj}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onExportData={handleExportData}
              onDeleteAccount={handleDeleteAccount}
              onChangePassword={handleChangePassword}
            />;
          case 'more':
            return <MorePage onNavigate={setActiveTab} userRole={user?.role} />;
          case 'terms': return <TermsPage />;
          case 'privacy': return <PrivacyPage />;
          case 'dasn-service': // NOVO CASE
            return <DasnServicePage user={user} onBack={() => setActiveTab(user ? 'dashboard' : 'home')} />;
          default: return null;
      }
  };

  // ... keep existing code (rest of the component)
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {user && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user?.role} />
      )}
      <div className={`flex-1 flex flex-col overflow-hidden`}>
        {user && (
            <Header activeTab={activeTab} onMenuClick={() => {}} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative lg:pb-8 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {maintenance.global && activeTab !== 'admin' && activeTab !== 'settings' && user?.role !== 'admin' ? (
                <div className="h-full flex items-center justify-center">
                    <MaintenanceOverlay type="global" />
                </div>
            ) : (
                renderContent()
            )}
          </div>
          <footer className="mt-8 text-center text-sm text-slate-400 pb-4">
            <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
          </footer>
          {showIntro && <IntroWalkthrough onFinish={() => setShowIntro(false)} />}
        </main>
      </div>
      <InstallPrompt />
      {externalTransactions.length > 0 && (
          <ExternalTransactionModal
              transactions={externalTransactions}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              onClose={handleCloseExternalModal}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToCashflow={() => setActiveTab('cashflow')}
          />
      )}
      {user && user.isSetupComplete && (
          <>
              <VirtualAssistantButton 
                  isOpen={isAssistantOpen} 
                  onClick={() => setIsAssistantOpen(true)} 
                  gifUrl={connectionConfig.assistantGifUrl}
                  iconSizeClass={connectionConfig.assistantIconSize}
              />
              {isAssistantOpen && (
                  <AssistantChat 
                      onClose={() => setIsAssistantOpen(false)} 
                      onNavigate={setActiveTab}
                      connectionConfig={connectionConfig}
                  />
              )}
          </>
      )}
      {user && (
          <MobileBottomNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              userRole={user.role} 
          />
      )}
      {quickAddModalType && (
          <TransactionModal
              isOpen={!!quickAddModalType}
              onClose={() => setQuickAddModalType(null)}
              onSave={handleAddTransaction}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              editingTransaction={null}
              forcedType={quickAddModalType}
          />
      )}
    </div>
  );
};

export default App;