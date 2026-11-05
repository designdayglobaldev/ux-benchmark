import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BenchmarkScreen {
  id: string;
  name: string;
  imageUrl: string;
  app?: { name: string; appLogo?: string };
  uiElements?: { id: string; title: string }[];
  patterns?: { id: string; title: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BenchmarkStoreState {
  // App & Workflow state
  appState: 'idle' | 'analyzing' | 'detected' | 'results';
  uploadedImage: string | null;
  isDragging: boolean;
  showHowItWorks: boolean;

  // Taxonomy selection
  selectedCategory: string;
  selectedSubcategory: string;
  selectedFlow: string;

  // Analysis & Screens
  benchmarkData: any;
  benchmarkScreens: BenchmarkScreen[];
  activeScreenIndex: number;

  // Chat
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatting: boolean;
  isChatOpen: boolean;

  // Design generation & export
  improvedDesignCode: string | null;
  isGeneratingDesign: boolean;
  isExporting: boolean;
  isResultsFullscreen: boolean;

  // Actions
  setAppState: (state: 'idle' | 'analyzing' | 'detected' | 'results') => void;
  setUploadedImage: (image: string | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setShowHowItWorks: (show: boolean) => void;

  setSelectedCategory: (category: string) => void;
  setSelectedSubcategory: (subcategory: string) => void;
  setSelectedFlow: (flow: string) => void;

  setBenchmarkData: (data: any) => void;
  setBenchmarkScreens: (screens: BenchmarkScreen[]) => void;
  setActiveScreenIndex: (index: number) => void;

  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setChatInput: (input: string) => void;
  setIsChatting: (chatting: boolean) => void;
  setIsChatOpen: (open: boolean) => void;

  setImprovedDesignCode: (code: string | null) => void;
  setIsGeneratingDesign: (generating: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsResultsFullscreen: (fullscreen: boolean) => void;

  resetBenchmark: () => void;
}

export const useBenchmarkStore = create<BenchmarkStoreState>()(
  persist(
    (set) => ({
      appState: 'idle',
      uploadedImage: null,
      isDragging: false,
      showHowItWorks: true,

      selectedCategory: '',
      selectedSubcategory: '',
      selectedFlow: '',

      benchmarkData: null,
      benchmarkScreens: [],
      activeScreenIndex: 0,

      chatMessages: [
        {
          role: 'assistant',
          content: 'Hi! I analyzed your screen. What questions do you have about the Benchmark report?',
        },
      ],
      chatInput: '',
      isChatting: false,
      isChatOpen: false,

      improvedDesignCode: null,
      isGeneratingDesign: false,
      isExporting: false,
      isResultsFullscreen: false,

      setAppState: (appState) => set({ appState }),
      setUploadedImage: (uploadedImage) => set({ uploadedImage }),
      setIsDragging: (isDragging) => set({ isDragging }),
      setShowHowItWorks: (showHowItWorks) => set({ showHowItWorks }),

      setSelectedCategory: (selectedCategory) => set({ selectedCategory, selectedSubcategory: '' }),
      setSelectedSubcategory: (selectedSubcategory) => set({ selectedSubcategory }),
      setSelectedFlow: (selectedFlow) => set({ selectedFlow }),

      setBenchmarkData: (benchmarkData) => set({ benchmarkData }),
      setBenchmarkScreens: (benchmarkScreens) => set({ benchmarkScreens }),
      setActiveScreenIndex: (activeScreenIndex) => set({ activeScreenIndex }),

      setChatMessages: (action) =>
        set((state) => ({
          chatMessages: typeof action === 'function' ? action(state.chatMessages) : action,
        })),
      setChatInput: (chatInput) => set({ chatInput }),
      setIsChatting: (isChatting) => set({ isChatting }),
      setIsChatOpen: (isChatOpen) => set({ isChatOpen }),

      setImprovedDesignCode: (improvedDesignCode) => set({ improvedDesignCode }),
      setIsGeneratingDesign: (isGeneratingDesign) => set({ isGeneratingDesign }),
      setIsExporting: (isExporting) => set({ isExporting }),
      setIsResultsFullscreen: (isResultsFullscreen) => set({ isResultsFullscreen }),

      resetBenchmark: () =>
        set({
          appState: 'idle',
          uploadedImage: null,
          benchmarkData: null,
          benchmarkScreens: [],
          activeScreenIndex: 0,
          selectedCategory: '',
          selectedSubcategory: '',
          selectedFlow: '',
          improvedDesignCode: null,
          chatMessages: [
            {
              role: 'assistant',
              content: 'Hi! I analyzed your screen. What questions do you have about the Benchmark report?',
            },
          ],
        }),
    }),
    {
      name: 'benchmark_store_session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        appState: state.appState,
        uploadedImage: state.uploadedImage,
        selectedCategory: state.selectedCategory,
        selectedSubcategory: state.selectedSubcategory,
        selectedFlow: state.selectedFlow,
        benchmarkData: state.benchmarkData,
        benchmarkScreens: state.benchmarkScreens,
        chatMessages: state.chatMessages,
        improvedDesignCode: state.improvedDesignCode,
      }),
    }
  )
);
