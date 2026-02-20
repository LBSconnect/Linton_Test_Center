# LBS4 - Test & Exam Center Website

## Overview
LBS4 is the Test and Exam Center division of Linton Business Solutions LLC (LVBS). This website allows customers to view and purchase services online through Stripe integration.

## Business Information
- **Business Name:** LBS4 - Test & Exam Center (Linton Business Solutions LLC)
- **Address:** 616 FM 1960 Road West, Suite 575, Houston, TX 77090
- **Phone:** (281) 836-5357
- **Email:** info@lbsconnect.net
- **Domain:** www.lbs4.com

## Services
1. Computer Workstation Rental - $15/hour
2. Notary Service - $15/document
3. Passport Photos - $15/set (includes 2 photos)
4. Remote Proctoring Services - $35/hour
5. Certification Exam Testing - $50 (Pearson VUE, Certiport, PMI)

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js
- **Database:** PostgreSQL (Neon-backed)
- **Payments:** Stripe (via stripe-replit-sync)
- **Routing:** wouter

## Project Structure
- `client/src/pages/` - Page components (Home, Services, ServiceDetail, About, Contact, Checkout)
- `client/src/components/` - Reusable components (Header, Footer, ServiceCard)
- `client/src/lib/services.ts` - Service data definitions
- `server/index.ts` - Express server with Stripe initialization
- `server/routes.ts` - API routes
- `server/storage.ts` - Database queries (reads from stripe schema)
- `server/stripeClient.ts` - Stripe client setup via Replit connector
- `server/webhookHandlers.ts` - Stripe webhook processing
- `server/seedProducts.ts` - Seeds Stripe products on startup

## Brand Colors
- Navy Blue: #1e3a6e (primary navigation, headers)
- Coral/Salmon: #e85d40 to #f07050 (CTAs, accents)
- Logo: Hummingbird with coral wings and blue body

## Stripe Integration
- Products are created via Stripe API (seedProducts.ts)
- Product data is synced to PostgreSQL stripe schema
- Checkout uses Stripe Checkout Sessions
- Webhook endpoint: /api/stripe/webhook

## Recent Changes
- Initial build: Full site with 5 services, Stripe checkout, contact form
