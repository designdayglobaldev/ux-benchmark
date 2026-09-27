import { createContext, useContext, useState, type ReactNode } from 'react';

interface UpgradeContextType {
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const UpgradeContext = createContext<UpgradeContextType | undefined>(undefined);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  return (
    <UpgradeContext.Provider value={{ isUpgradeModalOpen, openUpgradeModal, closeUpgradeModal }}>
      {children}
    </UpgradeContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeContext);
  if (context === undefined) {
    throw new Error('useUpgradeModal must be used within an UpgradeProvider');
  }
  return context;
}
