import { BlockProperties } from "@halogen/common/types"
import Image from "next/image"

export function BasicTestimonials(fields: typeof properties.fields) {
  return (
    <section className="bg-muted py-16 md:py-24">
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
          {/* Map through testimonials list */}
          {fields?.testimonials?.value && fields.testimonials.value.length > 0 && 
            fields.testimonials.value.map((testimonial: any, index: number) => (
              <div key={index} className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
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
                    {testimonial.quote}
                  </p>
                </blockquote>

                <div className="flex items-center">
                  {testimonial.image && (
                    <div className="mr-4 h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    {testimonial.title && (
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}

export const properties: BlockProperties = {
  name: "Basic Testimonials",
  description: "A simple testimonials section with customer quotes.",
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
    testimonials: {
      type: "list",
      name: "testimonials",
      label: "Testimonials",
      description: "List of customer testimonials to display",
      required: true,
      value: {
        name: "Testimonials",
        description: "Collection of customer testimonials",
        items: {
          name: {
            type: "text",
            name: "name",
            label: "Name",
            description: "Customer's name",
            required: true,
            placeholder: "Enter customer name"
          },
          title: {
            type: "text",
            name: "title",
            label: "Title",
            description: "Customer's job title and company",
            required: false,
            placeholder: "Enter job title and company"
          },
          quote: {
            type: "textarea",
            name: "quote",
            label: "Testimonial Quote",
            description: "The testimonial text from the customer",
            required: true,
            placeholder: "Enter the testimonial quote"
          },
          image: {
            type: "url",
            name: "image",
            label: "Profile Image URL",
            description: "URL to the customer's profile image",
            required: false,
            placeholder: "Enter image URL"
          }
        }
      },
      defaultValue: [
        {
          name: "Sarah Johnson",
          title: "Product Manager, Acme Inc.",
          quote: "\"This platform has transformed how our team collaborates. The intuitive interface and powerful features have increased our productivity by 40%. It's now an essential part of our daily workflow.\"",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
        },
        {
          name: "Michael Thompson",
          title: "CTO, TechNova",
          quote: "\"We've tried many project management tools, but this one stands out. The customizable dashboards and real-time updates have made our team more efficient and aligned. Highly recommended!\"",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
        },
        {
          name: "Emily Chen",
          title: "Founder, GrowthLab",
          quote: "\"As a startup founder, I needed a solution that could scale with us. This platform has been perfect - easy to onboard new team members and the automation features save us countless hours every week.\"",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
        }
      ]
    }
  },
}
