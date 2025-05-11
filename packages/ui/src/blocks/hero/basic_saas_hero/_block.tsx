import { BlockProperties } from "@halogen/common/types"
import Image from "next/image"
import Link from "next/link"

export function SaasHeroSection(fields: typeof properties.fields) {
  return (
    <section className="relative w-full overflow-hidden py-20 md:py-32 lg:py-40">
      {/* Background decorative elements */}
      {fields?.showBackgroundElements?.value !== false && (
        <>
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-secondary/30 blur-3xl"></div>
        </>
      )}

      <div className="container mx-auto relative px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-2">
              {fields?.badgeText?.value && (
                <div className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
                  <span className="mr-2 h-2 w-2 rounded-full bg-primary"></span>
                  {fields.badgeText.value}
                </div>
              )}
              
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                {fields?.title?.value}
                {fields?.brandName?.value && (
                  <> <span className="text-primary">{fields.brandName.value}</span></>
                )}
              </h1>
              
              {fields?.subtitle?.value && (
                <p className="mt-4 max-w-[600px] text-lg text-muted-foreground md:text-xl">
                  {fields.subtitle.value}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              {fields?.ctaText?.value && fields?.ctaLink?.value && (
                <Link
                  href={fields.ctaLink.value}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {fields.ctaText.value}
                </Link>
              )}
              
              {fields?.secondaryCtaText?.value && fields?.secondaryCtaLink?.value && (
                <Link
                  href={fields.secondaryCtaLink.value}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/80 px-8 text-sm font-medium shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {fields.secondaryCtaText.value}
                </Link>
              )}
            </div>

            {(fields?.showClientSection?.value !== false) && (
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {(fields?.clientAvatars?.value && fields.clientAvatars.value.length > 0) ? (
                    fields.clientAvatars.value.map((client: any, i: number) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                      >
                        <img 
                          src={client.imageUrl || `/placeholder.svg?height=40&width=40`} 
                          width={40} 
                          height={40} 
                          alt={client.imageAlt || `Client ${i+1}`} 
                        />
                      </div>
                    ))
                  ) : (
                    // Only render default avatars if clientAvatars doesn't exist or is empty
                    [1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                      >
                        <img src={`/placeholder.svg?height=40&width=40`} width={40} height={40} alt={`Client ${i}`} />
                      </div>
                    ))
                  )}
                </div>
                
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {fields?.clientCountText?.value || "Trusted by 200+ companies"}
                  </p>
                  <div className="flex items-center text-muted-foreground">
                    {Array.from({ length: fields?.ratingStars?.value || 5 }).map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-primary"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="ml-2">{fields?.ratingText?.value || "5.0 (300+ reviews)"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative mx-auto lg:mr-0">
            <div className={`relative z-10 overflow-hidden rounded-2xl ${
              fields?.imageBorderWidth?.value 
                ? `border-[${fields.imageBorderWidth.value}px]`
                : 'border'
              } border-border/40 bg-background/50 ${
              fields?.imagePadding?.value !== undefined 
                ? `p-[${fields.imagePadding.value}px]`
                : 'p-2'
              } ${
              fields?.imageShadowSize?.value
                ? fields.imageShadowSize.value === 'none'
                  ? ''
                  : `shadow-${fields.imageShadowSize.value}`
                : 'shadow-xl'
              } backdrop-blur`}>
              {fields?.imageUrl?.value && (
                <img
                  src={fields.imageUrl.value}
                  width={600}
                  height={600}
                  alt={fields?.imageAlt?.value || "Hero image"}
                  className="aspect-square- rounded-xl object-cover"
                />
              )}
            </div>
            <div className="absolute -top-6 -right-6 z-0 h-24 w-24 rounded-lg bg-primary/10 blur-md"></div>
            <div className="absolute -bottom-8 -left-8 z-0 h-32 w-32 rounded-full bg-secondary/20 blur-md"></div>

            {/* Stats card */}
            {fields?.showStatsCard?.value !== false && (
              <div className="absolute -bottom-6 -left-6 z-20 rounded-lg border border-border/40 bg-background/80 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="rounded-md bg-primary/10 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{fields?.statsLabel?.value || "Growth Rate"}</p>
                    <p className="text-2xl font-bold text-primary">{fields?.statsValue?.value || "+143%"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const properties: BlockProperties = {
  name: "Business Consulting Hero Section",
  description: "A professional hero section for consulting businesses with social proof and statistics.",
  fields: {
    showBackgroundElements: {
      type: "checkbox",
      name: "showBackgroundElements",
      label: "Show Background Elements",
      description: "Whether to show the decorative background elements.",
      required: false,
      defaultValue: true,
    },
    badgeText: {
      type: "text",
      name: "badgeText",
      label: "Badge Text",
      description: "The text that appears in the rounded badge at the top.",
      required: false,
      defaultValue: "Strategic Business Consulting",
      placeholder: "Enter badge text",
    },
    title: {
      type: "text",
      name: "title",
      label: "Title",
      description: "The main title of the hero section.",
      required: true,
      defaultValue: "Transform Challenges into ",
      placeholder: "Enter a title for your hero section",
    },
    brandName: {
      type: "text",
      name: "brandName",
      label: "Highlighted Text",
      description: "The text that appears highlighted in the title.",
      required: true,
      defaultValue: "Opportunities",
      placeholder: "Enter text to highlight",
    },
    subtitle: {
      type: "text",
      name: "subtitle",
      label: "Subtitle",
      description: "The subtitle of the hero section.",
      required: true,
      defaultValue: "We help businesses achieve sustainable growth with tailored consulting services that deliver measurable results.",
      placeholder: "Enter a subtitle for your hero section",
    },
    ctaText: {
      type: "text",
      name: "ctaText",
      label: "Primary CTA Text",
      description: "The text for the primary call to action button.",
      required: true,
      defaultValue: "Explore Services",
      placeholder: "Enter text for your primary call to action",
    },
    ctaLink: {
      type: "url",
      name: "ctaLink",
      label: "Primary CTA Link",
      description: "The URL for the primary call to action button.",
      required: true,
      defaultValue: "#services",
      placeholder: "Enter a URL for your primary call to action",
    },
    secondaryCtaText: {
      type: "text",
      name: "secondaryCtaText",
      label: "Secondary CTA Text",
      description: "The text for the secondary call to action button.",
      required: false,
      defaultValue: "Contact Us",
      placeholder: "Enter text for your secondary call to action",
    },
    secondaryCtaLink: {
      type: "url",
      name: "secondaryCtaLink",
      label: "Secondary CTA Link",
      description: "The URL for the secondary call to action button.",
      required: false,
      defaultValue: "#contact",
      placeholder: "Enter a URL for your secondary call to action",
    },
    showClientSection: {
      type: "checkbox",
      name: "showClientSection",
      label: "Show Client Section",
      description: "Whether to show the client avatars and rating section.",
      required: false,
      defaultValue: true,
    },
    clientCountText: {
      type: "text",
      name: "clientCountText",
      label: "Client Count Text",
      description: "The text showing how many clients trust your business.",
      required: false,
      defaultValue: "Trusted by 200+ companies",
      placeholder: "Enter client count text",
    },
    ratingStars: {
      type: "number",
      name: "ratingStars",
      label: "Rating Stars",
      description: "Number of rating stars to display.",
      required: false,
      defaultValue: 5,
      min: 0,
      max: 5,
    },
    ratingText: {
      type: "text",
      name: "ratingText",
      label: "Rating Text",
      description: "Text displaying the rating value and number of reviews.",
      required: false,
      defaultValue: "5.0 (300+ reviews)",
      placeholder: "Enter rating text",
    },
    clientAvatars: {
      type: "list",
      name: "clientAvatars",
      label: "Client Avatars",
      description: "List of client avatars to display in the social proof section.",
      required: false,
      value: {
        name: "Client Avatars",
        description: "Configure client avatars",
        items: {
          imageUrl: {
            type: "url",
            name: "imageUrl",
            label: "Avatar Image URL",
            description: "URL to the client avatar image.",
            required: true,
            defaultValue: "https://plus.unsplash.com/premium_photo-1746420146061-0256c1335fe4?q=80&w=1934&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            placeholder: "Enter image URL"
          },
          imageAlt: {
            type: "text",
            name: "imageAlt",
            label: "Avatar Alt Text",
            description: "Alternative text for the avatar image.",
            required: false,
            defaultValue: "Client avatar",
            placeholder: "Enter alt text"
          }
        }
      },
      defaultValue: [
        {
          imageUrl: "https://randomuser.me/api/portraits/women/44.jpg", 
          imageAlt: "Client 1"
        },
        {
          imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          imageAlt: "Client 2"
        },
        {
          imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
          imageAlt: "Client 3"
        },
        {
          imageUrl: "https://randomuser.me/api/portraits/men/75.jpg",
          imageAlt: "Client 4"
        }
      ]
    },
    imageUrl: {
      type: "url",
      name: "imageUrl",
      label: "Hero Image",
      description: "The URL for the hero section image.",
      required: true,
      defaultValue: "/placeholder.svg?height=600&width=600",
      placeholder: "Enter image URL",
    },
    imageAlt: {
      type: "text",
      name: "imageAlt",
      label: "Image Alt Text",
      description: "Alternative text for the hero image for accessibility.",
      required: true,
      defaultValue: "Business consulting",
      placeholder: "Enter image description",
    },
    showStatsCard: {
      type: "checkbox",
      name: "showStatsCard",
      label: "Show Stats Card",
      description: "Whether to show the statistics card overlay on the image.",
      required: false,
      defaultValue: true,
    },
    imageBorderWidth: {
      type: "number",
      name: "imageBorderWidth",
      label: "Image Border Width",
      description: "Width of the border around the hero image (in pixels).",
      required: false,
      defaultValue: 1,
      min: 0,
      max: 10,
    },
    imagePadding: {
      type: "number",
      name: "imagePadding",
      label: "Image Padding",
      description: "Padding inside the hero image container (in pixels).",
      required: false,
      defaultValue: 8,
      min: 0,
      max: 32,
    },
    imageShadowSize: {
      type: "select",
      name: "imageShadowSize",
      label: "Image Shadow Size",
      description: "Size of the shadow effect for the hero image.",
      required: false,
      defaultValue: "xl",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2X Large", value: "2xl" }
      ]
    },
    statsLabel: {
      type: "text",
      name: "statsLabel",
      label: "Stats Label",
      description: "The label text for the statistics.",
      required: false,
      defaultValue: "Growth Rate",
      placeholder: "Enter stats label",
    },
    statsValue: {
      type: "text",
      name: "statsValue",
      label: "Stats Value",
      description: "The value text for the statistics.",
      required: false,
      defaultValue: "+143%",
      placeholder: "Enter stats value",
    }
  },
};

