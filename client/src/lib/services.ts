import {
  Stamp,
  Camera,
  Award,
  Users,
  BookOpen,
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
  icon: typeof Stamp;
  stripeProductName: string;
  saturdayOnly?: boolean;
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
    price: "",
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
  {
    id: "life-insurance-bootcamp",
    slug: "life-insurance-boot-camp",
    title: "Texas Life Insurance Exam Boot Camp",
    shortTitle: "Life Insurance Boot Camp",
    description:
      "Saturday morning Boot Camp for the Texas Life Insurance license exam. 8:00 AM – 10:00 AM.",
    longDescription:
      "Prepare for your Texas Life Insurance license exam with our intensive Saturday morning Boot Camp. Our expert instructors guide you through the key concepts, practice questions, and test-taking strategies you need to pass on your first attempt. Sessions run 8:00 AM – 10:00 AM every Saturday.",
    features: [
      "Expert-led instruction",
      "Texas Life Insurance exam focus",
      "Practice questions & test strategies",
      "Saturday mornings 8:00 AM – 10:00 AM",
      "Small class sizes",
      "Study materials provided",
    ],
    image: "/images/service-certification.png",
    price: "$99",
    priceLabel: "/session",
    icon: BookOpen,
    stripeProductName: "Texas Life Insurance Exam Boot Camp",
    saturdayOnly: true,
  },
  {
    id: "property-casualty-bootcamp",
    slug: "property-casualty-boot-camp",
    title: "Texas Property & Casualty Exam Boot Camp",
    shortTitle: "P&C Boot Camp",
    description:
      "Saturday morning Boot Camp for the Texas Property & Casualty insurance license exam. 10:30 AM – 12:30 PM.",
    longDescription:
      "Prepare for your Texas Property & Casualty insurance license exam with our intensive Saturday morning Boot Camp. Our expert instructors cover all exam topics, provide practice questions, and share proven test-taking strategies to help you pass with confidence. Sessions run 10:30 AM – 12:30 PM every Saturday.",
    features: [
      "Expert-led instruction",
      "Texas P&C insurance exam focus",
      "Practice questions & test strategies",
      "Saturday mornings 10:30 AM – 12:30 PM",
      "Small class sizes",
      "Study materials provided",
    ],
    image: "/images/service-certification.png",
    price: "$99",
    priceLabel: "/session",
    icon: BookOpen,
    stripeProductName: "Texas Property & Casualty Exam Boot Camp",
    saturdayOnly: true,
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
