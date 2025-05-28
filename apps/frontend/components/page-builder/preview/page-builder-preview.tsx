'use client';
import React, { useEffect, useState } from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { DynamicBlockRenderer } from './block-renderer';
import { useBuilderContext } from '@/context/builder.context';
import { useSyncContext } from '@/context/sync.context';
import { useProjectContext } from '@/context/project.context';

type Props = {};

export default function PageBuilderPreview({ }: Props) {
  const [show, setShow] = useState(false);
  const { state } = useBuilderContext();
  const { state: { project, settings } } = useProjectContext();
  const { isLoading } = useSyncContext();

  const activeColorSet = state.variableSets.find(set => set.key === 'colors' || set.set_id === 'set_colors');

  const colorVariablesFromState = state.variables.filter(v => {
    const setId = typeof v.variableSet === 'string' ? v.variableSet : v.variableSet?.set_id;
    return v.type === 'color' && (!activeColorSet || setId === activeColorSet?.set_id);
  });
  const cssVariables = colorVariablesFromState.map(v => {
    const varName = v.key.startsWith('--') ? v.key : `--${v.key}`;
    return `${varName}: ${v.primaryValue};`;
  }).join('\n                              ');

  const headingFont = project?.settings?.headingFont || settings?.headingFont;
  const bodyFont = project?.settings?.bodyFont || settings?.bodyFont;

  let googleFontsUrl = null;
  if (headingFont || bodyFont) {
    const fontFamilies = [];
    if (headingFont) fontFamilies.push(headingFont.replace(/\s/g, '+'));
    if (bodyFont && bodyFont !== headingFont) fontFamilies.push(bodyFont.replace(/\s/g, '+'));

    if (fontFamilies.length > 0) {
      googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
    }
  }

  const fontStyles = `
    ${headingFont ? `--heading-font: "${headingFont}", var(--font-sans), sans-serif;` : ''}
    ${bodyFont ? `--body-font: "${bodyFont}", var(--font-sans), sans-serif;` : ''}
    ${bodyFont ? `font-family: "${bodyFont}", var(--font-sans), sans-serif;` : ''}
  `;

  useEffect(() => {
    const requirementsMet = !isLoading &&
      state.selectedPageId &&
      state.pages.length > 0 &&
      project &&
      colorVariablesFromState.length > 0;

    if (requirementsMet) {
      setTimeout(() => {
        setShow(true);
      }, 600);
    } else {
      setShow(false);
    }
  }, [isLoading, state.selectedPageId, state.pages, project, settings, headingFont, bodyFont, colorVariablesFromState]);

  const frameKey = JSON.stringify({ ...colorVariablesFromState, headingFont, bodyFont, show });

  return (
    <main className="h-[var(--body-height)] max-h-[var(--body-height)] bg-white flex-1 overflow-hidden grid grid-cols-1">
      {
        show && (
          <Frame
            key={frameKey}
            className='h-[var(--body-height)] w-full max-h-[var(--body-height)]'
            initialContent={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=1024">
                        ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
                        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                        <style type="text/tailwindcss">
                            :root {
                              ${cssVariables}
                              ${fontStyles}
                            }
                            @theme {
                                --color-primary: var(--primary);
                                --color-primary-foreground: var(--primary-foreground);
                                --color-secondary: var(--secondary);
                                --color-secondary-foreground: var(--secondary-foreground);
                                --color-background: var(--background);
                                --color-foreground: var(--foreground);
                                --color-muted: var(--muted);
                                --color-muted-foreground: var(--muted-foreground);
                                --color-accent: var(--accent);
                                --color-accent-foreground: var(--accent-foreground);
                                --color-card: var(--card);
                                --color-card-foreground: var(--card-foreground);
                                --color-destructive: var(--destructive);
                                --color-destructive-foreground: var(--destructive-foreground);
                                --color-border: var(--border);
                                --color-input: var(--input);
                                --color-ring: var(--ring);
                            }
                            
                            body {
                              ${bodyFont ? `font-family: "${bodyFont}", var(--font-sans), sans-serif;` : ''}
                            }
                            
                            h1, h2, h3, h4, h5, h6 {
                              ${headingFont ? `font-family: "${headingFont}", var(--font-sans), sans-serif;` : ''}
                            }
                        </style>
                      </head>
                      <body class="bg-background text-foreground antialiased">
                        <div id="mountHere"></div>
                      </body>
                    </html>
                `}
            mountTarget="#mountHere"
          >
            <FrameContextConsumer>
              {() => (
                <DynamicBlockRenderer pageId={state.selectedPageId || undefined} />
              )}
            </FrameContextConsumer>
          </Frame>
        )
      }
    </main>
  );
}
