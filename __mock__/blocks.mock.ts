import { BlockInstance } from "@/types/block.types";

export const blocks:BlockInstance[] = [
    {
        id: "1",
        index: 0,
        page: "1",
        folderName: "hero",
        subFolder: "basic_saas_hero",
        value: {
            badgeText: {
              value: "Now available for all businesses"
            },
            title: {
              value: "Streamline your workflow with"
            },
            brandName: {
              value: "TaskFlow"
            },
            subtitle: {
              value: "The all-in-one platform that helps teams manage projects, track tasks, and collaborate seamlessly in one place."
            },
            ctaText: {
              value: "Start free trial"
            },
            ctaLink: {
              value: "#"
            },
            secondaryCtaText: {
              value: "Book a demo"
            },
            secondaryCtaLink: {
              value: "#"
            },
            feature1: {
              value: "No credit card required"
            },
            feature2: {
              value: "14-day free trial"
            },
            imageUrl: {
              value: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            },
            imageAlt: {
              value: "TaskFlow dashboard showing project management interface"
            }
        },
    },
    {
        id: "2",
        index: 1,
        page: "1",
        folderName: "testimonials",
        subFolder: "simple_testimonial",
        value: {
            heading: {
              value: "Trusted by teams worldwide"
            },
            subheading: {
              value: "Discover why thousands of teams choose our platform to power their business."
            },
            testimonials: {
              value: [
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
]
