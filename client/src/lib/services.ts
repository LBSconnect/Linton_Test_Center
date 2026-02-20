import {
  Monitor,
  Stamp,
  Camera,
  Video,
  Award,
} from "lucide-react";

export interface ServiceInfo {
  id: string;
  slug: string;
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
    price: "$15",
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
    price: "$15",
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
    price: "$15",
    priceLabel: "/set",
    icon: Camera,
    stripeProductName: "Passport Photos",
  },
  {
    id: "proctoring",
    slug: "remote-proctoring",
    title: "Remote Proctoring Services",
    shortTitle: "Proctoring",
    description:
      "Private proctoring room with camera, headset, and microphone for remote exams. Per hour rate.",
    longDescription:
      "Take your remote proctored exams in our professional, distraction-free environment. Each private proctoring room is equipped with a high-definition camera, professional headset, and microphone, ensuring you meet all testing requirements for your remote exam.",
    features: [
      "Private, quiet testing room",
      "HD camera & professional headset",
      "High-speed stable internet",
      "Soundproofed environment",
      "Compatible with all proctoring platforms",
      "Technical support on standby",
    ],
    image: "/images/service-proctoring.png",
    price: "$35",
    priceLabel: "/hour",
    icon: Video,
    stripeProductName: "Remote Proctoring Services",
  },
  {
    id: "certification",
    slug: "certification-exam-testing",
    title: "Certification Exam Testing",
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
    price: "Contact",
    priceLabel: "for pricing",
    icon: Award,
    stripeProductName: "Certification Exam Testing",
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
