import { useBuilderContext } from "@/context/builder.context";
import { PageData } from "@/types/builder.types";
import { useCallback } from "react";

export const usePage = () => {
  const { state, updateBuilderState } = useBuilderContext();

  const setActivePage = useCallback((pageId: string) => {
    updateBuilderState({ selectedPageId: pageId });
  }, [updateBuilderState]);

  const addPage = useCallback((page: Partial<PageData>) => {
    const newPage: PageData = {
      id: `page_${Date.now()}`,
      name: page.name || "New Page",
      path: page.path || `/${page.name?.toLowerCase().replace(/\s+/g, "-") || "new-page"}`,
      isStatic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...page,
    };

    updateBuilderState({
      pages: [...state.pages, newPage],
      selectedPageId: newPage.id,
    });

    return newPage;
  }, [state.pages, updateBuilderState]);

  const updatePage = useCallback((pageId: string, updates: Partial<PageData>) => {
    const updatedPages = state.pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return page;
    });

    updateBuilderState({ pages: updatedPages });
  }, [state.pages, updateBuilderState]);

  const removePage = useCallback((pageId: string) => {
    const filteredPages = state.pages.filter((page) => page.id !== pageId);
    const updatedState: Partial<Parameters<typeof updateBuilderState>[0]> = {
      pages: filteredPages,
    };

    if (state.selectedPageId === pageId && filteredPages.length > 0) {
      updatedState.selectedPageId = filteredPages[0].id;
    } else if (filteredPages.length === 0) {
      updatedState.selectedPageId = null;
    }

    updateBuilderState(updatedState);
  }, [state.pages, state.selectedPageId, updateBuilderState]);

  const getPageById = useCallback((pageId: string) => {
    return state.pages.find((page) => page.id === pageId) || null;
  }, [state.pages]);

  const getActivePage = useCallback(() => {
    return state.pages.find((page) => page.id === state.selectedPageId) || null;
  }, [state.pages, state.selectedPageId]);

  return {
    pages: state.pages,
    selectedPageId: state.selectedPageId,
    setActivePage,
    addPage,
    updatePage,
    removePage,
    getPageById,
    getActivePage,
  };
};