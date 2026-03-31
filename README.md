# MacroBud

Estimate your macros, skip the measuring cup. Type in what you ate and get calorie/protein/carbs/fat estimates powered by OpenAI.

## Prerequisites

- **Node.js** (v18+)
- **Python** (3.10+)

No database install needed -- the app uses SQLite which is built into Python.

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Add your OpenAI API key to `backend/.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

Start the server:

```bash
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` in your browser.
2. Type one or more foods into the input (e.g. "1 slice of rye bread, 2 eggs, a glass of milk").
3. The app sends your input to OpenAI, which splits multi-food entries and estimates macros for each item.
4. If anything is vague (e.g. "chicken breast" without a quantity), you'll get a prompt to clarify.
5. Your running totals update as you add or remove items.

## Tech Stack

| Layer    | Technology        |
| -------- | ----------------- |
| Frontend | React + Vite      |
| Backend  | Python + FastAPI   |
| Database | SQLite             |
| AI       | OpenAI gpt-4o-mini |
