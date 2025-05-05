import { BlockProperties } from "@/types/block.types"
import Image from "next/image"

export function BasicTestimonials(fields: typeof properties.fields) {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {fields?.heading?.value && (
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {fields.heading.value}
            </h2>
          )}
          
          {fields?.subheading?.value && (
            <p className="mb-12 text-lg text-muted-foreground">
              {fields.subheading.value}
            </p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Testimonial 1 - Only render if all required fields are present */}
          {fields?.testimonial1?.value && fields?.testimonialName1?.value && (
            <div className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="mb-6 flex-1">
                <p className="text-foreground">
                  {fields.testimonial1.value}
                </p>
              </blockquote>

              <div className="flex items-center">
                {fields?.testimonialImage1?.value && (
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={fields.testimonialImage1.value}
                      alt={fields.testimonialName1.value}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{fields.testimonialName1.value}</p>
                  {fields?.testimonialTitle1?.value && (
                    <p className="text-sm text-muted-foreground">{fields.testimonialTitle1.value}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Testimonial 2 - Only render if all required fields are present */}
          {fields?.testimonial2?.value && fields?.testimonialName2?.value && (
            <div className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="mb-6 flex-1">
                <p className="text-foreground">
                  {fields.testimonial2.value}
                </p>
              </blockquote>

              <div className="flex items-center">
                {fields?.testimonialImage2?.value && (
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={fields.testimonialImage2.value}
                      alt={fields.testimonialName2.value}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{fields.testimonialName2.value}</p>
                  {fields?.testimonialTitle2?.value && (
                    <p className="text-sm text-muted-foreground">{fields.testimonialTitle2.value}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Testimonial 3 - Only render if all required fields are present */}
          {fields?.testimonial3?.value && fields?.testimonialName3?.value && (
            <div className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="mb-6 flex-1">
                <p className="text-foreground">
                  {fields.testimonial3.value}
                </p>
              </blockquote>

              <div className="flex items-center">
                {fields?.testimonialImage3?.value && (
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={fields.testimonialImage3.value}
                      alt={fields.testimonialName3.value}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{fields.testimonialName3.value}</p>
                  {fields?.testimonialTitle3?.value && (
                    <p className="text-sm text-muted-foreground">{fields.testimonialTitle3.value}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export const properties: BlockProperties = {
  name: "Basic Testimonials",
  description: "A simple testimonials section with three customer quotes.",
  fields: {
    heading: {
      type: "text",
      name: "heading",
      label: "Section Heading",
      description: "The main heading of the testimonials section.",
      required: true,
      defaultValue: "Trusted by teams worldwide",
      placeholder: "Enter a heading for your testimonials section",
    },
    subheading: {
      type: "textarea",
      name: "subheading",
      label: "Section Subheading",
      description: "The subheading text below the main heading.",
      required: true,
      defaultValue: "Discover why thousands of teams choose our platform to power their business.",
      placeholder: "Enter a subheading for your testimonials section",
    },
    testimonial1: {
      type: "textarea",
      name: "testimonial1",
      label: "Testimonial 1 Quote",
      description: "The first customer testimonial quote.",
      required: true,
      defaultValue: "\"This platform has transformed how our team collaborates. The intuitive interface and powerful features have increased our productivity by 40%. It's now an essential part of our daily workflow.\"",
      placeholder: "Enter the first testimonial quote",
    },
    testimonialName1: {
      type: "text",
      name: "testimonialName1",
      label: "Testimonial 1 Name",
      description: "The name of the first testimonial customer.",
      required: true,
      defaultValue: "Sarah Johnson",
      placeholder: "Enter the customer name",
    },
    testimonialTitle1: {
      type: "text",
      name: "testimonialTitle1",
      label: "Testimonial 1 Title",
      description: "The job title and company of the first testimonial customer.",
      required: true,
      defaultValue: "Product Manager, Acme Inc.",
      placeholder: "Enter the customer's job title and company",
    },
    testimonialImage1: {
      type: "url",
      name: "testimonialImage1",
      label: "Testimonial 1 Image URL",
      description: "The image URL for the first testimonial customer.",
      required: true,
      defaultValue: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      placeholder: "Enter the image URL",
    },
    testimonial2: {
      type: "textarea",
      name: "testimonial2",
      label: "Testimonial 2 Quote",
      description: "The second customer testimonial quote.",
      required: true,
      defaultValue: "\"We've tried many project management tools, but this one stands out. The customizable dashboards and real-time updates have made our team more efficient and aligned. Highly recommended!\"",
      placeholder: "Enter the second testimonial quote",
    },
    testimonialName2: {
      type: "text",
      name: "testimonialName2",
      label: "Testimonial 2 Name",
      description: "The name of the second testimonial customer.",
      required: true,
      defaultValue: "Michael Thompson",
      placeholder: "Enter the customer name",
    },
    testimonialTitle2: {
      type: "text",
      name: "testimonialTitle2",
      label: "Testimonial 2 Title",
      description: "The job title and company of the second testimonial customer.",
      required: true,
      defaultValue: "CTO, TechNova",
      placeholder: "Enter the customer's job title and company",
    },
    testimonialImage2: {
      type: "url",
      name: "testimonialImage2",
      label: "Testimonial 2 Image URL",
      description: "The image URL for the second testimonial customer.",
      required: true,
      defaultValue: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      placeholder: "Enter the image URL",
    },
    testimonial3: {
      type: "textarea",
      name: "testimonial3",
      label: "Testimonial 3 Quote",
      description: "The third customer testimonial quote.",
      required: true,
      defaultValue: "\"As a startup founder, I needed a solution that could scale with us. This platform has been perfect - easy to onboard new team members and the automation features save us countless hours every week.\"",
      placeholder: "Enter the third testimonial quote",
    },
    testimonialName3: {
      type: "text",
      name: "testimonialName3",
      label: "Testimonial 3 Name",
      description: "The name of the third testimonial customer.",
      required: true,
      defaultValue: "Emily Chen",
      placeholder: "Enter the customer name",
    },
    testimonialTitle3: {
      type: "text",
      name: "testimonialTitle3",
      label: "Testimonial 3 Title",
      description: "The job title and company of the third testimonial customer.",
      required: true,
      defaultValue: "Founder, GrowthLab",
      placeholder: "Enter the customer's job title and company",
    },
    testimonialImage3: {
      type: "url",
      name: "testimonialImage3",
      label: "Testimonial 3 Image URL",
      description: "The image URL for the third testimonial customer.",
      required: true,
      defaultValue: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      placeholder: "Enter the image URL",
    },
  },
}
