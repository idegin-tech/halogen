"use client"

import { BlockProperties } from "@halogen/common/types";
import { themeColorOptions, roundnessOptions, alignmentOptions } from '../../../config';

interface BlogPost {
    title: string;
    excerpt: string;
    image?: string;
    date?: string;
}

function hasValueProp(val: unknown): val is { value: unknown } {
    return val !== null && typeof val === 'object' && 'value' in val;
}

function getStringField(obj: Record<string, unknown>, key: string, defaultValue: string): string {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === 'string') return val;
    if (hasValueProp(val) && typeof val.value === 'string') return val.value;
    return defaultValue;
}

function getArrayField(obj: Record<string, unknown>, key: string, defaultValue: string[]): string[] {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (Array.isArray(val)) return val;
    if (hasValueProp(val) && Array.isArray(val.value)) return val.value;
    return defaultValue;
}

function getPostsArrayField(obj: Record<string, unknown>, key: string, defaultValue: BlogPost[]): BlogPost[] {
    if (!obj) return defaultValue;
    const val = obj[key];
    let posts: unknown[] = [];

    if (Array.isArray(val)) {
        posts = val;
    } else if (hasValueProp(val) && Array.isArray(val.value)) {
        posts = val.value;
    } else {
        return defaultValue;
    }

    return posts.filter((post: unknown): post is BlogPost =>
        post !== null && typeof post === 'object' &&
        'title' in post && 'excerpt' in post
    );
}

function getBoolField(obj: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (typeof val === 'boolean') return val;
    if (hasValueProp(val) && typeof val.value === 'boolean') return val.value;
    return defaultValue;
}

function getNumberField(obj: Record<string, unknown>, key: string, defaultValue: number): number {
    if (!obj) return defaultValue;
    const val = obj[key];
    if (typeof val === 'number') return val;
    if (hasValueProp(val) && typeof val.value === 'number') return val.value;
    return defaultValue;
}

