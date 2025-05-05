'use client';
import React, { useEffect, useState } from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { DynamicBlockRenderer } from './block-renderer';
import { useBuilderContext } from '@/context/builder.context';

type Props = {};

export default function PageBuilderPreview({}: Props) {
  const [show, setShow] = useState(false);
  const { state } = useBuilderContext();

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <main className="h-body bg-white flex-1 overflow-hidden grid grid-cols-1">
      {
        show && (
          <Frame
            className='min-h-screen w-full'
            initialContent={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                        <style type="text/tailwindcss">
                          @layer base {
                            :root {
                              --header-height: 3.5rem;
                              --body-height: calc(100vh - var(--header-height));
                              --panel-body-height: calc(100vh - (var(--header-height) * 2));
                              
                              --background: 0 0% 100%;
                              --foreground: 240 10% 3.9%;
                              
                              --card: 0 0% 100%;
                              --card-foreground: 240 10% 3.9%;
                              
                              --popover: 0 0% 100%;
                              --popover-foreground: 240 10% 3.9%;
                              
                              --primary: 261 69% 61%;
                              --primary-foreground: 0 0% 98%;
                              
                              --secondary: 24 100% 48%;
                              --secondary-foreground: 240 5.9% 10%;
                              
                              --muted: 240 4.8% 95.9%;
                              --muted-foreground: 240 3.8% 46.1%;
                              
                              --accent: 240 4.8% 95.9%;
                              --accent-foreground: 240 5.9% 10%;
                              
                              --destructive: 0 84.2% 60.2%;
                              --destructive-foreground: 0 0% 98%;
                              
                              --border: 240 5.9% 90%;
                              --input: 240 5.9% 90%;
                              --ring: 261 69% 61%;
                              
                              --radius: 0.75rem;
                            }
                            
                            .dark {
                              --background: 239 11% 12%;
                              --foreground: 0 0% 98%;
                              
                              --card: 240 10% 3.9%;
                              --card-foreground: 0 0% 98%;
                              
                              --popover: 240 10% 3.9%;
                              --popover-foreground: 0 0% 98%;
                              
                              --primary: 261 69% 61%;
                              --primary-foreground: 0 0% 98%;
                              
                              --secondary: 24 100% 48%;
                              --secondary-foreground: 0 0% 98%;
                              
                              --muted: 240 3.7% 15.9%;
                              --muted-foreground: 240 5% 64.9%;
                              
                              --accent: 240 3.7% 15.9%;
                              --accent-foreground: 0 0% 98%;
                              
                              --destructive: 0 62.8% 30.6%;
                              --destructive-foreground: 0 0% 98%;
                              
                              --border: 240 3.7% 15.9%;
                              --input: 240 3.7% 15.9%;
                              --ring: 261 69% 61%;
                            }
                          }
                          
                          @theme {
                            --color-primary: hsl(var(--primary));
                            --color-primary-foreground: hsl(var(--primary-foreground));
                            --color-secondary: hsl(var(--secondary));
                            --color-secondary-foreground: hsl(var(--secondary-foreground));
                            --color-background: hsl(var(--background));
                            --color-foreground: hsl(var(--foreground));
                            --color-muted: hsl(var(--muted));
                            --color-muted-foreground: hsl(var(--muted-foreground));
                            --color-accent: hsl(var(--accent));
                            --color-accent-foreground: hsl(var(--accent-foreground));
                            --color-card: hsl(var(--card));
                            --color-card-foreground: hsl(var(--card-foreground));
                            --color-popover: hsl(var(--popover));
                            --color-popover-foreground: hsl(var(--popover-foreground));
                            --color-destructive: hsl(var(--destructive));
                            --color-destructive-foreground: hsl(var(--destructive-foreground));
                            --color-border: hsl(var(--border));
                            --color-input: hsl(var(--input));
                            --color-ring: hsl(var(--ring));
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
