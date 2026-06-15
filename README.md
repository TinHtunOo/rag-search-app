# RAG Search App — Next.js + Supabase + Gemini

A full-stack AI-powered Retrieval-Augmented Generation (RAG) search application built with Next.js, Supabase, and Google Gemini. Upload your documents and ask questions — the app finds the most relevant content and generates accurate, context-grounded answers.

---

## Features

- Upload and process PDF, DOCX, and TXT files
- Store original files in Supabase Storage
- Generate embeddings using Gemini's embedding model
- Perform semantic vector search across document chunks
- AI-generated answers grounded in your document content
- View, preview, and manage your document library

---

## Tech Stack

### Framework

- Next.js (App Router, TypeScript)

### Database & Storage

- Supabase (PostgreSQL + pgvector + Storage)

### AI

- Google Gemini (Embeddings + Chat Completions)

### Text Processing

- LangChain RecursiveCharacterTextSplitter

### File Parsing

- pdf2json (PDF)
- mammoth (DOCX)

### Styling

- Tailwind CSS

---

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- A Google AI Studio API key (Gemini)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rag-search-app.git
cd rag-search-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Run the following SQL in the Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(768),
  file_path TEXT,
  file_url TEXT
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

Create a Storage bucket named `documents` and set it to **Public**.

### 4. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_ai_studio_api_key
```

> Never commit `.env.local` to version control.

### 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## How It Works

### 1. Ingestion

When a document is uploaded:

- Text is extracted from the file
- Split into 800-character chunks with 100-character overlap
- Embeddings are generated using Gemini
- Chunks and embeddings are stored in Supabase
- Original file is uploaded to Supabase Storage

### 2. Retrieval

When a user submits a query:

- Query is converted into an embedding
- Cosine similarity search is performed
- Most relevant document chunks are retrieved

### 3. Generation

- Retrieved chunks are sent to Gemini as context
- Gemini generates a grounded answer
- Source chunks are returned for verification

---

## Key Difference from the Original Tutorial

| Component   | OpenAI Version                | Gemini Version           |
| ----------- | ----------------------------- | ------------------------ |
| Embeddings  | text-embedding-3-small (1536) | gemini-embedding-2 (768) |
| Chat Model  | gpt-4o-mini                   | gemini-3.5-flash         |
| SDK         | openai                        | @google/generative-ai    |
| API Key     | OPENAI_API_KEY                | GEMINI_API_KEY           |
| Vector Size | 1536                          | 768                      |

> **Important:** Gemini embeddings are 768-dimensional. Your database schema and search function must use `vector(768)`.

---

## Credits

Based on:

**How to Build an AI-Powered RAG Search Application with Next.js, Supabase, and OpenAI** by Mayur Vekariya (freeCodeCamp)

Adapted to use Google Gemini instead of OpenAI.
