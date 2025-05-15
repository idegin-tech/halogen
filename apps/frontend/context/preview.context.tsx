"use client";

import { GoogleFontItem } from "@halogen/common/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type PreviewState = {
  googleFonts: GoogleFontItem[];
};

interface PreviewContextInterface {
  state: PreviewState;
  updatePreviewState: (updates: Partial<PreviewState>) => void;
}

const PreviewContext = createContext<PreviewContextInterface | undefined>(undefined);

const LOCAL_STORAGE_FONTS_KEY = 'halogen-google-fonts';

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewState>({
    googleFonts: [],
  });
  useEffect(() => {
    const loadFonts = async () => {
      try {
        if (typeof window !== 'undefined') {
          const cachedFontsJson = localStorage.getItem(LOCAL_STORAGE_FONTS_KEY);
          
          if (cachedFontsJson) {
            const cachedFonts = JSON.parse(cachedFontsJson);
            
            if (cachedFonts.expires && new Date(cachedFonts.expires) > new Date()) {
              console.log('Using cached Google Fonts from localStorage');
              setState(prevState => ({
                ...prevState,
                googleFonts: cachedFonts.data
              }));
              return;
            }
          }
        }

        console.log('Fetching Google Fonts from API');
        const response = await fetch('/api/fonts?limit=1000'); // Get all fonts
        
        if (!response.ok) {
          throw new Error('Failed to fetch Google fonts');
        }
        
        const data = await response.json();
        
        setState(prevState => ({
          ...prevState,
          googleFonts: data.items
        }));
        if (typeof window !== 'undefined') {
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          
          localStorage.setItem(LOCAL_STORAGE_FONTS_KEY, JSON.stringify({
            data: data.items,
            expires: oneWeekFromNow.toISOString()
          }));
        }
        
      } catch (error) {
        console.error('Error loading Google fonts:', error);
      }
    };

    loadFonts();
  }, []);

  const updatePreviewState = (updates: Partial<PreviewState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const contextValue: PreviewContextInterface = {
    state,
    updatePreviewState,
  };

  return (
    <PreviewContext.Provider value={contextValue}>
      {children}
    </PreviewContext.Provider>
  );
}

export const usePreviewContext = (): PreviewContextInterface => {
  const context = useContext(PreviewContext);
  
  if (context === undefined) {
    throw new Error('usePreviewContext must be used within a PreviewProvider');
  }
  
  return context;
};