export function BlogSection(fields: Record<string, unknown>) {
    const content = properties.contentFields;
    const theme = properties.themeFields;
    const layout = properties.layoutFields;

    const heading = getStringField(fields, 'heading', content.heading?.defaultValue ?? 'Blog');
    const subheading = getStringField(fields, 'subheading', content.subheading?.defaultValue ?? 'Latest updates and stories');
    const buttonText = getStringField(fields, 'buttonText', content.buttonText?.defaultValue ?? 'Show More');
    const buttonLink = getStringField(fields, 'buttonLink', content.buttonLink?.defaultValue ?? '#');
    const posts: BlogPost[] = getPostsArrayField(fields, 'posts', content.posts?.defaultValue ?? []);

    const backgroundColor = getStringField(fields, 'backgroundColor', theme.backgroundColor?.defaultValue ?? 'background');
    const headingColor = getStringField(fields, 'headingColor', theme.headingColor?.defaultValue ?? 'foreground');
    const subheadingColor = getStringField(fields, 'subheadingColor', theme.subheadingColor?.defaultValue ?? 'muted-foreground');
    const cardBackgroundColor = getStringField(fields, 'cardBackgroundColor', theme.cardBackgroundColor?.defaultValue ?? 'card');
    const cardBorderColor = getStringField(fields, 'cardBorderColor', theme.cardBorderColor?.defaultValue ?? 'border');
    const cardTextColor = getStringField(fields, 'cardTextColor', theme.cardTextColor?.defaultValue ?? 'foreground');
    const cardShadow = getStringField(fields, 'cardShadow', theme.cardShadow?.defaultValue ?? 'md');
    const cardPadding = getStringField(fields, 'cardPadding', theme.cardPadding?.defaultValue ?? 'md');
    const cardImageAspect = getStringField(fields, 'cardImageAspect', theme.cardImageAspect?.defaultValue ?? '16-9');
    const cardRoundness = getStringField(fields, 'cardRoundness', theme.cardRoundness?.defaultValue ?? 'md');
    const buttonColor = getStringField(fields, 'buttonColor', theme.buttonColor?.defaultValue ?? 'primary');
    const buttonRoundness = getStringField(fields, 'buttonRoundness', theme.buttonRoundness?.defaultValue ?? 'md');

    const textAlign = getStringField(fields, 'textAlign', layout.textAlign?.defaultValue ?? 'center');
    const columns = getNumberField(fields, 'columns', layout.columns?.defaultValue ?? 3);
    const showButton = getBoolField(fields, 'showButton', layout.showButton?.defaultValue ?? true);
    const spacing = getArrayField(fields, 'spacing', layout.spacing?.defaultValue ?? ['top', 'bottom']);

    const alignmentClass = textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left';
    const justifyClass = textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start';

    const columnClass = columns === 1 ? 'md:grid-cols-1' :
        columns === 2 ? 'md:grid-cols-2' :
            columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

    const sectionClass = [
        'py-16',
        backgroundColor !== 'background' ? `bg-${backgroundColor}` : 'bg-background',
        headingColor !== 'foreground' ? `text-${headingColor}` : 'text-foreground',
        spacing.includes('top') ? 'pt-20' : '',
        spacing.includes('bottom') ? 'pb-20' : '',
    ].filter(Boolean).join(' ');

    // Card shadow mapping
    const cardShadowClass = cardShadow === 'none' ? '' : cardShadow === 'sm' ? 'shadow-sm' : cardShadow === 'lg' ? 'shadow-lg' : 'shadow-md';
    // Card padding mapping
    const cardPaddingClass = cardPadding === 'none' ? 'p-0' : cardPadding === 'sm' ? 'p-3' : cardPadding === 'lg' ? 'p-8' : 'p-6';
    // Card roundness mapping
    const cardRoundnessClass = cardRoundness === 'none' ? 'rounded-none' : cardRoundness === 'lg' ? 'rounded-lg' : cardRoundness === 'xl' ? 'rounded-xl' : cardRoundness === 'full' ? 'rounded-full' : 'rounded-md';
    // Card text color
    const cardTextColorClass = cardTextColor !== 'foreground' ? `text-${cardTextColor}` : 'text-foreground';
    // Card image aspect ratio
    let cardImageAspectClass = '';
    if (cardImageAspect === '16-9') cardImageAspectClass = 'aspect-[16/9]';
    else if (cardImageAspect === '4-3') cardImageAspectClass = 'aspect-[4/3]';
    else if (cardImageAspect === '1-1') cardImageAspectClass = 'aspect-square';
    // else auto: no aspect class

    const cardClass = [
        'flex flex-col h-full',
        cardBackgroundColor !== 'card' ? `bg-${cardBackgroundColor}` : 'bg-card',
        cardBorderColor !== 'border' ? `border border-${cardBorderColor}` : 'border border-border',
        cardTextColorClass,
        cardShadowClass,
        cardPaddingClass,
        cardRoundnessClass,
    ].filter(Boolean).join(' ');

    const buttonClass = [
        'px-6 py-3 font-medium transition-colors',
        buttonColor !== 'primary' ? `bg-${buttonColor}` : 'bg-primary',
        'text-primary-foreground hover:opacity-90',
        buttonRoundness !== 'md' ? `rounded-${buttonRoundness}` : 'rounded-md',
    ].filter(Boolean).join(' ');

    return (
        <section className={sectionClass}>
            <div className="container mx-auto px-4">
                <div className={`mb-10 ${alignmentClass}`}>
                    <h2 className={`text-3xl font-bold mb-2 ${headingColor !== 'foreground' ? `text-${headingColor}` : 'text-foreground'}`}>
                        {heading}
                    </h2>
                    <p className={`mb-6 ${subheadingColor !== 'muted-foreground' ? `text-${subheadingColor}` : 'text-muted-foreground'}`}>
                        {subheading}
                    </p>
                </div>
                <div className={`grid gap-8 ${columnClass}`}>
                    {posts.map((post, idx) => (
                        <div key={idx} className={cardClass}>
                            {post.image && typeof post.image === "string" && (
                                <div className={["mb-4 w-full", cardImageAspectClass].filter(Boolean).join(' ')}>
                                    <img
                                        src={post.image}
                                        alt={typeof post.title === "string" ? post.title : ""}
                                        className={[cardRoundnessClass, "object-cover w-full h-full"].join(' ')}
                                        style={cardImageAspect === 'auto' ? { aspectRatio: undefined } : {}}
                                    />
                                </div>
                            )}
                            <h3 className="text-xl font-semibold mb-2">
                                {typeof post.title === "string" ? post.title : ""}
                            </h3>
                            <p className="mb-4 flex-1">
                                {typeof post.excerpt === "string" ? post.excerpt : ""}
                            </p>
                            {post.date && typeof post.date === "string" && (
                                <span className="text-xs text-muted-foreground mb-2">{post.date}</span>
                            )}
                        </div>
                    ))}
                </div>
                {showButton && (
                    <div className={`flex mt-10 ${justifyClass}`}>
                        <a href={buttonLink} className={buttonClass}>
                            {buttonText}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}

export const properties: BlockProperties = {
    name: "Blog Section",
    description: "A section to display blog posts with heading, subheading, and a show more button.",

    contentFields: {
        heading: {
            type: "text",
            name: "heading",
            label: "Heading",
            description: "Main heading for the blog section",
            defaultValue: "Blog",
            placeholder: "Enter heading..."
        },
        subheading: {
            type: "text",
            name: "subheading",
            label: "Subheading",
            description: "Supporting text below the heading",
            defaultValue: "Latest updates and stories",
            placeholder: "Enter subheading..."
        },
        buttonText: {
            type: "text",
            name: "buttonText",
            label: "Button Text",
            description: "Text for the show more button",
            defaultValue: "Show More",
            placeholder: "Enter button text..."
        },
        buttonLink: {
            type: "text",
            name: "buttonLink",
            label: "Button Link",
            description: "URL for the show more button",
            defaultValue: "#",
            placeholder: "Enter button URL..."
        },
        posts: {
            type: "list",
            name: "posts",
            label: "Blog Posts",
            description: "List of blog posts to display",
            defaultValue: [
                {
                    title: "Introducing Halogen Platform",
                    excerpt: "Discover the features and benefits of the Halogen Platform for modern web development.",
                    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80",
                    date: "2025-07-01"
                },
                {
                    title: "How to Build Scalable Web Apps",
                    excerpt: "A step-by-step guide to building scalable and maintainable web applications using Halogen.",
                    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
                    date: "2025-06-15"
                },
                {
                    title: "Designing with Halogen UI Blocks",
                    excerpt: "Tips and tricks for creating beautiful UIs with Halogen's block-based design system.",
                    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
                    date: "2025-05-30"
                }
            ],
            value: {
                name: "Blog Post",
                description: "Individual blog post configuration",
                contentFields: {
                    title: {
                        type: "text",
                        name: "title",
                        label: "Post Title",
                        defaultValue: "",
                        placeholder: "Enter post title..."
                    },
                    excerpt: {
                        type: "textarea",
                        name: "excerpt",
                        label: "Post Excerpt",
                        defaultValue: "",
                        placeholder: "Enter post excerpt..."
                    },
                    image: {
                        type: "image",
                        name: "image",
                        label: "Post Image",
                        defaultValue: "",
                        placeholder: "Enter image URL..."
                    },
                    date: {
                        type: "text",
                        name: "date",
                        label: "Post Date",
                        defaultValue: "",
                        placeholder: "Enter post date..."
                    }
                },
                themeFields: {},
                layoutFields: {}
            }
        }
    },

    themeFields: {
        backgroundColor: {
            type: "select",
            name: "backgroundColor",
            label: "Background Color",
            description: "Background color for the section",
            options: themeColorOptions,
            defaultValue: "background"
        },
        headingColor: {
            type: "select",
            name: "headingColor",
            label: "Heading Color",
            description: "Color for the main heading",
            options: themeColorOptions,
            defaultValue: "foreground"
        },
        subheadingColor: {
            type: "select",
            name: "subheadingColor",
            label: "Subheading Color",
            description: "Color for the subheading",
            options: themeColorOptions,
            defaultValue: "muted-foreground"
        },
        // Blog Post Card Styling Fields (apply to all cards)
        cardBackgroundColor: {
            type: "select",
            name: "cardBackgroundColor",
            label: "Card Background Color",
            description: "Background color for all blog post cards",
            options: themeColorOptions,
            defaultValue: "card"
        },
        cardBorderColor: {
            type: "select",
            name: "cardBorderColor",
            label: "Card Border Color",
            description: "Border color for all blog post cards",
            options: themeColorOptions,
            defaultValue: "border"
        },
        cardTextColor: {
            type: "select",
            name: "cardTextColor",
            label: "Card Text Color",
            description: "Text color for all blog post cards",
            options: themeColorOptions,
            defaultValue: "foreground"
        },
        cardShadow: {
            type: "select",
            name: "cardShadow",
            label: "Card Shadow",
            description: "Shadow style for all blog post cards",
            options: [
                { label: "None", value: "none" },
                { label: "Small", value: "sm" },
                { label: "Medium", value: "md" },
                { label: "Large", value: "lg" }
            ],
            defaultValue: "md"
        },
        cardPadding: {
            type: "select",
            name: "cardPadding",
            label: "Card Padding",
            description: "Padding inside all blog post cards",
            options: [
                { label: "None", value: "none" },
                { label: "Small", value: "sm" },
                { label: "Medium", value: "md" },
                { label: "Large", value: "lg" }
            ],
            defaultValue: "md"
        },
        cardImageAspect: {
            type: "select",
            name: "cardImageAspect",
            label: "Card Image Aspect Ratio",
            description: "Aspect ratio for all blog post card images",
            options: [
                { label: "16:9", value: "16-9" },
                { label: "4:3", value: "4-3" },
                { label: "1:1", value: "1-1" },
                { label: "Auto", value: "auto" }
            ],
            defaultValue: "16-9"
        },
        cardRoundness: {
            type: "select",
            name: "cardRoundness",
            label: "Card Roundness",
            description: "Border radius for all blog post cards",
            options: roundnessOptions,
            defaultValue: "md"
        },
        buttonColor: {
            type: "select",
            name: "buttonColor",
            label: "Button Color",
            description: "Color for the show more button",
            options: themeColorOptions,
            defaultValue: "primary"
        },
        buttonRoundness: {
            type: "select",
            name: "buttonRoundness",
            label: "Button Roundness",
            description: "Border radius for the button",
            options: roundnessOptions,
            defaultValue: "md"
        }
    },

    layoutFields: {
        textAlign: {
            type: "select",
            name: "textAlign",
            label: "Text Alignment",
            description: "Text alignment for the section",
            options: alignmentOptions,
            defaultValue: "center"
        },
        columns: {
            type: "select",
            name: "columns",
            label: "Number of Columns",
            description: "Number of columns for the blog posts grid",
            options: [
                { label: "1 Column", value: 1 },
                { label: "2 Columns", value: 2 },
                { label: "3 Columns", value: 3 },
                { label: "4 Columns", value: 4 }
            ],
            defaultValue: 3
        },
        showButton: {
            type: "switch",
            name: "showButton",
            label: "Show Button",
            description: "Whether to show the show more button",
            defaultValue: true
        },
        spacing: {
            type: "multi_toggle",
            name: "spacing",
            label: "Spacing",
            description: "Add vertical padding to the section",
            options: [
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" }
            ],
            defaultValue: ["top", "bottom"]
        }
    }
};
