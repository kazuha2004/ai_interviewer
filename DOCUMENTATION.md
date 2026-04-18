# 🎓 AI Tutor Screener - Complete Documentation

## 📚 Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [How the App Works](#how-the-app-works)
6. [Frontend Components](#frontend-components)
7. [Backend API](#backend-api)
8. [Database & Data Models](#database--data-models)
9. [Data Flow](#data-flow)
10. [Running the App](#running-the-app)
11. [Key Features](#key-features)

---

## Overview

**AI Tutor Screener** is a voice-based interview system that evaluates tutor candidates on their teaching ability.

### What It Does

1. **User registers** with their name, email, and subject they tutor
2. **Microphone recording** - User speaks responses (or types if voice unavailable)
3. **Real-time transcript** - Shows what user is saying while speaking
4. **AI conversations** - Claude AI responds in two modes:
   - **Interviewer**: Asks evaluation questions
   - **Student Simulator**: Acts like a 9-year-old to test teaching skills
5. **Auto evaluation** - After interview, AI scores the tutor on 4 dimensions
6. **Results dashboard** - Shows scores, feedback, and recommendations

### Why This Matters

- Evaluates tutors consistently without human bias
- Tests real teaching skills through interactive scenarios
- Provides detailed feedback instantly
- Uses AI to simulate realistic student behavior

---

## Tech Stack

### Frontend (What Users See)
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript (type-safe code)
- **Styling**: Tailwind CSS (modern UI design)
- **Animations**: Framer Motion (smooth transitions)
- **Voice**: Web Speech API (browser microphone)

### Backend (Server Logic)
- **Framework**: Next.js API Routes (built into Next.js)
- **AI Engine**: Anthropic Claude 3.5 Sonnet (LLM)
- **Language**: TypeScript & Node.js

### Database
- **Primary**: MongoDB (when available)
- **Fallback**: In-memory Mock DB (for testing without database)

### Environment
- **Node.js**: v18+ (JavaScript runtime)
- **Package Manager**: npm
- **Runtime**: Server-side rendering on Next.js

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                         │
├─────────────────────────────────────────────────────────────┤
│  Home Page → Interview Page → Results Page                  │
│  (Form)     (Recording)      (Evaluation)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests/Streaming
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                            │
├─────────────────────────────────────────────────────────────┤
│  /api/sessions       → Create & retrieve interview sessions │
│  /api/conversation   → Stream AI responses                  │
│  /api/evaluate       → Generate evaluation scores           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
            ┌───────────┐  ┌──────────────┐
            │ MongoDB   │  │ Claude AI    │
            │ (Database)│  │ (Anthropic)  │
            └───────────┘  └──────────────┘
```

### 3-Tier Architecture

```
PRESENTATION LAYER (Frontend)
├── Home Page      → Candidate registration form
├── Interview Page → Live recording & transcript display
└── Results Page   → Evaluation scores & feedback

APPLICATION LAYER (Backend API)
├── Session Management    → Create, read, update sessions
├── Conversation Streaming → Get AI responses in real-time
├── Evaluation Generation → Score the candidate
└── Message Storage       → Save all messages to database

DATA LAYER (Database)
├── Sessions       → Interview metadata
├── Messages       → Conversation history
└── Evaluations    → Scoring results
```

---

## Directory Structure

```
ai_interviewer/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home page (registration form)
│   ├── layout.tsx                # Main layout wrapper
│   ├── interview/                # Interview feature
│   │   ├── page.tsx              # Interview page wrapper
│   │   └── interview-client.tsx  # Main interview logic
│   ├── results/                  # Results feature
│   │   ├── page.tsx              # Results page wrapper
│   │   ├── results-client.tsx    # Results display logic
│   │   └── [id]/                 # Dynamic route for session results
│   │       └── page.tsx
│   └── api/                      # Backend API endpoints
│       ├── sessions/             # Session management
│       │   ├── route.ts          # POST /api/sessions
│       │   └── [id]/
│       │       └── route.ts      # GET /api/sessions/[id]
│       ├── conversation/         # AI conversation
│       │   └── route.ts          # POST /api/conversation (streaming)
│       └── evaluate/             # Evaluation generation
│           └── route.ts          # POST /api/evaluate
│
├── components/                   # Reusable React components
│   ├── InterviewLayout.tsx       # Main interview layout container
│   ├── TranscriptPanel.tsx       # Shows conversation history
│   ├── AvatarSection.tsx         # Avatar animation
│   ├── ControlBar.tsx            # Record button & timer
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── useSpeechRecognition.ts  # Microphone input handling
│   └── useSpeechSynthesis.ts    # Speaker output handling
│
├── lib/                          # Shared utilities & config
│   ├── types.ts                  # TypeScript type definitions
│   ├── mongodb.ts                # Database connection
│   ├── mock-db.ts                # In-memory database fallback
│   └── prompts.ts                # AI system prompts
│
├── models/                       # MongoDB schemas
│   ├── session.ts                # Interview session schema
│   ├── message.ts                # Conversation message schema
│   └── evaluation.ts             # Evaluation results schema
│
├── services/                     # Business logic
│   └── claude.ts                 # Claude AI integration
│
├── utils/                        # Helper functions
│   ├── api-client.ts             # HTTP request wrapper
│   ├── helpers.ts                # Utility functions
│   └── ...
│
├── public/                       # Static files & assets
│
├── .env.local                    # Environment variables (secrets)
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── DOCUMENTATION.md              # This file!
```

---

## How the App Works (User Journey)

### Step 1: Registration (Home Page)
```
User enters:
├── Name (e.g., "John Smith")
├── Email (e.g., "john@example.com")
└── Subject (e.g., "Math", "English", "Science")

↓ Clicks "Start Interview"

Server creates a Session:
└── Stores in database with metadata
└── Returns session ID to frontend
```

### Step 2: Interview (Interview Page)
```
1. AI asks opening question (streaming in real-time)
2. User speaks response (or types if no voice)
3. Real-time transcript shown as user speaks
4. User clicks stop or presses Spacebar to submit
5. Backend stores message in database
6. AI generates next response based on conversation
7. Repeat steps 2-6 until interview ends
```

### Step 3: Evaluation (Results Page)
```
After interview:
1. Frontend sends all messages to /api/evaluate
2. Claude AI scores on 4 dimensions:
   ├── Clarity (0-10)
   ├── Patience (0-10)
   ├── Adaptability (0-10)
   └── Warmth (0-10)
3. For each score, Claude provides:
   ├── Justification text
   ├── Supporting quotes
   └── Examples from transcript
4. Results stored in database
5. Display results with charts & recommendations
```

---

## Frontend Components

### Page Components (Routes)

#### `app/page.tsx` - Home Page
**Purpose**: Registration form  
**Input**: Candidate name, email, subject  
**Output**: Creates session, navigates to interview

#### `app/interview/page.tsx` - Interview Page
**Purpose**: Main interview interface  
**Shows**: 
- Conversation transcript
- AI avatar animation
- Record button & timer
- Live transcript while recording

#### `app/results/[id]/page.tsx` - Results Page
**Purpose**: Show evaluation scores  
**Shows**:
- Scores for each dimension
- Justification text
- Supporting quotes
- Overall recommendations

### UI Components

#### `TranscriptPanel.tsx`
Shows conversation history. Updates in real-time with:
- Previous messages (user & AI)
- Live transcript while recording (blue bubble)
- Confidence percentage
- Animated recording indicator

#### `ControlBar.tsx`
Bottom control panel with:
- Microphone 🎤 button (toggles recording)
- Timer showing interview duration
- Status indicator (Recording/Processing/Ready)
- Confidence percentage during recording
- Finish Interview button

#### `AvatarSection.tsx`
Animated avatar that shows:
- Listening state (pulsing effect)
- Speaking state (mouth animation)
- Current mode (Interviewer 👔 or Student 👧)

#### `InterviewLayout.tsx`
Main layout container organizing:
- Transcript panel (left side)
- Avatar section (center)
- Control bar (bottom)

### Browser APIs Used

#### Web Speech API - Microphone Input
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.start();  // Start listening
```
- Converts speech to text in real-time
- Returns confidence percentage
- Detects when speech starts/stops

#### SpeechSynthesis API - Speaker Output
```typescript
const utterance = new SpeechSynthesisUtterance(text);
window.speechSynthesis.speak(utterance);
```
- Converts text responses to speech
- Reads AI responses aloud
- Configurable speed & voice

---

## Backend API

### Authentication & Security
- No authentication needed (optional to add)
- Input validation on all endpoints
- Error handling for missing data

### API Endpoints

#### 1. `POST /api/sessions` - Create Interview Session
**What it does**: Creates a new interview session in database

**Request**:
```json
{
  "candidateName": "John Smith",
  "candidateEmail": "john@example.com",
  "subject": "Math"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "mo1dvw49yt05vo89kkc",
    "candidateName": "John Smith",
    "subject": "Math",
    "status": "in-progress"
  }
}
```

---

#### 2. `GET /api/sessions/[id]` - Get Session Details
**What it does**: Retrieves session metadata and all messages

**URL**: `/api/sessions/mo1dvw49yt05vo89kkc`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "mo1dvw49yt05vo89kkc",
    "candidateName": "John Smith",
    "subject": "Math",
    "status": "in-progress",
    "messages": [
      {
        "role": "interviewer",
        "content": "Hello! How long have you been tutoring?",
        "timestamp": "2026-04-16T10:00:00Z"
      },
      {
        "role": "user",
        "content": "I've been tutoring for 3 years.",
        "timestamp": "2026-04-16T10:00:05Z",
        "speechConfidence": 0.92
      }
    ]
  }
}
```

---

#### 3. `POST /api/conversation` - Stream AI Response
**What it does**: Gets Claude AI's response and streams it

**Request**:
```json
{
  "userMessage": "I've been tutoring for 3 years",
  "sessionId": "mo1dvw49yt05vo89kkc",
  "mode": "interviewer"
}
```

**Response**: Streaming text chunks
```
That's great! Can you tell me more about...
your teaching approach?
```

**How it works**:
1. Server receives user message
2. Retrieves conversation history from database
3. Sends context to Claude AI with system prompt
4. Claude streams response back to frontend
5. Frontend displays response character-by-character
6. Server saves both user message and AI response to database

---

#### 4. `POST /api/evaluate` - Generate Evaluation
**What it does**: Scores the candidate based on entire conversation

**Request**:
```json
{
  "sessionId": "mo1dvw49yt05vo89kkc",
  "transcript": [/* all messages */],
  "candidateName": "John Smith",
  "subject": "Math"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clarity": {
      "score": 8,
      "justification": "Explained concepts clearly...",
      "quotes": ["I would start with..."],
      "examples": ["When asked about fractions..."]
    },
    "patience": { "score": 9, ... },
    "adaptability": { "score": 7, ... },
    "warmth": { "score": 8, ... },
    "overall": {
      "score": 8.0,
      "summary": "Strong tutor with...",
      "strengths": ["Clear communication", ...],
      "weaknesses": ["Could be more flexible", ...],
      "recommendations": ["Practice with different age groups", ...]
    }
  }
}
```

---

## Database & Data Models

### Database Types

#### MongoDB (Production)
- Real database for permanent storage
- Used when `MONGODB_URI` environment variable is set
- Recommended for deployment

#### Mock Database (Development)
- In-memory storage
- Used when `NEXT_PUBLIC_USE_MOCK_DB=true`
- Data lost when server restarts
- Great for testing without database setup

### Data Models (MongoDB Schemas)

#### Session Collection
```typescript
interface Session {
  _id: ObjectId;              // Unique ID
  candidateName: string;      // e.g., "John Smith"
  candidateEmail: string;     // e.g., "john@example.com"
  subject: string;            // e.g., "Math"
  status: string;             // "in-progress" | "completed"
  startedAt: Date;           // When interview started
  endedAt: Date;             // When interview ended
  duration: number;          // seconds
  totalMessages: number;     // Total conversation turns
  currentMode: string;       // "interviewer" | "student"
}
```

#### Message Collection
```typescript
interface Message {
  _id: ObjectId;
  sessionId: string;          // Reference to session
  role: string;               // "user" | "interviewer" | "student"
  content: string;            // Message text
  timestamp: Date;           // When message was sent
  speechConfidence: number;  // 0-1 (from speech recognition)
  metadata: {
    isFinal: boolean;         // Is final transcript (not interim)
    tokenCount: number;       // AI token usage
  }
}
```

#### Evaluation Collection
```typescript
interface Evaluation {
  _id: ObjectId;
  sessionId: string;          // Reference to session
  clarity: {
    score: number;            // 0-10
    justification: string;     // Why this score
    quotes: string[];          // Quotes from transcript
    examples: string[];        // Examples showing score
  };
  patience: { score, justification, ... };
  adaptability: { score, justification, ... };
  warmth: { score, justification, ... };
  overall: {
    score: number;             // Average of above
    summary: string;            // Overall feedback
    strengths: string[];        // What they do well
    weaknesses: string[];       // Areas to improve
    recommendations: string[];  // Action items
  };
  generatedAt: Date;
  modelUsed: string;          // e.g., "claude-3-5-sonnet"
}
```

---

## Data Flow

### Interview Recording Flow

```
User speaks
    ↓
[useSpeechRecognition Hook]
    ├─ Captures audio from microphone
    ├─ Converts speech to text
    ├─ Shows live transcript in real-time
    └─ Returns: { transcript, confidence }
    ↓
User stops recording (click or spacebar)
    ↓
[Send to Server]
POST /api/conversation
    ├─ Sends user message & session ID
    └─ Includes mode: "interviewer" or "student"
    ↓
[Server Processing]
Backend receives message
    ├─ Validates session exists
    ├─ Gets conversation history from database
    ├─ Saves user message to database
    └─ Calls Claude AI
    ↓
[Claude AI Streaming]
Claude generates response
    ├─ Considers conversation history
    ├─ Follows system prompt (Interviewer/Student mode)
    ├─ Streams text back in chunks
    └─ Server saves full response to database
    ↓
[Display Response]
Frontend receives streaming chunks
    ├─ Display text character-by-character
    ├─ Play voice synthesis (TTS)
    └─ Show as AI message in transcript
    ↓
Repeat until interview ends
```

### Evaluation Generation Flow

```
User finishes interview
    ↓
[Frontend Prepares Data]
Collects all:
    ├─ Candidate name
    ├─ Subject
    ├─ Entire message history
    └─ Session ID
    ↓
POST /api/evaluate
    ↓
[Server Processing]
Backend receives evaluation request
    ├─ Retrieves full conversation from database
    ├─ Formats transcript for Claude
    └─ Calls Claude with evaluation prompt
    ↓
[Claude AI Evaluation]
Claude analyzes entire conversation:
    ├─ Reads all messages
    ├─ Scores on 4 dimensions (0-10)
    ├─ Pulls supporting quotes
    ├─ Provides justification
    ├─ Identifies strengths/weaknesses
    ├─ Generates recommendations
    └─ Returns structured evaluation
    ↓
[Save & Display]
Server saves evaluation to database
    ↓
Frontend displays:
    ├─ Score cards (bars/numbers)
    ├─ Justification text
    ├─ Quote callouts
    └─ Recommendations
```

---

## Running the App

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Port 3000 available

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd ai_interviewer
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local` file:
```
# Anthropic API Key (from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# MongoDB connection string (optional, uses mock DB if not set)
MONGODB_URI=mongodb+srv://...

# Use mock in-memory database (no real database needed)
NEXT_PUBLIC_USE_MOCK_DB=true

# API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Other options
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_MAX_INTERVIEW_DURATION_MINUTES=15
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:3000`

### Build for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

---

## Key Features

### 1. Real-Time Transcript Display
- **What**: Shows text as user is speaking
- **How**: Web Speech API captures audio, displays transcript in real-time
- **Why**: Immediate feedback helps user verify they're being heard

### 2. Dual Interview Modes
- **Interviewer Mode**:
  - Asks teaching philosophy questions
  - Evaluates approach and reasoning
  - Professional scenario-based questions
- **Student Mode**:
  - Acts like a 9-year-old student
  - Tests patience and adaptability
  - Realistic teaching challenges

### 3. Streaming AI Responses
- **What**: AI responses appear word-by-word (not all at once)
- **How**: Claude API streams response chunks
- **Why**: Feels more natural, less static, faster perceived response time

### 4. Confidence Scoring
- **What**: Shows confidence % while user is speaking
- **How**: Web Speech API returns confidence 0-1
- **Why**: Indicates speech recognition quality

### 5. Automatic Evaluation
- **What**: After interview, AI generates structured feedback
- **Dimensions Scored**:
  - Clarity: Communication style
  - Patience: Ability to work with struggling students
  - Adaptability: Flexibility in teaching approach
  - Warmth: Empathy and encouragement
- **Output**: Scores, justifications, quotes, recommendations

### 6. Voice & Text Support
- **Voice**: Uses microphone when available (Chrome, Safari, Edge)
- **Text**: Fallback input form when voice isn't supported
- **TTS**: AI responses read aloud automatically

### 7. Session Management
- **Sessions**: Each interview is a separate session
- **History**: All messages saved in database
- **Resume**: Can view past interview sessions
- **Privacy**: Candidate email stored for records

### 8. Interview Analytics
- **Duration**: How long interview took
- **Message Count**: Number of conversation turns
- **Confidence Tracking**: Average speech recognition confidence
- **Completion Status**: Did user finish interview?

---

## Configuration Options

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude AI API key | `sk-ant-...` |
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `NEXT_PUBLIC_USE_MOCK_DB` | Use mock DB instead | `true` |
| `NODE_ENV` | Development/Production | `development` |
| `NEXT_PUBLIC_API_BASE_URL` | API endpoint | `http://localhost:3000` |

### Customization

**Interview Duration**
```env
NEXT_PUBLIC_MAX_INTERVIEW_DURATION_MINUTES=15
```

**Debug Mode**
```env
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

**Speech Recognition Language**
Edit `interview-client.tsx`:
```typescript
const speechRecognition = useSpeechRecognition({
  language: 'en-US',  // Change this
  ...
});
```

---

## Common Tasks

### Add a New Question to Interviewer
Edit `lib/prompts.ts`:
```typescript
const interviewerSystemPrompt = `
  ... existing prompt ...
  
  Also ask about:
  - [Your new question here]
`;
```

### Change Evaluation Dimensions
Edit `lib/types.ts`:
```typescript
interface Evaluation {
  clarity: DimensionScore;
  patience: DimensionScore;
  adaptability: DimensionScore;
  warmth: DimensionScore;
  // Add new dimension here
  engagement: DimensionScore;
}
```

### Modify UI Colors
Edit component files with Tailwind classes:
```tsx
// Change button color
<button className="bg-blue-600 hover:bg-blue-700">
  // Change this to: bg-purple-600 hover:bg-purple-700
</button>
```

### Use Real Database
1. Get MongoDB connection string from MongoDB Atlas
2. Set `MONGODB_URI` in `.env.local`
3. Set `NEXT_PUBLIC_USE_MOCK_DB=false`
4. Restart server

---

## Troubleshooting

### "Speech recognition not supported"
**Problem**: User's browser doesn't support Web Speech API  
**Solution**: 
- Use Chrome, Safari, or Edge
- Or use text input fallback

### "Session not found"
**Problem**: User directly accessed interview URL without creating session first  
**Solution**: Start from home page to create session

### "Claude API not configured"
**Problem**: `ANTHROPIC_API_KEY` not set  
**Solution**: Add API key to `.env.local`

### "Database connection failed"
**Problem**: MongoDB connection string invalid  
**Solution**: 
- Check `MONGODB_URI` in `.env.local`
- Or set `NEXT_PUBLIC_USE_MOCK_DB=true` to use mock DB

---

## Project Structure Summary

```
Frontend (What Users See)
├── Pages: Home, Interview, Results
├── Components: Transcript, Avatar, Controls
└── Hooks: useSpeechRecognition, useSpeechSynthesis

Backend (Server Logic)
├── API Routes: /sessions, /conversation, /evaluate
├── Services: Claude AI integration
└── Models: Database schemas (Session, Message, Evaluation)

Database
├── MongoDB (Production)
└── Mock DB (Development)
```

---

## Next Steps to Learn More

1. **Understand Dialog Flow**: Look at `interview-client.tsx`
2. **Study AI Integration**: Check `services/claude.ts`
3. **Design Changes**: Modify components in `components/`
4. **Add Features**: Create new API endpoints in `app/api/`
5. **Database Schema**: Customize models in `models/`

---

## Support & Debugging

### Enable Debug Mode
```env
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

### Check Browser Console
Press `F12` to see:
- Real-time transcript updates
- API request/response logs
- Speech recognition events
- JavaScript errors

### Check Server Logs
Terminal shows:
- API endpoint hits
- Database operations
- Claude API calls
- Error messages

---

**Happy coding! 🚀**
