import { useBuilderContext } from "@/context/builder.context";
import { PageData } from "@halogen/common/types";
import { generateId } from "@halogen/common";
import { useCallback } from "react";

export const usePage = () => {
  const { state, updateBuilderState } = useBuilderContext();

  const setActivePage = useCallback((pageId: string) => {
    updateBuilderState({ selectedPageId: pageId });
  }, [updateBuilderState]);

  const addPage = useCallback((page: Partial<PageData>) => {
    const newPage: PageData = {
      ...page,
      page_id: page.page_id || generateId(9),
      name: page.name || "New Page",
      path: page.path || `/${page.name?.toLowerCase().replace(/\s+/g, "-") || "new-page"}`,
      isStatic: page.isStatic ?? false,
      createdAt: page.createdAt || new Date().toISOString(),
      updatedAt: page.updatedAt || new Date().toISOString(),
    };

    console.log('THE NEW PAGE:::', newPage)

    updateBuilderState({
      pages: [...state.pages, newPage],
      selectedPageId: newPage.page_id,
    });

    return newPage;
  }, [state.pages, updateBuilderState]);

  const updatePage = useCallback((pageId: string, updates: Partial<PageData>) => {
    const updatedPages = state.pages.map((page) => {
      if (page.page_id === pageId) {
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
    const filteredPages = state.pages.filter((page) => page.page_id !== pageId);
    const updatedState: Partial<Parameters<typeof updateBuilderState>[0]> = {
      pages: filteredPages,
    };

    if (state.selectedPageId === pageId && filteredPages.length > 0) {
      updatedState.selectedPageId = filteredPages[0].page_id;
    } else if (filteredPages.length === 0) {
      updatedState.selectedPageId = null;
    }

    updateBuilderState(updatedState);
  }, [state.pages, state.selectedPageId, updateBuilderState]);

  const getPageById = useCallback((pageId: string) => {
    return state.pages.find((page) => page.page_id === pageId) || null;
  }, [state.pages]);

  const getActivePage = useCallback(() => {
    return state.pages.find((page) => page.page_id === state.selectedPageId) || null;
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