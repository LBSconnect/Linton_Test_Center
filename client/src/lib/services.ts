import {
  Monitor,
  Stamp,
  Camera,
  Award,
  GraduationCap,
  Users,
} from "lucide-react";

export interface ServiceInfo {
  id: string;
  slug: string;
  link?: string; // optional override for the card CTA link
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  features: string[];
  image: string;
  price: string;
  priceLabel: string;
  icon: typeof Monitor;
  stripeProductName: string;
}

export const services: ServiceInfo[] = [
  {
    id: "group-classes",
    slug: "group-classes",
    link: "/calendar",
    title: "Group Study Sessions",
    shortTitle: "Group Sessions",
    description:
      "Weekly Friday & Saturday group study sessions for Texas Life Insurance and Property & Casualty licensing exams. $75/session.",
    longDescription:
      "Join our instructor-led group study sessions held every Friday and Saturday. We offer two focused 2-hour sessions per day — one for Texas Life Insurance and one for Texas Property & Casualty licensing exam prep. All sessions are held onsite. Payment is required at registration.",
    features: [
      "Texas Life Insurance exam prep",
      "Texas Property & Casualty exam prep",
      "Every Friday & Saturday",
      "Small group sessions (max 20)",
      "Experienced instructors",
      "Onsite at LBS Test & Exam Center",
    ],
    image: "/images/service-group-sessions.png",
    price: "$75",
    priceLabel: "/session",
    icon: Users,
    stripeProductName: "Group Study Sessions",
  },
  {
    id: "certification",
    slug: "certification-exam-testing",
    title: "Certiport Exam Testing",
    shortTitle: "Certifications",
    description:
      "Professional exam testing environment for IT certifications including Pearson VUE, Certiport, and PMI exams.",
    longDescription:
      "Our authorized testing center provides a professional environment for certification exams. We support Pearson VUE, Certiport, and PMI exam programs, among others. Our facility meets all testing program requirements to ensure your exam experience is seamless.",
    features: [
      "Pearson VUE authorized center",
      "Certiport testing available",
      "PMI exam programs",
      "Secure testing environment",
      "Individual testing stations",
      "Flexible scheduling options",
    ],
    image: "/images/service-certification.png",
    price: "$35",
    priceLabel: "/session",
    icon: Award,
    stripeProductName: "Certiport Exam Testing",
  },
  {
    id: "tutoring",
    slug: "tutoring",
    title: "Tutoring",
    shortTitle: "Tutoring",
    description:
      "One-on-one academic and professional tutoring sessions. Sessions run 2–6 hours at $40/hr. Payment required at booking.",
    longDescription:
      "Our experienced tutors provide personalized one-on-one instruction tailored to your goals. Whether you need help with academic subjects, test preparation, or professional skill development, we offer focused sessions in a quiet, professional environment. Sessions are available in 2–6 hour blocks.",
    features: [
      "One-on-one personalized instruction",
      "Academic & professional subjects",
      "Test prep & exam readiness",
      "Quiet, distraction-free environment",
      "Flexible session lengths (2–6 hrs)",
      "Experienced, qualified tutors",
    ],
    image: "/images/service-workstation.png",
    price: "$40",
    priceLabel: "/hr · 2 hr min",
    icon: GraduationCap,
    stripeProductName: "Tutoring",
  },
  {
    id: "workstation",
    slug: "computer-workstation-rental",
    title: "Computer Workstation Rental",
    shortTitle: "Workstation",
    description:
      "Fully equipped computer workstation with high-speed internet access. Per hour rate.",
    longDescription:
      "Need a professional computer workstation? Our fully equipped stations feature high-speed internet, comfortable ergonomic seating, and all the software you need. Whether you're working on a project, completing online coursework, or need a temporary workspace, we have you covered.",
    features: [
      "High-speed internet access",
      "Dual monitor setup available",
      "Comfortable ergonomic chair",
      "Private workspace environment",
      "Printing and scanning access",
      "Technical support available",
    ],
    image: "/images/service-workstation.png",
    price: "$20",
    priceLabel: "/hour",
    icon: Monitor,
    stripeProductName: "Computer Workstation Rental",
  },
  {
    id: "notary",
    slug: "notary-service",
    title: "Notary Service",
    shortTitle: "Notary",
    description:
      "Certified notary public services for documents, affidavits, and legal papers. Per document rate.",
    longDescription:
      "Our certified notary public is available to help you with all your notarization needs. From legal documents and affidavits to powers of attorney and real estate documents, we provide fast and professional notary services.",
    features: [
      "Certified Notary Public",
      "Legal documents & affidavits",
      "Powers of Attorney",
      "Real estate documents",
      "Same-day service available",
      "Walk-ins welcome",
    ],
    image: "/images/service-notary.png",
    price: "$10",
    priceLabel: "/document",
    icon: Stamp,
    stripeProductName: "Notary Service",
  },
  {
    id: "passport",
    slug: "passport-photos",
    title: "Passport Photos",
    shortTitle: "Passport Photos",
    description:
      "Professional passport and visa photos meeting all government standards. Includes 2 printed photos.",
    longDescription:
      "Get professional passport and visa photos that meet all U.S. Department of State and international government standards. Our photos are taken with professional equipment and lighting to ensure they are accepted on the first submission.",
    features: [
      "Meets U.S. State Department standards",
      "International visa photo formats",
      "Professional lighting & equipment",
      "Includes 2 printed photos",
      "Digital copy available",
      "No appointment needed",
    ],
    image: "/images/service-passport.png",
    price: "$25",
    priceLabel: "/set",
    icon: Camera,
    stripeProductName: "Passport Photos",
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
