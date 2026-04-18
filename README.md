# 🎓 AI Tutor Screener

A production-ready AI-powered voice-based interview system that evaluates tutor candidates on teaching ability, clarity, patience, and warmth.

## 🎯 What It Does

1. **Voice-Based Interview**: Candidates speak via microphone
2. **Dual AI Modes**:
   - **Interviewer Mode**: Asks teaching scenarios and evaluation questions
   - **Student Simulation**: AI acts like a 9-year-old with realistic student behavior
3. **Real-Time Conversation**: Streaming responses with simultaneous speech synthesis
4. **Intelligent Evaluation**: Scores teaching on 4 dimensions (Clarity, Patience, Adaptability, Warmth)
5. **Results Dashboard**: Displays structured feedback with evidence and recommendations

## 🏗️ Architecture

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Next.js API Routes + Claude 3.5 Sonnet (streaming)
- **Database**: MongoDB Atlas
- **Voice**: Web Speech API (speech-to-text) + Browser SpeechSynthesis (text-to-speech)

## 📋 API Endpoints

- `POST /api/conversation` - Stream Claude responses for interview
- `POST /api/evaluate` - Generate evaluation results
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Retrieve session data

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Anthropic API key (Claude)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials:
   # - ANTHROPIC_API_KEY (from https://console.anthropic.com)
   # - MONGODB_URI (from MongoDB Atlas)
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
app/                    # Next.js App Router
├── page.tsx            # Landing page
├── interview/          # Interview session
├── results/            # Evaluation results
└── api/                # API routes
    ├── conversation/   # AI responses
    ├── evaluate/       # Evaluation scoring
    └── sessions/       # Session management

components/            # React components
hooks/                 # Custom React hooks
lib/                   # Core utilities
├── types.ts          # TypeScript definitions
├── mongodb.ts        # DB connection
└── prompts.ts        # System prompts

models/               # Mongoose schemas
services/             # Business logic
utils/                # Helper functions
```

## 🔄 Conversation Flow

```
1. User starts interview
2. Candidate fills in info (name, email, subject)
3. Grant microphone permission
4. Interviewer asks opening questions
5. Interview alternates between Interviewer/Student modes
6. User clicks "Finish Interview"
7. System evaluates conversation
8. Results page displays scores + feedback
```

## 📊 Evaluation Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Clarity** | 30% | Using simple language, breaking down concepts, checking understanding |
| **Patience** | 25% | Wait time, validating effort, repeating without frustration |
| **Adaptability** | 25% | Adjusting explanations, using different approaches, responding to confusion |
| **Warmth** | 20% | Encouragement, emotional safety, celebrating effort |

## 🔐 Security

- API keys stored in `.env.local` (never committed)
- No keys exposed to frontend
- CORS enabled for API endpoints
- Input validation on all endpoints

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📈 Implementation Status

- [x] Step 1: Project Setup & Configuration
- [ ] Step 2: Database Models & Connection
- [ ] Step 3: Interview UI Layout
- [ ] Step 4: Voice Integration
- [ ] Step 5-6: Conversation API & Streaming
- [ ] Step 7-8: Evaluation System
- [ ] Step 9: Results Dashboard
- [ ] Step 10: Polish & Testing

---

**Built with ❤️ for educator evaluation**
