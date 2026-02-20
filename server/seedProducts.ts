import { getUncachableStripeClient } from './stripeClient';

export async function seedStripeProducts() {
  const stripe = await getUncachableStripeClient();

  const productsToCreate = [
    {
      name: 'Computer Workstation Rental',
      description: 'Fully equipped computer workstation with high-speed internet access. Per hour rate.',
      metadata: { category: 'workstation', slug: 'computer-workstation-rental' },
      priceAmount: 1500,
    },
    {
      name: 'Notary Service',
      description: 'Certified notary public services for documents, affidavits, and legal papers. Per document rate.',
      metadata: { category: 'notary', slug: 'notary-service' },
      priceAmount: 1500,
    },
    {
      name: 'Passport Photos',
      description: 'Professional passport and visa photos meeting all government standards. Includes 2 printed photos.',
      metadata: { category: 'passport', slug: 'passport-photos' },
      priceAmount: 1500,
    },
    {
      name: 'Remote Proctoring Services',
      description: 'Private proctoring room with camera, headset, and microphone for remote exams. Per hour rate.',
      metadata: { category: 'proctoring', slug: 'remote-proctoring' },
      priceAmount: 3500,
    },
    {
      name: 'Certification Exam Testing',
      description: 'Professional exam testing environment for IT certifications including Pearson VUE, Certiport, and PMI exams.',
      metadata: { category: 'certification', slug: 'certification-exam-testing' },
      priceAmount: 5000,
    },
  ];

  for (const productData of productsToCreate) {
    try {
      const existingProducts = await stripe.products.search({
        query: `name:'${productData.name}'`,
      });

      if (existingProducts.data.length > 0) {
        console.log(`Product "${productData.name}" already exists, skipping.`);
        continue;
      }

      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
      });

      await stripe.prices.create({
        product: product.id,
        unit_amount: productData.priceAmount,
        currency: 'usd',
      });

      console.log(`Created product: ${productData.name} ($${(productData.priceAmount / 100).toFixed(2)})`);
    } catch (error: any) {
      console.error(`Error creating product "${productData.name}":`, error.message);
    }
  }
}
