import { createContext, useContext } from 'react';

interface InspectContextType {
  isInspectMode: boolean;
  setIsInspectMode: (val: boolean) => void;
}

export const InspectContext = createContext<InspectContextType | undefined>(undefined);

export function useInspectMode() {
  const context = useContext(InspectContext);
  if (context === undefined) {
    throw new Error('useInspectMode must be used within an InspectProvider');
  }
  return context;
}
