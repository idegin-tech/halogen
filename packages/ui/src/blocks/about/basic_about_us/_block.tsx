import Image from "next/image";
import { BlockProperties } from "@halogen/common/types";

// Values array with icon components
const defaultValues = [
  {
    title: "Excellence",
    description:
      "We strive for excellence in everything we do, delivering exceptional results that exceed expectations.",
    icon: (
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
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: "Integrity",
    description: "We uphold the highest standards of integrity, building trust through honesty and transparency.",
    icon: (
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Innovation",
    description:
      "We embrace innovation, constantly seeking new ideas and approaches to solve complex business challenges.",
    icon: (
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
        <path d="M12 2v8" />
        <path d="m4.93 10.93 1.41 1.41" />
        <path d="M2 18h2" />
        <path d="M20 18h2" />
        <path d="m19.07 10.93-1.41 1.41" />
        <path d="M22 22H2" />
        <path d="m16 6-4 4-4-4" />
        <path d="M16 18a4 4 0 0 0 0-8H8a4 4 0 0 0 0 8" />
      </svg>
    ),
  },
  {
    title: "Collaboration",
    description: "We believe in the power of collaboration, working closely with clients to achieve shared goals.",
    icon: (
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function BasicAboutUs(props: {
  sectionId?: string;
  badgeText?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  subtitle?: string;
  missionTitle?: string;
  missionDescription?: string;
  valuesTitle?: string;
  teamImageSrc?: string;
  teamImageAlt?: string;
  statTitle?: string;
  statValue?: string;
  backgroundColor?: string;
  values?: Array<{
    title: string;
    description: string;
  }>;
}) {
  // Merge default values with props values, keeping the default icons
  const values = props.values?.map((value, index) => {
    return {
      ...value,
      icon: defaultValues[index]?.icon || defaultValues[0]?.icon
    };
  }) || defaultValues;

  return (
    <section 
      className="relative py-20 overflow-hidden bg-background" 
      id={props.sectionId || "about"}
      style={props.backgroundColor ? { backgroundColor: props.backgroundColor } : {}}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/10 rounded-full blur-3xl translate-y-1/2"></div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur mb-4">
            <span className="mr-2 h-2 w-2 rounded-full bg-primary"></span>
            {props.badgeText || "Our Story"}
          </div>
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
            {props.titlePrefix || "About"}{" "}
            <span className="text-primary">{props.titleHighlight || "Consulta"}</span>
            {props.titleSuffix}
          </h2>
          <p className="mt-4 max-w-[700px] text-muted-foreground">
            {props.subtitle || "We're a team of experienced consultants dedicated to helping businesses thrive in today's competitive landscape."}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative z-10 overflow-hidden rounded-2xl border border-border/40 bg-background/50 p-2 shadow-xl backdrop-blur">
              <Image
                src={props.teamImageSrc || "/placeholder.svg?height=600&width=600"}
                width={600}
                height={600}
                alt={props.teamImageAlt || "Our team"}
                className="rounded-xl object-cover w-full aspect-[4/3]"
              />
            </div>
            <div className="absolute -top-6 -right-6 z-0 h-24 w-24 rounded-lg bg-primary/10 blur-md"></div>
            <div className="absolute -bottom-8 -left-8 z-0 h-32 w-32 rounded-full bg-secondary/20 blur-md"></div>

            {/* Stats card */}
            <div className="absolute -bottom-6 right-6 z-20 rounded-lg border border-border/40 bg-background/80 p-4 shadow-lg backdrop-blur">
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{props.statTitle || "Team Size"}</p>
                  <p className="text-2xl font-bold text-primary">{props.statValue || "50+"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h3 className="text-2xl font-bold mb-4">{props.missionTitle || "Our Mission"}</h3>
            <p className="text-muted-foreground mb-6">
              {props.missionDescription || "At Consulta, our mission is to empower businesses to reach their full potential through strategic guidance, innovative solutions, and actionable insights. We believe that every business, regardless of size or industry, deserves access to world-class consulting services."}
            </p>

            <h3 className="text-2xl font-bold mb-4 mt-8">{props.valuesTitle || "Our Values"}</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {values.map((value, index) => (
                <div key={index} className="rounded-xl border border-border/40 bg-background/50 p-4 backdrop-blur">
                  <div className="rounded-full bg-primary/10 p-2 w-fit mb-4">{value.icon}</div>
                  <h4 className="text-lg font-medium mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Block properties for the page builder
export const blockProperties: BlockProperties = {
  name: "Basic About Us",
  description: "A basic about us section with mission, values, and team image",
  fields: {
    sectionId: {
      type: "text",
      name: "sectionId",
      label: "Section ID",
      description: "HTML ID attribute for the section (used for navigation)",
      defaultValue: "about"
    },
    badgeText: {
      type: "text",
      name: "badgeText",
      label: "Badge Text",
      description: "Small badge text displayed above the title",
      defaultValue: "Our Story"
    },
    titlePrefix: {
      type: "text",
      name: "titlePrefix",
      label: "Title Prefix",
      description: "First part of the title",
      defaultValue: "About"
    },
    titleHighlight: {
      type: "text",
      name: "titleHighlight",
      label: "Title Highlight",
      description: "Highlighted part of the title (colored)",
      defaultValue: "Consulta"
    },
    titleSuffix: {
      type: "text",
      name: "titleSuffix",
      label: "Title Suffix",
      description: "Last part of the title (optional)",
      defaultValue: ""
    },
    subtitle: {
      type: "textarea",
      name: "subtitle",
      label: "Subtitle",
      description: "Subtitle displayed below the main title",
      defaultValue: "We're a team of experienced consultants dedicated to helping businesses thrive in today's competitive landscape."
    },
    backgroundColor: {
      type: "color",
      name: "backgroundColor",
      label: "Background Color",
      description: "Background color of the section",
      defaultValue: ""
    },
    teamImageSrc: {
      type: "text",
      name: "teamImageSrc",
      label: "Team Image Source",
      description: "URL for the team image",
      defaultValue: "/placeholder.svg?height=600&width=600"
    },
    teamImageAlt: {
      type: "text",
      name: "teamImageAlt",
      label: "Team Image Alt",
      description: "Alt text for the team image",
      defaultValue: "Our team"
    },
    missionTitle: {
      type: "text",
      name: "missionTitle",
      label: "Mission Title",
      description: "Title for the mission section",
      defaultValue: "Our Mission"
    },
    missionDescription: {
      type: "textarea",
      name: "missionDescription",
      label: "Mission Description",
      description: "Description for the mission section",
      defaultValue: "At Consulta, our mission is to empower businesses to reach their full potential through strategic guidance, innovative solutions, and actionable insights. We believe that every business, regardless of size or industry, deserves access to world-class consulting services."
    },
    valuesTitle: {
      type: "text",
      name: "valuesTitle",
      label: "Values Title",
      description: "Title for the values section",
      defaultValue: "Our Values"
    },
    statTitle: {
      type: "text",
      name: "statTitle",
      label: "Stat Title",
      description: "Title for the statistics badge",
      defaultValue: "Team Size"
    },
    statValue: {
      type: "text",
      name: "statValue",
      label: "Stat Value",
      description: "Value for the statistics badge",
      defaultValue: "50+"
    },
    values: {
      type: "list",
      name: "values",
      label: "Values",
      description: "List of company values",
      value: {
        items: {
          title: {
            type: "text",
            label: "Title",
            description: "Value title",
            name: "title"
          },
          description: {
            type: "textarea",
            label: "Description",
            description: "Value description",
            name: "description"
          }
        }
      },
      defaultValue: [
        {
          title: "Excellence",
          description: "We strive for excellence in everything we do, delivering exceptional results that exceed expectations."
        },
        {
          title: "Integrity",
          description: "We uphold the highest standards of integrity, building trust through honesty and transparency."
        },
        {
          title: "Innovation",
          description: "We embrace innovation, constantly seeking new ideas and approaches to solve complex business challenges."
        },
        {
          title: "Collaboration",
          description: "We believe in the power of collaboration, working closely with clients to achieve shared goals."
        }
      ]
    }
  }
};