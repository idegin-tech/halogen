"use client"

import { BlockProperties } from "@halogen/common/types";

interface ColorVariables {
  [key: string]: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BasicHeader(_fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
  return (
    <header className="bg-background text-foreground border-b border-border py-4">
      <div className="container mx-auto px-4">
        Basic Header
      </div>
    </header>
  );
}

export const properties: BlockProperties = {
  name: "Basic Header",
  description: "A responsive header with dropdown navigation, mobile menu, and customizable buttons",

  contentFields: {

  },
  themeFields: {

  },

  layoutFields: {

  }
};
