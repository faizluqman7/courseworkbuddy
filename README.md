# InfoFlow

**AI-Powered Coursework Decomposition Tool for University of Edinburgh Informatics Students**

Stop feeling overwhelmed by complex coursework specifications. InfoFlow uses AI to break down PDF assignments into manageable, actionable tasks.

![InfoFlow Landing Page](/Users/faizluqman/.gemini/antigravity/brain/fefa0844-e6de-4f41-b7eb-70e9b5750a87/infoflow_landing_page_1767030666495.png)

## Features

- 🧩 **Smart Decomposition** - AI breaks down complex specs into atomic, actionable tasks
- 🔗 **Context-Aware** - Each task links back to the relevant section in your PDF
- 🎓 **Academic Integrity** - Guides your thinking, never writes code for you
- 📋 **Kanban Board** - Visual task management with To Do, In Progress, Done columns
- ⏱️ **Time Estimates** - Realistic time estimates for planning your work

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Shadcn/UI-style components
- TanStack Query

### Backend
- FastAPI (Python)
- PyMuPDF for PDF parsing
- Google Gemini API (gemini-2.0-flash)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API key

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and add your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the server
uvicorn main:app --reload
```

### Running Both

1. Start the backend: `cd server && uvicorn main:app --reload`
2. Start the frontend: `npm run dev`
3. Open http://localhost:5173

## API Documentation

Once the backend is running, view the API docs at:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
courseworkbuddy/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── ui/            # Shadcn-style base components
│   │   ├── layout/        # Header, Footer
│   │   ├── upload/        # UploadZone
│   │   └── tasks/         # TaskBoard, TaskCard
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client
│   ├── types/             # TypeScript types
│   └── lib/               # Utilities
├── server/                 # Backend source
│   ├── routers/           # FastAPI routers
│   ├── services/          # PDF parser, AI decomposer
│   ├── models/            # Pydantic schemas
│   └── prompts/           # System prompts
└── dist/                   # Production build
```

## Roadmap

- [x] Phase 1: The Parser - PDF upload and task generation
- [ ] Phase 2: Interactive Manager - Auth, persistence, skeleton code parsing
- [ ] Phase 3: Context Aware - RAG integration with course materials

## License

MIT
