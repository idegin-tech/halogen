import { BlockProperties } from "@halogen/common/types"
import Image from "next/image"

export function SaasHeroSection(fields: typeof properties.fields) {
  return (
    <section className="relative overflow-hidden bg-muted/30 py-16 md:py-24 ">
      <div
        className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/50"
        aria-hidden="true"
      ></div>

      <div
        className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      ></div>

      <div className="container mx-auto px-4 sm:px-6 z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 min-h-[60vh]">
          <div className="flex flex-col space-y-6">
            {fields?.badgeText?.value && (
              <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
                <span className="mr-1 flex h-2 w-2 rounded-full bg-primary"></span>
                <span>{fields.badgeText.value}</span>
              </div>
            )}

            {fields?.title?.value && (
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {fields.title.value}{" "}
                {fields?.brandName?.value && (
                  <span className="text-primary">{fields.brandName.value}</span>
                )}
              </h1>
            )}

            {fields?.subtitle?.value && (
              <p className="max-w-md text-lg text-muted-foreground">
                {fields.subtitle.value}
              </p>
            )}

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
              {fields?.ctaText?.value && fields?.ctaLink?.value && (
                <a
                  href={fields.ctaLink.value}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {fields.ctaText.value}
                </a>
              )}

              {fields?.secondaryCtaText?.value && fields?.secondaryCtaLink?.value && (
                <a
                  href={fields.secondaryCtaLink.value}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {fields.secondaryCtaText.value}
                </a>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {fields?.feature1?.value && (
                <div className="flex items-center">
                  <svg
                    className="mr-1 h-4 w-4 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {fields.feature1.value}
                </div>
              )}
              {fields?.feature2?.value && (
                <div className="flex items-center">
                  <svg
                    className="mr-1 h-4 w-4 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {fields.feature2.value}
                </div>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg rounded-lg border border-border bg-card p-2 shadow-lg lg:ml-auto">
            <div
              className="absolute -top-2 -left-2 h-24 w-24 rounded-full bg-primary/10 blur-xl"
              aria-hidden="true"
            ></div>
            <div
              className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-secondary/10 blur-xl"
              aria-hidden="true"
            ></div>

            <div className="relative overflow-hidden rounded-md">
              {fields?.imageUrl?.value && fields?.imageAlt?.value && (
                <Image
                  src={fields.imageUrl.value}
                  alt={fields.imageAlt.value}
                  width={800}
                  height={500}
                  className="h-auto w-full rounded-md object-cover"
                />
              )}
            </div>

            <div className="absolute top-4 left-4 right-4 flex h-6 items-center space-x-2">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/70"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-warning/70"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-success/70"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const properties: BlockProperties = {
  name: "SaaS Hero Section",
  description: "A hero section for SaaS products with a call to action.",
  fields: {
    badgeText: {
      type: "text",
      name: "badgeText",
      label: "Badge Text",
      description: "The text that appears in the rounded badge at the top.",
      required: false,
      defaultValue: "Now available for all businesses",
      placeholder: "Enter badge text",
    },
    title: {
      type: "text",
      name: "title",
      label: "Title",
      description: "The main title of the hero section.",
      required: true,
      defaultValue: "Streamline your workflow with",
      placeholder: "Enter a title for your hero section",
    },
    brandName: {
      type: "text",
      name: "brandName",
      label: "Brand Name",
      description: "The brand name that appears highlighted in the title.",
      required: true,
      defaultValue: "TaskFlow",
      placeholder: "Enter your brand or product name",
    },
    subtitle: {
      type: "text",
      name: "subtitle",
      label: "Subtitle",
      description: "The subtitle of the hero section.",
      required: true,
      defaultValue: "The all-in-one platform that helps teams manage projects, track tasks, and collaborate seamlessly in one place.",
      placeholder: "Enter a subtitle for your hero section",
    },
    ctaText: {
      type: "text",
      name: "ctaText",
      label: "Primary CTA Text",
      description: "The text for the primary call to action button.",
      required: true,
      defaultValue: "Start free trial",
      placeholder: "Enter text for your primary call to action",
    },
    ctaLink: {
      type: "url",
      name: "ctaLink",
      label: "Primary CTA Link",
      description: "The URL for the primary call to action button.",
      required: true,
      defaultValue: "#",
      placeholder: "Enter a URL for your primary call to action",
    },
    secondaryCtaText: {
      type: "text",
      name: "secondaryCtaText",
      label: "Secondary CTA Text",
      description: "The text for the secondary call to action button.",
      required: false,
      defaultValue: "Book a demo",
      placeholder: "Enter text for your secondary call to action",
    },
    secondaryCtaLink: {
      type: "url",
      name: "secondaryCtaLink",
      label: "Secondary CTA Link",
      description: "The URL for the secondary call to action button.",
      required: false,
      defaultValue: "#",
      placeholder: "Enter a URL for your secondary call to action",
    },
    feature1: {
      type: "text",
      name: "feature1",
      label: "Feature 1",
      description: "First feature bullet point.",
      required: false,
      defaultValue: "No credit card required",
      placeholder: "Enter text for first feature",
    },
    feature2: {
      type: "text",
      name: "feature2",
      label: "Feature 2",
      description: "Second feature bullet point.",
      required: false,
      defaultValue: "14-day free trial",
      placeholder: "Enter text for second feature",
    },
    imageUrl: {
      type: "url",
      name: "imageUrl",
      label: "Hero Image",
      description: "The URL for the hero section image.",
      required: true,
      defaultValue: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      placeholder: "Enter image URL",
    },
    imageAlt: {
      type: "text",
      name: "imageAlt",
      label: "Image Alt Text",
      description: "Alternative text for the hero image for accessibility.",
      required: true,
      defaultValue: "Dashboard showing project management interface",
      placeholder: "Enter image description",
    }
  },
};

