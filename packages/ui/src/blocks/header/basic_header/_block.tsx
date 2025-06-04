"use client"

import { BlockProperties } from "@halogen/common/types";


interface ColorVariables {
  [key: string]: string;
}

export function BasicHeader(fields: typeof properties.contentFields & typeof properties.themeFields & typeof properties.layoutFields & { colorVariables?: ColorVariables }) {
  return (
    <header>
      Basic Header
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
