# IntelliPrep — Enterprise AI-Powered Adaptive Learning & Study Suite

> **Transform any concept, syllabus, or topic into production-grade structured study outlines, interactive HTML chapter notes, spaced repetition flashcard decks, and self-grading quizzes in seconds.**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.40.0-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Inngest](https://img.shields.io/badge/Inngest-Background%20Jobs-000212?style=for-the-badge&logo=inngest)](https://www.inngest.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-008CDD?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)

---

## 📌 Executive Summary

**IntelliPrep** is an autonomous, full-stack educational engine built for students, professionals, and educators. It combines **Google Gemini 3.5 Flash**, **Next.js 15 App Router**, **Drizzle ORM**, **Neon Serverless PostgreSQL**, and **Inngest asynchronous pipelines** to automate the creation of pedagogically sound study materials.

Users provide a target topic, syllabus, or raw notes along with a difficulty curve. IntelliPrep orchestrates background workers to generate modular chapter notes, an interactive in-context **AI Academic Tutor**, variable-speed **Text-to-Speech (TTS) narration**, **Leitner-style Spaced Repetition (SRS) flashcards**, self-grading **assessment quizzes**, and **Anki/Quizlet export packs**.

---

## 🏗️ System Architecture

IntelliPrep is architected around a tiered, decoupled paradigm ensuring sub-second client reactivity, resilient background workflows, and robust zero-trust security.

```mermaid
graph TD
    subgraph Client_Tier["Client Tier (Next.js 15 App Router / React 18)"]
        UI["Landing Page / Dashboard / Course Studio"]
        Reader["Audio TTS Reader / PDF Print Engine"]
        TutorDrawer["AI Academic Tutor Slide-Over Drawer"]
        SRS["Spaced Repetition Flashcards (Leitner 4-Tier)"]
        QuizUI["Interactive Quiz Engine & Past Attempts"]
        ShareUI["Public Share Portal (/share/[courseId])"]
        Context["CourseCountContext & LocalStorage SRS"]
    end

    subgraph Security_Tier["Edge Security & Middleware Tier"]
        MW["Next.js Middleware (clerkMiddleware)"]
        RateLimit["Sliding Window Rate Limiter (Edge In-Memory)"]
        AuthGuard["Route Matcher & Protected Route Shield"]
    end

    subgraph API_Tier["Application & API Server Tier (Node.js)"]
        AuthHelper["Server Auth Guard (getAuthenticatedUser / IDOR Shield)"]
        CourseAPI["Course Outline & Status API (/api/generate-course-outline)"]
        TutorAPI["Academic Tutor API (/api/ai/tutor)"]
        NotesAPI["Chapter Notes & DOMPurify Sanitizer (/api/courses/notes/*)"]
        QuizAPI["Quiz Attempt & Analytics API (/api/quiz/attempt)"]
        PaymentAPI["Stripe Order & Verification API (/api/payment/*)"]
        InngestAPI["Inngest Background Webhook Handler (/api/inngest)"]
    end

    subgraph Background_Tier["Background Execution Tier (Inngest Serverless)"]
        EventBus["Inngest Event Bus & Trigger Engine"]
        JobNotes["GenerateNotes Function (Stepwise Chapter Pipeline)"]
        JobContent["GenerateStudyTypeContent (Flashcards & Quizzes)"]
        RetryEngine["Automatic Rate-Limit Backoff (429 Retries)"]
    end

    subgraph External_Services["External Services & Providers"]
        Clerk["Clerk Authentication (Session Tokens & User Store)"]
        Gemini["Google Gemini Generative AI (3.5-Flash-Lite / 3.8-Flash)"]
        Stripe["Stripe Payments (Checkout & Webhook Events)"]
    end

    subgraph Storage_Tier["Database & Persistence Tier"]
        Drizzle["Drizzle ORM Engine"]
        NeonDB[("Neon Serverless PostgreSQL")]
        SQLiteFallback[("Local SQLite / LibSQL Fallback")]
        
        subgraph Tables["Relational Schema & Indexes"]
            T_Users["users (Credits, Membership)"]
            T_Material["studyMaterial (Soft-Delete, Status)"]
            T_Notes["ChapterNotes (Structured HTML)"]
            T_Content["studyTypeContent (Flashcards & Quizzes)"]
            T_Attempts["quizAttempts (Scores, Answer History)"]
        end
    end

    %% Client Interactions
    UI --> MW
    TutorDrawer --> MW
    QuizUI --> MW
    SRS --> Context
    ShareUI --> CourseAPI

    %% Middleware & Security
    MW --> RateLimit
    MW --> AuthGuard
    AuthGuard --> AuthHelper

    %% API Routing
    AuthHelper --> CourseAPI
    AuthHelper --> TutorAPI
    AuthHelper --> NotesAPI
    AuthHelper --> QuizAPI
    AuthHelper --> PaymentAPI
    InngestAPI --> EventBus

    %% External Connections
    AuthHelper -.->|Validate JWT| Clerk
    CourseAPI -.->|Generate Outline| Gemini
    TutorAPI -.->|Grounded RAG Prompt| Gemini
    PaymentAPI -.->|Checkout Session| Stripe
    Stripe -.->|Webhook Events| PaymentAPI

    %% Background Jobs
    CourseAPI -->|Trigger notes.generate| EventBus
    EventBus --> JobNotes
    EventBus --> JobContent
    JobNotes --> RetryEngine
    RetryEngine -.->|Iterative Chapter Prompts| Gemini
    JobContent -.->|Generate Cards & Quizzes| Gemini

    %% Database Operations
    CourseAPI --> Drizzle
    NotesAPI --> Drizzle
    QuizAPI --> Drizzle
    PaymentAPI --> Drizzle
    JobNotes --> Drizzle
    JobContent --> Drizzle

    Drizzle --> NeonDB
    Drizzle -.->|Fallback| SQLiteFallback
    NeonDB --- Tables
    SQLiteFallback --- Tables
```

### Architectural Data Flow:
1. **Course Ingestion**: The client submits topic parameters to `/api/generate-course-outline`.
2. **Atomic Verification**: Edge middleware enforces rate limits. The server checks user credits in an atomic database transaction (`db.transaction()`), writes an initial outline record (`Generating`), and fires an Inngest event.
3. **Stepwise Background Generation**: Inngest processes chapters iteratively, employing exponential backoff on HTTP 429 status codes. Content is stored in `ChapterNotes`, and course status shifts to `Ready`.
4. **Client Polling & Event Delivery**: The client polls `/api/courses/status` using an exponential backoff hook until 100% completion is reached.
5. **Interactive Exploration**: The user studies chapter notes, engages with the grounded AI Academic Tutor, trains using the 4-tier SRS Leitner flashcard deck, or evaluates retention via self-grading quizzes.

---

## 📸 Visual Overview & Interface Tour

Experience the complete end-to-end IntelliPrep learning journey across each core interface:

### 1. Landing Page & Platform Value Proposition
![Landing Page Hero](docs/screenshots/01-landing-hero.png)
- **Fluid Hero Architecture**: Mobile-first responsive header, animated value proposition pill, and high-impact headline with gradient accents.
- **Conversion Pathways**: Instant access to the dashboard for returning students and a one-click demo preview.
- **Visual Design**: High contrast typography, Framer Motion entrance transitions, and balanced whitespace.

---

### 2. Academic Dashboard & Course Library
![Academic Dashboard](docs/screenshots/02-dashboard-overview.png)
- **Personalized Academic Hub**: Dynamic greeting banner reflecting the authenticated user's name and learning prompts.
- **Course Library Search & Multi-Filters**: Instant client-side search across titles/topics, with multi-axis filtering by Study Type (Exam, Job Interview, Practice, Coding Prep), Generation Status (Ready, Generating, Cancelled), and Difficulty.
- **Real-Time Credit Tracking**: Sticky sidebar navigation with persistent credit balance indicators, usage progress bars, and instant upgrade triggers.

---

### 3. Course Creation Studio
![Course Creation Studio](docs/screenshots/03-course-studio.png)
- **Step-by-Step Guided Setup**: Visual category radio selection cards (Exam, Job Interview, Practice, Coding Prep, Other) with WCAG-compliant keyboard focus rings.
- **Custom Topic Prompting**: Flexible multiline input supporting topic names, full syllabi, or raw lecture notes.
- **Difficulty Calibration**: Adaptive difficulty selector (Easy, Moderate, Hard) tuning Gemini prompt parameters before generation dispatch.

---

### 4. Course Curriculum Hub
![Course Curriculum Hub](docs/screenshots/04-course-hub.png)
- **Curriculum Metadata Header**: Displays topic title, target preparation category, difficulty tier, and total chapter count with a public share trigger.
- **Quick-Access Launch Grid**: 4 dedicated action panels launching Chapter Notes, Spaced Repetition Flashcards, Assessment Quiz, and the AI Academic Tutor.
- **Structured Syllabus Tree**: Interactive chapter breakdown displaying individual chapter milestones, core conceptual tags, and progress indicators.

---

### 5. Interactive Chapter Notes & Audio Narration
![Interactive Chapter Notes](docs/screenshots/05-chapter-notes.png)
- **Semantic HTML Reader**: Typography-optimized prose container with syntax-highlighted code blocks, tables, and structured callouts.
- **Built-in TTS Narration Player**: Web Speech API audio narration with Play/Pause/Resume states and dynamic speed modulation ($1\times$, $1.25\times$, $1.5\times$).
- **Inline Editing & Print/PDF Export**: In-app edit mode with live preview tab, and print-optimized stylesheet for offline physical study or PDF export.

---

### 6. Grounded AI Academic Tutor Drawer
![AI Academic Tutor Drawer](docs/screenshots/06-ai-tutor-drawer.png)
- **Context-Grounded Dialogue**: Slide-over academic tutor powered by Google Gemini 3.5 Flash Lite, grounded strictly in the active chapter notes.
- **One-Click Prompt Chips**: Instant accelerators for real-world analogies, concrete coding examples, key takeaway bullet points, and conceptual practice quizzes.
- **Zero-Friction UX**: Non-blocking slide-out drawer with backdrop blur, keyboard shortcuts, and auto-scrolling chat history.

---

### 7. Spaced Repetition (SRS) Flashcards Studio
![Spaced Repetition Flashcards](docs/screenshots/07-srs-flashcards.png)
- **3D Card Flip Mechanics**: Interactive CSS 3D transform cards with question on the front and detailed answer explanation on the back.
- **4-Tier Leitner Confidence Grading**: Research-backed retention grading (`Again`, `Hard`, `Good`, `Easy`) updating spaced repetition schedules.
- **Deck Mastery Analytics & Anki Export**: Visual deck mastery percentage, filterable tabs (All, To Review, Mastered), and `.apkg` export for desktop and mobile Anki sync.

---

### 8. Self-Grading Assessment Quiz & Mistake Review
![Assessment Quiz](docs/screenshots/08-quiz-assessment.png)
- **Interactive Question Runner**: Step-by-step multiple-choice quiz engine with accessible radio option selectors and progress bar tracking.
- **Instant Mistake Analysis**: Visual color-coded validation highlighting correct and chosen options with detailed explanatory rationales.
- **Historical Score Logging**: Automatically persists score attempts and answer breakdowns to `quizAttempts` in Neon PostgreSQL for longitudinal progress tracking.

---

### 9. Public Study Portal & Sharing
![Public Shared Course](docs/screenshots/09-public-shared-course.png)
- **Frictionless Public Access**: Unauthenticated public route (`/share/[courseId]`) enabling students to share full curriculum notes, flashcards, and quizzes with peers.
- **Multi-Tab Preview Engine**: Switch between chapter notes, interactive flashcards, and practice quizzes without requiring a sign-in.
- **Viral Growth CTA**: Embedded "Create Your Own" and "Fork Deck" actions seamlessly onboarding new learners to the platform.

---

### 10. Academic Pricing & Credit Upgrades
![Pricing and Billing](docs/screenshots/10-billing-upgrade.png)
- **Transparent Credit Tier Matrix**: Tiered credit bundles (Basic, Pro with Most Popular pill, and Premium) with lifetime validity guarantees.
- **Stripe Checkout Integration**: PCI-compliant payment triggers initiating secure Stripe Checkout sessions with verified webhook fulfillment.
- **Security & Trust Badging**: Real-time SSL encryption indicators and Stripe guarantee assurances.

---

## 🌟 Comprehensive Features Matrix

### 1. Intelligent Course Studio
- **Dynamic Syllabus Generation**: Automatically decomposes complex topics into 4–6 cohesive chapters with detailed sub-topics and descriptive summaries.
- **Difficulty Curve Tuning**: Tailor materials between `Easy` (foundational analogies), `Moderate` (balanced theory and practical application), and `Hard` (rigorous technical edge-cases and formulas).
- **Target Category Profiles**: Specific prompt optimizations for `Exam Prep`, `Job Interview`, `Practice Drill`, `Coding Prep`, and `General Knowledge`.
- **Live Generation Streaming**: Real-time progress percentage bar with chapter-by-chapter status messaging and in-flight cancellation controls.

### 2. Interactive Study Notes & Academic Tutor
- **Semantic HTML Formatting**: Richly formatted chapter notes with clean typography, code snippets, definition lists, and key takeaways.
- **Inline Note Editor**: Native in-app edit mode with live preview tab, empowering users to add personal annotations.
- **Stored XSS Sanitization**: All content is sanitized through `DOMPurify` (`isomorphic-dompurify`) before database persistence and client rendering.
- **In-Context AI Academic Tutor**: Side-drawer tutor grounded in the current chapter's notes. Pre-configured with one-click prompts:
  - *Analogy*: Deconstructs abstract concepts using real-world intuition.
  - *Example*: Illustrates practical application.
  - *Key Points*: Summarizes core takeaways in concise bullet points.
  - *Quiz Me*: Challenges the learner with targeted conceptual questions.
- **Audio Voice Reader (TTS)**: Built-in speech synthesis engine with instant Play/Pause/Resume and dynamic playback rates ($1\times$, $1.25\times$, $1.5\times$).
- **One-Click PDF Print Engine**: Custom `@media print` styles strip away headers, sidebars, and controls to generate clean, printable revision handouts.

### 3. Spaced Repetition (SRS) Flashcards
- **Leitner Memory Framework**: 4-tier recall grading system:
  - 🔴 **Again**: Resets interval for immediate review.
  - 🟠 **Hard**: Shorter retention interval.
  - 🟢 **Good**: Standard spaced progression.
  - 🔵 **Easy**: Mastered milestone.
- **Deck Mastery Analytics**: Real-time progress bar computing overall deck mastery percentage.
- **Segmented Review Filtering**: Filter cards on demand between *All Cards*, *To Review (In Learning)*, and *Mastered*.
- **3D Card Flip Animation**: Smooth CSS 3D perspective flip with complete keyboard accessibility (`Space` / `Enter` controls).
- **Anki & Quizlet CSV Export**: Export any generated flashcard deck directly into standard two-column CSV format for external SRS mobile apps.

### 4. Interactive Assessment & Quiz Engine
- **Multiple-Choice Knowledge Checks**: Algorithmic question generation with randomized distractors and unambiguous answer keys.
- **Immediate Visual Feedback**: Instant green/red validation upon option selection.
- **Mistake Breakdown Mode**: Question-by-question review mode highlighting chosen vs. correct answers.
- **Persistent Quiz History**: Attempts are recorded in `quizAttempts` with scores, timestamps, and accuracy percentages.
- **Personal Best Tracking**: Highlights the user's best historical score on the quiz dashboard.

### 5. Social Learning & Public Study Hub
- **Zero-Auth Public Sharing**: Generate unique public links (`/share/[courseId]`) to share complete courses with peers or study groups.
- **Read-Only Unified Portal**: Recipients can access chapter notes, flip flashcards, and take quizzes without creating an account or expending credits.
- **One-Click Clipboard Integration**: Instant toast feedback when copying course links.

### 6. Dashboard Library & Management
- **Instant Search & Querying**: Real-time keyword search indexing course titles, topics, and chapter summaries.
- **Multi-Criteria Filtering**: Filter by study type, generation status (`Ready`, `Generating`, `Cancelled`), and difficulty level.
- **Compact Pagination**: Smooth page transitions displaying 6 items per page.
- **Soft Delete & 1-Click Undo**: Deleted courses are marked with `deletedAt: timestamp`. An undo toast notification permits 6-second recovery before permanent purge.

### 7. Credit Billing & Stripe Integration
- **Prepaid Credit Tier Packages**:
  - *Basic*: 10 Credits (₹99)
  - *Pro*: 25 Credits (₹199 — Most Popular)
  - *Premium*: 50 Credits (₹349 — Best Value)
- **Stripe Hosted Checkout**: Secure checkout redirection powered by Stripe Checkout.
- **Cryptographic Webhook Handlers**: Idempotent signature verification (`whsec_...`) and client verification fallback (`/api/payment/verify`).

---

## 🛡️ Enterprise Security & Hardening

| Security Layer | Implementation Mechanism | Threat Mitigated |
|---|---|---|
| **Zero-Trust Auth** | Clerk server-side `currentUser()` verification across all private endpoints | Client spoofing, forged session cookies |
| **IDOR Protection** | Strict database ownership comparison (`createdBy === user.email`) | Insecure Direct Object References |
| **Server-Side Billing** | Credits verified and deducted inside atomic database transactions | Race conditions, double-spend vulnerabilities |
| **Dual-Layer Rate Limiting** | **Layer 1**: Edge IP flood shield (100 req/min).<br>**Layer 2**: Per-user sliding-window limits on compute-heavy routes | Denial-of-Service (DoS), API abuse, scrapers |
| **Stored XSS Defense** | Strict HTML DOMPurify sanitization before saving modified notes | Malicious script execution, DOM hijacking |
| **Input Validation** | Zod schemas with length limits and type enforcement | Buffer overruns, malformed JSON injections |
| **High-Performance Indexes** | B-Tree indexes on `createdBy`, `courseId`, `email`, `deleted_at`, and `(courseId, type)` | Slow query DoS, database table scans |

---

## 💻 Tech Stack Breakdown

### Frontend Tier
- **Framework**: [Next.js 15.1.9](https://nextjs.org/) (App Router, Server & Client Components)
- **Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS 3.4.1](https://tailwindcss.com/) + [tailwindcss-animate](https://www.npmjs.com/package/tailwindcss-animate)
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (Progress, Select, Slot)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/) & [React Card Flip](https://www.npmjs.com/package/react-card-flip)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/) & [Sonner](https://sonner.emilkowal.ski/)
- **Sanitization**: [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)

### Backend & API Tier
- **Runtime**: Node.js 18+ / Edge Runtime
- **Authentication**: [@clerk/nextjs 6.12](https://clerk.com/)
- **AI Orchestration**: [@google/genai](https://www.npmjs.com/package/@google/genai) (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-3.7-flash`)
- **Background Jobs**: [Inngest 4.2](https://www.inngest.com/)
- **Payments**: [Stripe Node SDK 23](https://stripe.com/)

### Database Tier
- **Primary Database**: [Neon Serverless PostgreSQL](https://neon.tech/) (`@neondatabase/serverless`)
- **Local Fallback**: [LibSQL / SQLite](https://github.com/tursodatabase/libsql-client-ts) (`@libsql/client`)
- **ORM & Migrations**: [Drizzle ORM 0.40](https://orm.drizzle.team/) & [Drizzle Kit 0.30](https://orm.drizzle.team/kit-docs/overview)

---

## 📁 Repository Directory Structure

```text
IntelliPrep/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.jsx       # Clerk hosted Sign-In route
│   │   └── sign-up/[[...sign-up]]/page.jsx       # Clerk hosted Sign-Up route
│   ├── _context/
│   │   └── CourseCountContext.jsx                # Global credits & course count context
│   ├── _hooks/
│   │   └── useCoursePolling.js                   # Exponential-backoff course status hook
│   ├── api/
│   │   ├── ai/tutor/route.js                     # Grounded Gemini Academic Tutor API
│   │   ├── courses/
│   │   │   ├── cancel/route.js                   # Stop in-flight generation
│   │   │   ├── delete/route.js                   # Soft delete & restore endpoint
│   │   │   ├── notes/update/route.js             # Sanitized inline notes editor API
│   │   │   ├── public/route.js                   # Zero-auth public course fetcher
│   │   │   ├── status/route.js                   # Real-time progress status polling
│   │   │   └── route.js                          # Course index & listing
│   │   ├── create-user/route.js                  # User provisioning endpoint
│   │   ├── generate-course-outline/route.js      # Course creation & syllabus generator
│   │   ├── inngest/route.js                      # Inngest serverless event handler
│   │   ├── payment/
│   │   │   ├── create-order/route.js             # Stripe Checkout session creator
│   │   │   ├── verify/route.js                   # Checkout session verification
│   │   │   └── webhook/route.js                  # Cryptographic Stripe webhook listener
│   │   ├── quiz/attempt/route.js                 # Quiz scoring & attempt recorder
│   │   ├── study-type/route.js                   # Course study material fetcher
│   │   ├── study-type-content/route.js           # Flashcard & quiz generation trigger
│   │   └── user/
│   │       ├── credits/route.js                  # Credit balance retriever
│   │       └── deduct-credit/route.js            # Atomic credit decrement
│   ├── courses/
│   │   ├── [courseId]/
│   │   │   ├── _components/
│   │   │   │   ├── ChapterList.jsx               # Syllabus & topic tag list
│   │   │   │   ├── CourseIntroCard.jsx           # Overview banner & public link copy
│   │   │   │   ├── MaterialCardItem.jsx          # Flashcard/Notes/Quiz card trigger
│   │   │   │   └── StudyMaterialSection.jsx      # Materials status section
│   │   │   ├── flashcards/
│   │   │   │   ├── _components/FlashcardItem.jsx # 3D Flip Card with keyboard controls
│   │   │   │   └── page.jsx                      # Spaced Repetition Flashcard studio
│   │   │   ├── notes/
│   │   │   │   ├── _components/AiTutorDrawer.jsx # Grounded AI Academic Tutor drawer
│   │   │   │   └── page.jsx                      # Notes viewer, editor & TTS reader
│   │   │   ├── quiz/
│   │   │   │   ├── _components/QuizCardItem.jsx  # Interactive question & answer card
│   │   │   │   └── page.jsx                      # Self-grading assessment & reviews
│   │   │   ├── layout.jsx                        # Course viewport container
│   │   │   └── page.jsx                          # Course landing hub
│   │   └── layout.jsx                            # Shared course root layout
│   ├── create/
│   │   ├── _components/
│   │   │   ├── SelectOption.jsx                  # Accessible study type selector
│   │   │   └── TopicInput.jsx                    # Topic input & difficulty dropdown
│   │   └── page.jsx                              # Multi-step Course Creation Studio
│   ├── dashboard/
│   │   ├── _components/
│   │   │   ├── CourseCard.jsx                    # Interactive course card
│   │   │   ├── CourseList.jsx                    # Search, multi-filter & pagination
│   │   │   ├── DashboardHeader.jsx               # Synchronized responsive header
│   │   │   ├── Sidebar.jsx                       # Responsive navigation drawer
│   │   │   └── WelcomeBanner.jsx                 # Personalized learner hero banner
│   │   ├── upgrade/page.jsx                      # Stripe credit upgrade page
│   │   ├── layout.jsx                            # Dashboard shell & sidebar layout
│   │   └── page.jsx                              # Dashboard home
│   ├── profile/
│   │   ├── layout.jsx                            # Profile shell
│   │   └── page.jsx                              # User account details & statistics
│   ├── share/[courseId]/page.jsx                 # Zero-auth public study portal
│   ├── globals.css                               # Tailwind tokens, smooth scroll & custom scrollbars
│   ├── layout.js                                 # Root layout with ClerkProvider
│   └── page.js                                   # Public marketing landing page
├── components/ui/                                # Reusable UI component primitives
│   ├── button.jsx
│   ├── carousel.jsx
│   ├── Navbar.jsx
│   ├── progress.jsx
│   ├── select.jsx
│   ├── sonner.jsx
│   └── textarea.jsx
├── configs/
│   ├── AiModel.js                                # Gemini SDK configuration & prompt adapters
│   ├── db.js                                     # Dual-database client (Neon / SQLite)
│   └── schema.js                                 # Drizzle ORM relational schema & indexes
├── inngest/
│   ├── client.js                                 # Inngest client initializer
│   └── functions.js                              # Background workers (Notes, Flashcards, Quizzes)
├── lib/
│   ├── auth.js                                   # Server authentication & IDOR helpers
│   ├── rateLimit.js                              # Sliding-window rate limiter
│   └── utils.js                                  # Class variance & tailwind merge utilities
├── docs/
│   └── screenshots/                              # High-resolution 1920x1080 full-viewport interface captures
├── scripts/
│   ├── capture-screenshots.mjs                   # Automated Puppeteer crawler & snapshot orchestrator
│   ├── migrate-phase2.mjs                        # Production database index migration
│   └── migrate-phase3.mjs                        # Phase 3 schema extensions migration
├── middleware.js                                 # Edge security, rate limiting & Clerk guard
├── drizzle.config.js                             # Drizzle kit configuration
└── tailwind.config.mjs                           # Tailwind theme tokens & color variables
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **PostgreSQL Database**: [Neon Serverless](https://neon.tech/) (or local SQLite fallback)
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)
- **Clerk Account**: [Clerk Dashboard](https://dashboard.clerk.com/)
- **Stripe Account**: [Stripe Dashboard](https://dashboard.stripe.com/)

---

### Step-by-Step Installation

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/intelliprep.git
cd intelliprep
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# -----------------------------------------------------------------------------
# Database Configuration (Neon PostgreSQL)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_DATABASE_CONNECTION_STRING=postgresql://username:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require

# Optional Local SQLite Fallback:
# USE_LOCAL_SQLITE=1
# LOCAL_SQLITE_PATH=./dev.sqlite

# -----------------------------------------------------------------------------
# Clerk Authentication
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# -----------------------------------------------------------------------------
# Google Gemini Artificial Intelligence
# -----------------------------------------------------------------------------
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL_ID=gemini-3.5-flash-lite

# -----------------------------------------------------------------------------
# Stripe Payments
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# -----------------------------------------------------------------------------
# Inngest Background Workflows
# -----------------------------------------------------------------------------
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
INNGEST_DEV=1
```

#### 4. Run Database Schema Migrations
```bash
npm run db:push
npm run db:migrate:indexes
```

#### 5. Start Development Server
In your first terminal, start the Next.js development server:
```bash
npm run dev
```

In a second terminal, start the local Inngest Dev Server to execute background pipelines:
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Open [http://localhost:3000](http://localhost:3000) to view IntelliPrep.

---

## 📡 REST API Specifications

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|:---:|:---:|
| `POST` | `/api/generate-course-outline` | Deducts credit & initiates course syllabus generation | Yes | 10 req / min |
| `GET` | `/api/courses` | Retrieves detailed course layout by `courseId` | Yes / Public | 60 req / min |
| `POST` | `/api/courses` | Retrieves all non-deleted courses for authenticated user | Yes | 60 req / min |
| `GET` | `/api/courses/status` | Real-time progress polling (completed chapters, status) | Yes | 120 req / min |
| `POST` | `/api/courses/cancel` | Terminates an in-flight course generation job | Yes | 30 req / min |
| `DELETE`| `/api/courses/delete` | Soft deletes or permanently purges course records | Yes | 30 req / min |
| `POST` | `/api/courses/notes/update` | Updates & sanitizes chapter notes via inline editor | Yes | 30 req / min |
| `GET` | `/api/courses/public` | Fetches public course data for shared review links | No | 60 req / min |
| `POST` | `/api/ai/tutor` | Answers grounded contextual questions using Gemini | Yes | 20 req / min |
| `POST` | `/api/study-type` | Fetches notes, flashcard decks, or quizzes for a course | Yes | 60 req / min |
| `POST` | `/api/study-type-content` | Triggers background flashcard or quiz creation | Yes | 15 req / min |
| `POST` | `/api/quiz/attempt` | Records quiz attempt score, questions, and answers | Yes | 30 req / min |
| `GET` | `/api/quiz/attempt` | Retrieves user's historical quiz attempts & personal best | Yes | 60 req / min |
| `GET` | `/api/user/credits` | Returns available credit balance | Yes | 60 req / min |
| `POST` | `/api/payment/create-order` | Generates a Stripe Checkout session URL | Yes | 10 req / min |
| `POST` | `/api/payment/verify` | Validates completed Stripe session & awards credits | Yes | 10 req / min |
| `POST` | `/api/payment/webhook` | Handles asynchronous Stripe fulfillment events | Signature | Unlimited |
| `GET/POST`| `/api/inngest` | Serves Inngest background event subscriptions | Signature | Unlimited |

---

## 🚢 Production Deployment Guide

### Deploying on Vercel
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. In Project Settings, configure all environment variables specified in `.env.example`.
4. Ensure the Build Command is set to:
   ```bash
   npm run build
   ```
5. Deploy.

### Configuring Stripe Webhooks in Production
1. In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), create a new endpoint pointing to:
   ```text
   https://your-domain.com/api/payment/webhook
   ```
2. Select the event: `checkout.session.completed`.
3. Copy the Signing Secret (`whsec_...`) into your production environment variables.

### Configuring Inngest in Production
1. Create an application on [Inngest Cloud](https://app.inngest.com).
2. Set your webhook URL to:
   ```text
   https://your-domain.com/api/inngest
   ```
3. Copy the production `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to your deployment host.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute this codebase for educational and commercial purposes.