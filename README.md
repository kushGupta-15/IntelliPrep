# IntelliPrep

An AI-powered study material generator that transforms any topic into comprehensive learning resources including structured notes, interactive flashcards, and quizzes.

## Description

IntelliPrep is a Next.js application that uses artificial intelligence to create personalized study materials. Users can input any topic and difficulty level, and the system generates:

- **Structured Course Outlines**: Organized chapters with detailed summaries
- **Interactive Notes**: HTML-formatted content with proper structure
- **Flashcards**: Question-answer pairs with flip animations
- **Quizzes**: Multiple-choice questions with instant feedback
- **Credit Upgrade via Stripe**: Secure payment processing with Stripe for course credits

The application features user authentication via Clerk, real-time content generation status updates, and a responsive design that works across all devices.

## Security & Architecture

- **Server-Side Session Authentication**: All API endpoints authenticate requests server-side via Clerk (`auth()` / `currentUser()`). User identity is never trusted from client request bodies.
- **IDOR Protection**: Strict ownership validation on all course resources—users can only view, generate content for, cancel, or delete their own study materials.
- **Atomic Server-Side Credit Billing**: Credit checks and deductions occur atomically on the server before invoking AI generation, eliminating client-side credit bypasses.
- **Stored XSS Prevention**: AI-generated HTML notes are sanitized with `DOMPurify` (`isomorphic-dompurify`) before rendering to safeguard against script injection.
- **Input Validation & Prompt Injection Guardrails**: Request payloads are strictly validated using Zod schemas with length limits and field constraints.

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database (Neon recommended, or local SQLite fallback)
- Google Gemini API key
- Stripe account (Secret key, Publishable key, Webhook secret)
- Clerk account for authentication

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intelliprep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Configure `.env` using `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Required environment variables:
   ```env
   # Database (PostgreSQL - Neon)
   NEXT_PUBLIC_DATABASE_CONNECTION_STRING=your_postgres_url
   # Or use local SQLite:
   # USE_LOCAL_SQLITE=1
   # LOCAL_SQLITE_PATH=./dev.sqlite
   
   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   
   # Google Gemini AI Provider
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL_ID=gemini-3.5-flash-lite

   # Stripe Payments
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Background Jobs
   INNGEST_DEV=1
   INNGEST_EVENT_KEY=local
   INNGEST_SIGNING_KEY=local
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Course

1. **Sign Up/Login**: Create an account or sign in using Clerk authentication
2. **Navigate to Create**: Click "Create New" from the dashboard
3. **Select Study Type**: Choose from options like Exam, Job Interview, Practice, etc.
4. **Enter Topic Details**: 
   - Input your topic (e.g., "JavaScript Fundamentals")
   - Select difficulty level (Easy, Medium, Hard)
5. **Generate Course**: Click "Generate" to create your study materials

### Accessing Study Materials

Once your course is generated:

- **Notes**: Automatically available - click "View" to read structured chapter content
- **Flashcards**: Click "Generate" then "View" to access interactive flashcards
- **Quiz**: Click "Generate" then "View" to take multiple-choice quizzes

### Upgrading Credits

- Navigate to `/dashboard/upgrade`
- Select a plan (Basic, Pro, or Premium)
- Pay securely through Stripe Checkout
- Credits are immediately added to your balance