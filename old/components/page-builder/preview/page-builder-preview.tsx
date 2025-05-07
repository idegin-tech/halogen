'use client';
import React, { useEffect, useState } from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { DynamicBlockRenderer } from './block-renderer';
import { useBuilderContext } from '@/context/builder.context';

type Props = {};

export default function PageBuilderPreview({ }: Props) {
  const [show, setShow] = useState(false);
  const { state } = useBuilderContext();

  // Find the currently active color set
  const activeColorSet = state.variableSets.find(set => set.key === 'colors' || set.id === 'set_colors');
  
  const colorVariables = state.variables.filter(v => {
    const setId = typeof v.variableSet === 'string' ? v.variableSet : v.variableSet.id;
    return v.type === 'color' && setId === activeColorSet?.id;
  });
  
  const cssVariables = colorVariables.map(v => {
    const varName = v.key.startsWith('--') ? v.key : `--${v.key}`;
    return `${varName}: ${v.primaryValue};`;
  }).join('\n                              ');

  useEffect(() => {
    setShow(true);
  }, []);

  const frameKey = JSON.stringify(colorVariables);

  return (
    <main className="h-body bg-white flex-1 overflow-hidden grid grid-cols-1">
      {
        show && (
          <Frame
            key={frameKey}
            className='h-body w-full max-h-body'
            initialContent={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=1024">
                        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                        <style type="text/tailwindcss">
                            :root {
                              ${cssVariables}
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
                        </style>
                      </head>
                      <body>
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
