import React from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ColorRightPanel from './ColorRightPanel';
import BorderRightPanel from './BorderRightPanel';
import FontRightPanel from './FontRightPanel';

export default function ThemeRightPanel() {
    const { state } = useBuilderContext();

    return (
        <div className="min-h-[calc(var(--panel-body-height))]">
            <div className="pt-2 pb-8 pl-2 relative">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Theme Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Customize the appearance of your site by adjusting colors, borders, and fonts.
                        </p>
                    </div>

                    <Accordion type="multiple" defaultValue={['theme-colors']}>
                        <AccordionItem value="theme-colors">
                            <AccordionTrigger className="text-md font-medium">
                                Colors
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                                <ColorRightPanel />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="theme-border">
                            <AccordionTrigger className="text-md font-medium">
                                Border Radius
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                                <BorderRightPanel />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="theme-fonts">
                            <AccordionTrigger className="text-md font-medium">
                                Fonts
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                                <FontRightPanel />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
