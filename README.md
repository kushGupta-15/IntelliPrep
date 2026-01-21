# IntelliPrep

An AI-powered study material generator that transforms any topic into comprehensive learning resources including structured notes, interactive flashcards, and quizzes.

## Description

IntelliPrep is a Next.js application that uses artificial intelligence to create personalized study materials. Users can input any topic and difficulty level, and the system generates:

- **Structured Course Outlines**: Organized chapters with detailed summaries
- **Interactive Notes**: HTML-formatted content with proper structure
- **Flashcards**: Question-answer pairs with flip animations
- **Quizzes**: Multiple-choice questions with instant feedback

The application features user authentication via Clerk, real-time content generation status updates, and a responsive design that works across all devices.

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database (Neon recommended)
- OpenAI API key
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
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```env
   # Database
   NEXT_PUBLIC_DATABASE_CONNECTION_STRING=your_postgres_url
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   
   # AI Provider
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL_ID=gpt-4o-mini
   
   # Background Jobs
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
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

### Managing Courses

- **Dashboard**: View all your courses and their generation status
- **Profile**: Check your account information and course statistics
- **Delete Courses**: Remove unwanted courses using the trash icon
- **Navigation**: Use the header navigation to move between sections
```