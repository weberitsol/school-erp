# Document Intelligence Pipeline - Technical Architecture

**Version:** 1.0
**Date:** 2025-12-16
**Architects:** Winston (System Architect) + Amelia (Developer)
**Purpose:** AI-powered document parsing for automated test/assignment generation

---

## 1. Executive Overview

### 1.1 Goal
Transform any PDF/Word document into structured question banks that teachers can use to instantly create tests and assignments.

### 1.2 Key Capabilities
- **Extract** text, tables, images from PDF/Word/Images
- **Identify** questions, answers, and educational content
- **Classify** by subject, chapter, topic, difficulty
- **Generate** new questions from content using AI
- **Support** 20+ languages including RTL scripts

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT INTELLIGENCE PIPELINE                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐   │
│  │   UPLOAD    │    │              PROCESSING ENGINE                   │   │
│  │   SERVICE   │───>│                                                  │   │
│  │             │    │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │
│  │ - Web UI    │    │  │ Extract │─>│ Analyze │─>│ Question        │  │   │
│  │ - Mobile    │    │  │ Stage   │  │ Stage   │  │ Detection/Gen   │  │   │
│  │ - API       │    │  └─────────┘  └─────────┘  └─────────────────┘  │   │
│  └─────────────┘    │       │            │               │            │   │
│                     │       ▼            ▼               ▼            │   │
│                     │  ┌─────────────────────────────────────────┐    │   │
│                     │  │           AI/ML LAYER                   │    │   │
│                     │  │  - LLM (GPT-4/Claude)                   │    │   │
│                     │  │  - Vision Models (OCR)                  │    │   │
│                     │  │  - NLP (spaCy, transformers)            │    │   │
│                     │  └─────────────────────────────────────────┘    │   │
│                     └─────────────────────────────────────────────────┘   │
│                                        │                                   │
│                                        ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        OUTPUT & STORAGE                               │ │
│  │                                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │ │
│  │  │ Question    │  │  Parsed     │  │ Search      │  │ Review     │  │ │
│  │  │ Bank        │  │  Content    │  │ Index       │  │ Queue      │  │ │
│  │  │ (MongoDB)   │  │  (MongoDB)  │  │ (Elastic)   │  │ (Teacher)  │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pipeline Stages

### Stage 1: Document Ingestion

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 1: INGESTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Sources           Validation              Storage        │
│  ┌──────────┐           ┌──────────┐           ┌──────────┐    │
│  │ PDF      │──┐        │ File     │           │ S3/Azure │    │
│  │ (.pdf)   │  │        │ Type     │           │ Blob     │    │
│  ├──────────┤  │        │ Check    │           │ Storage  │    │
│  │ Word     │──┼──────> │          │─────────> │          │    │
│  │(.docx)   │  │        │ Size     │           │ CDN      │    │
│  ├──────────┤  │        │ Limit    │           │ Enabled  │    │
│  │ Images   │──┘        │ (50MB)   │           │          │    │
│  │(.jpg/png)│           │          │           │          │    │
│  └──────────┘           │ Virus    │           └──────────┘    │
│                         │ Scan     │                  │         │
│                         └──────────┘                  │         │
│                                                       ▼         │
│                                              ┌──────────────┐   │
│                                              │ Queue Job    │   │
│                                              │ (Bull/Redis) │   │
│                                              └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Supported Formats:**
| Format | Extensions | Max Size | Notes |
|--------|------------|----------|-------|
| PDF | .pdf | 50MB | Scanned + Native |
| Word | .docx, .doc | 25MB | All versions |
| Images | .jpg, .png, .tiff | 10MB | OCR required |
| Text | .txt, .rtf | 5MB | Direct processing |

**API Endpoint:**
```javascript
POST /api/v1/documents/upload
Content-Type: multipart/form-data

{
  file: <binary>,
  metadata: {
    subject_id: "uuid",
    class_id: "uuid",
    chapter: "Quadratic Equations",
    language: "en"  // Optional, auto-detected
  }
}

Response:
{
  document_id: "uuid",
  status: "queued",
  estimated_processing_time: 45,  // seconds
  webhook_url: "/api/v1/documents/{id}/status"
}
```

---

### Stage 2: Text Extraction

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 2: EXTRACTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EXTRACTION ENGINE                     │   │
│  │                                                          │   │
│  │   PDF Processing        Word Processing      OCR Engine  │   │
│  │   ┌────────────┐       ┌────────────┐      ┌──────────┐ │   │
│  │   │ PyMuPDF    │       │ python-    │      │ Tesseract│ │   │
│  │   │ (fitz)     │       │ docx       │      │ 5.0      │ │   │
│  │   ├────────────┤       ├────────────┤      ├──────────┤ │   │
│  │   │ pdfplumber │       │ mammoth    │      │ EasyOCR  │ │   │
│  │   │ (tables)   │       │ (html)     │      │ (multi-  │ │   │
│  │   ├────────────┤       └────────────┘      │  lingual)│ │   │
│  │   │ Apache     │                           ├──────────┤ │   │
│  │   │ Tika       │                           │ Azure    │ │   │
│  │   │ (fallback) │                           │ Vision   │ │   │
│  │   └────────────┘                           │ (premium)│ │   │
│  │                                            └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   EXTRACTED OUTPUT                       │   │
│  │                                                          │   │
│  │  {                                                       │   │
│  │    "pages": [                                            │   │
│  │      {                                                   │   │
│  │        "page_num": 1,                                    │   │
│  │        "text": "Chapter 5: Quadratic Equations...",      │   │
│  │        "tables": [{headers: [...], rows: [...]}],        │   │
│  │        "images": [{path: "...", ocr_text: "..."}],       │   │
│  │        "layout": {columns: 1, orientation: "portrait"}   │   │
│  │      }                                                   │   │
│  │    ],                                                    │   │
│  │    "metadata": {                                         │   │
│  │      "total_pages": 12,                                  │   │
│  │      "language": "en",                                   │   │
│  │      "is_scanned": false                                 │   │
│  │    }                                                     │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Extraction Strategy Decision Tree:**
```
Document Received
       │
       ▼
   Is PDF?
   ┌──┴──┐
  Yes    No
   │      │
   ▼      ▼
Is Scanned?   Is Word?
   │           │
┌──┴──┐      ┌─┴─┐
Yes   No    Yes  No
 │     │     │    │
 ▼     ▼     ▼    ▼
OCR   PyMuPDF  python-docx  Image OCR
      +tables    +mammoth
```

**Language Detection:**
```python
# Using langdetect + custom model for Indian languages
def detect_language(text):
    # Primary: langdetect
    # Fallback: fastText for Indian languages
    # Special handling: Devanagari, Arabic, Chinese scripts
    pass
```

---

### Stage 3: Content Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 3: ANALYSIS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  NLP PROCESSING                          │   │
│  │                                                          │   │
│  │   ┌──────────────┐    ┌──────────────┐                  │   │
│  │   │ Sentence     │    │ Entity       │                  │   │
│  │   │ Segmentation │───>│ Recognition  │                  │   │
│  │   │ (spaCy)      │    │ (NER)        │                  │   │
│  │   └──────────────┘    └──────────────┘                  │   │
│  │          │                   │                           │   │
│  │          ▼                   ▼                           │   │
│  │   ┌──────────────┐    ┌──────────────┐                  │   │
│  │   │ Structure    │    │ Topic        │                  │   │
│  │   │ Detection    │    │ Classification│                  │   │
│  │   │ (headings,   │    │ (ML model)   │                  │   │
│  │   │  lists, Q&A) │    │              │                  │   │
│  │   └──────────────┘    └──────────────┘                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CONTENT CLASSIFICATION                      │   │
│  │                                                          │   │
│  │  Subject Detection:                                      │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ Keywords + ML Classifier                            ││   │
│  │  │ "equation", "solve for x" → Mathematics             ││   │
│  │  │ "photosynthesis", "cell" → Biology                  ││   │
│  │  │ "freedom movement", "1947" → History                ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  Chapter/Topic Extraction:                               │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ Heading detection + Syllabus matching               ││   │
│  │  │ "Chapter 5: Quadratic Equations"                    ││   │
│  │  │ "5.1 Standard Form" → Topic                         ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Stage 4: Question Detection & Generation

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 4: QUESTION INTELLIGENCE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           EXISTING QUESTION DETECTION                    │   │
│  │                                                          │   │
│  │   Pattern Matching:                                      │   │
│  │   ┌────────────────────────────────────────────────────┐│   │
│  │   │ • "Q1.", "Question 1:", "1.", "1)"                 ││   │
│  │   │ • "?" at end of sentence                           ││   │
│  │   │ • "Choose the correct", "Fill in the blank"        ││   │
│  │   │ • MCQ patterns: "(a)", "(A)", "a)", "a."           ││   │
│  │   │ • Answer patterns: "Ans:", "Answer:", "Sol:"       ││   │
│  │   └────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │   LLM Enhancement:                                       │   │
│  │   ┌────────────────────────────────────────────────────┐│   │
│  │   │ GPT-4/Claude for:                                  ││   │
│  │   │ • Ambiguous question boundary detection            ││   │
│  │   │ • Answer extraction from explanations              ││   │
│  │   │ • Difficulty level assessment                      ││   │
│  │   │ • Question type classification                     ││   │
│  │   └────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            AI QUESTION GENERATION                        │   │
│  │                                                          │   │
│  │   Input: Extracted content (paragraphs, facts, concepts) │   │
│  │                                                          │   │
│  │   ┌────────────────────────────────────────────────────┐│   │
│  │   │ LLM Prompt Engineering:                            ││   │
│  │   │                                                    ││   │
│  │   │ SYSTEM: You are an expert educator creating        ││   │
│  │   │ assessment questions for [SUBJECT] students in     ││   │
│  │   │ [CLASS]. Generate questions from the content.      ││   │
│  │   │                                                    ││   │
│  │   │ USER: [CONTENT CHUNK]                              ││   │
│  │   │                                                    ││   │
│  │   │ Generate:                                          ││   │
│  │   │ - 3 MCQ questions (easy, medium, hard)             ││   │
│  │   │ - 2 fill-in-the-blank questions                    ││   │
│  │   │ - 1 short answer question                          ││   │
│  │   │ - 1 long answer question                           ││   │
│  │   │                                                    ││   │
│  │   │ Format: JSON with question, options, answer,       ││   │
│  │   │         explanation, difficulty, marks             ││   │
│  │   └────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │   Output Types:                                          │   │
│  │   ┌──────────────────────────────────────────────────┐  │   │
│  │   │ MCQ │ True/False │ Fill Blank │ Short │ Long │   │  │   │
│  │   │ Match │ Sequence │ Assertion-Reason │ Case-Based│  │   │
│  │   └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Question Type Detection Patterns:**

```python
QUESTION_PATTERNS = {
    "mcq": [
        r"^\d+[\.\)]\s*.*\n\s*[aA][\.\)]\s*.*\n\s*[bB][\.\)]\s*.*",
        r"Choose the correct (answer|option)",
        r"Which of the following",
    ],
    "true_false": [
        r"(True|False|T/F)\s*[:.]",
        r"State whether.*true or false",
    ],
    "fill_blank": [
        r"Fill in the blank",
        r"_+\s*\.",  # Underscores indicating blank
        r"\[blank\]",
    ],
    "short_answer": [
        r"(Define|What is|Explain briefly|Give reason)",
        r"\(\d+ marks?\)",  # 2-3 marks typically
    ],
    "long_answer": [
        r"(Explain in detail|Describe|Discuss|Elaborate)",
        r"\([5-9]|10 marks?\)",  # 5+ marks
    ],
}
```

---

### Stage 5: Review & Correction Interface

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 5: TEACHER REVIEW UI                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  REVIEW DASHBOARD                                        │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ Document: Chapter5_QuadraticEq.pdf                  ││   │
│  │  │ Status: Review Pending | 15 questions extracted     ││   │
│  │  │ Confidence: 87%                                     ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌────────────────────────────┐   │   │
│  │  │ Original PDF     │  │ Extracted Questions        │   │   │
│  │  │ ┌──────────────┐ │  │ ┌────────────────────────┐ │   │   │
│  │  │ │              │ │  │ │ Q1. [MCQ] ✓ Verified   │ │   │   │
│  │  │ │  [Page View] │ │  │ │ Solve x² + 5x + 6 = 0 │ │   │   │
│  │  │ │              │ │  │ │ a) -2, -3  ✓          │ │   │   │
│  │  │ │  Highlighted │ │  │ │ b) 2, 3               │ │   │   │
│  │  │ │  Source      │ │  │ │ c) -2, 3              │ │   │   │
│  │  │ │              │ │  │ │ d) 2, -3              │ │   │   │
│  │  │ └──────────────┘ │  │ │                        │ │   │   │
│  │  │  [< Prev] [Next>]│  │ │ [Edit] [Delete] [Skip] │ │   │   │
│  │  └──────────────────┘  │ └────────────────────────┘ │   │   │
│  │                        │                            │   │   │
│  │                        │ Q2. [Fill] ⚠ Review Needed │   │   │
│  │                        │ The roots of equation...   │   │   │
│  │                        │ Confidence: 62%            │   │   │
│  │                        └────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Actions:                                                │   │
│  │  [✓ Approve All High Confidence] [Add to Question Bank]  │   │
│  │  [Request Re-processing] [Manually Add Question]         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Review API:**
```javascript
// Get questions for review
GET /api/v1/documents/{id}/questions?status=pending_review

// Approve question
POST /api/v1/questions/{id}/approve
{
  verified: true,
  corrections: {
    question_text: "Corrected text...",
    correct_answer: "b"
  }
}

// Bulk approve
POST /api/v1/questions/bulk-approve
{
  question_ids: ["uuid1", "uuid2"],
  auto_add_to_bank: true
}
```

---

## 4. Multilingual Support Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTILINGUAL PROCESSING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Language Detection                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │   Script Detection (Unicode ranges)                      │   │
│  │   ├── Latin (a-z) → langdetect                          │   │
│  │   ├── Devanagari → Hindi/Sanskrit/Marathi classifier    │   │
│  │   ├── Arabic → Arabic/Urdu classifier                   │   │
│  │   ├── Chinese → Simplified/Traditional                  │   │
│  │   └── Cyrillic → Russian/Ukrainian                      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OCR by Language                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Language          │ OCR Engine        │ Model         │   │
│  │   ─────────────────────────────────────────────────────│   │
│  │   English           │ Tesseract         │ eng           │   │
│  │   Hindi             │ Tesseract         │ hin + eng     │   │
│  │   Arabic            │ EasyOCR           │ ar            │   │
│  │   Chinese           │ PaddleOCR         │ ch            │   │
│  │   Tamil/Telugu      │ Tesseract         │ tam/tel       │   │
│  │   Mixed Scripts     │ EasyOCR           │ multi         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  LLM Prompts by Language                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   • Prompts stored in database per language             │   │
│  │   • Native language prompts for better generation       │   │
│  │   • Transliteration support for mixed content           │   │
│  │   • RTL handling for Arabic/Hebrew/Urdu                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Supported Languages Matrix:**

| Language | OCR | Question Detection | AI Generation | Priority |
|----------|-----|-------------------|---------------|----------|
| English | ✅ Tesseract | ✅ Full | ✅ Full | P0 |
| Hindi | ✅ Tesseract | ✅ Full | ✅ Full | P0 |
| Spanish | ✅ Tesseract | ✅ Full | ✅ Full | P1 |
| French | ✅ Tesseract | ✅ Full | ✅ Full | P1 |
| Arabic | ✅ EasyOCR | ✅ Full | ✅ Full | P1 |
| Chinese | ✅ PaddleOCR | ✅ Full | ✅ Full | P1 |
| Tamil | ✅ Tesseract | ⚠️ Basic | ⚠️ Basic | P2 |
| Telugu | ✅ Tesseract | ⚠️ Basic | ⚠️ Basic | P2 |
| Marathi | ✅ Tesseract | ⚠️ Basic | ⚠️ Basic | P2 |
| Bengali | ✅ Tesseract | ⚠️ Basic | ⚠️ Basic | P2 |
| Urdu | ✅ EasyOCR | ⚠️ Basic | ⚠️ Basic | P2 |

---

## 5. Technical Implementation

### 5.1 Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Processing Service (Python)                                    │
│  ├── FastAPI (API layer)                                       │
│  ├── Celery + Redis (Job queue)                                │
│  ├── PyMuPDF/pdfplumber (PDF processing)                       │
│  ├── python-docx (Word processing)                             │
│  ├── Tesseract/EasyOCR (OCR)                                   │
│  ├── spaCy (NLP)                                               │
│  ├── LangChain (LLM orchestration)                             │
│  └── transformers (ML models)                                  │
│                                                                 │
│  AI/LLM Layer                                                   │
│  ├── OpenAI GPT-4 (primary)                                    │
│  ├── Anthropic Claude (fallback)                               │
│  ├── Local Llama 2 (offline/cost-saving)                       │
│  └── Azure OpenAI (enterprise)                                 │
│                                                                 │
│  Storage                                                        │
│  ├── AWS S3 / Azure Blob (documents)                           │
│  ├── MongoDB (parsed content, questions)                       │
│  ├── Elasticsearch (search index)                              │
│  └── Redis (cache, queues)                                     │
│                                                                 │
│  Infrastructure                                                 │
│  ├── Docker containers                                         │
│  ├── Kubernetes orchestration                                  │
│  └── GPU nodes for OCR/ML (optional)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Service Architecture

```python
# services/document_processor/main.py

from fastapi import FastAPI, UploadFile, BackgroundTasks
from celery import Celery

app = FastAPI()
celery_app = Celery('document_processor', broker='redis://localhost:6379/0')

@app.post("/api/v1/documents/upload")
async def upload_document(
    file: UploadFile,
    subject_id: str,
    class_id: str,
    background_tasks: BackgroundTasks
):
    # 1. Validate file
    # 2. Store in S3
    # 3. Create database record
    # 4. Queue processing job

    document_id = await store_document(file)
    celery_app.send_task('process_document', args=[document_id])

    return {"document_id": document_id, "status": "queued"}


@celery_app.task(name='process_document')
def process_document(document_id: str):
    """Main processing pipeline"""

    # Stage 1: Download file
    file_path = download_from_s3(document_id)

    # Stage 2: Extract content
    extracted = extract_content(file_path)

    # Stage 3: Analyze and classify
    analyzed = analyze_content(extracted)

    # Stage 4: Detect/Generate questions
    questions = detect_questions(analyzed)
    generated = generate_questions(analyzed)

    # Stage 5: Store results
    store_results(document_id, questions, generated)

    # Notify completion
    notify_completion(document_id)
```

### 5.3 Question Detection Module

```python
# services/document_processor/question_detector.py

import re
from dataclasses import dataclass
from typing import List, Optional
from langchain import LLMChain, PromptTemplate

@dataclass
class DetectedQuestion:
    text: str
    type: str  # mcq, short, long, fill_blank, true_false
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    confidence: float = 0.0
    source_page: int = 0
    source_text: str = ""

class QuestionDetector:

    MCQ_PATTERN = re.compile(
        r'(?P<num>\d+[\.\)])\s*(?P<question>.+?)\n'
        r'\s*[aA][\.\)]\s*(?P<opt_a>.+?)\n'
        r'\s*[bB][\.\)]\s*(?P<opt_b>.+?)\n'
        r'\s*[cC][\.\)]\s*(?P<opt_c>.+?)\n'
        r'\s*[dD][\.\)]\s*(?P<opt_d>.+)',
        re.MULTILINE | re.DOTALL
    )

    def detect_mcq(self, text: str, page_num: int) -> List[DetectedQuestion]:
        questions = []
        for match in self.MCQ_PATTERN.finditer(text):
            q = DetectedQuestion(
                text=match.group('question').strip(),
                type='mcq',
                options=[
                    match.group('opt_a').strip(),
                    match.group('opt_b').strip(),
                    match.group('opt_c').strip(),
                    match.group('opt_d').strip(),
                ],
                confidence=0.95,  # High confidence for pattern match
                source_page=page_num,
                source_text=match.group(0)
            )
            questions.append(q)
        return questions

    def detect_with_llm(self, text: str, page_num: int) -> List[DetectedQuestion]:
        """Use LLM for complex/ambiguous cases"""

        prompt = PromptTemplate(
            input_variables=["content"],
            template="""
            Analyze this educational content and identify any questions present.
            For each question found, extract:
            - The question text
            - Question type (mcq/short/long/fill_blank/true_false)
            - Options if MCQ
            - Answer if present
            - Confidence (0-1) in your detection

            Content:
            {content}

            Return as JSON array.
            """
        )

        chain = LLMChain(llm=self.llm, prompt=prompt)
        result = chain.run(content=text)

        return self._parse_llm_response(result, page_num)
```

### 5.4 Question Generation Module

```python
# services/document_processor/question_generator.py

from langchain import LLMChain, PromptTemplate
from typing import List, Dict

class QuestionGenerator:

    GENERATION_PROMPT = PromptTemplate(
        input_variables=["subject", "class_level", "content", "language"],
        template="""
        You are an expert {subject} teacher creating assessment questions for Class {class_level} students.

        Based on the following educational content, generate questions:

        CONTENT:
        {content}

        REQUIREMENTS:
        - Generate in {language} language
        - Include a mix of question types
        - Vary difficulty levels (easy, medium, hard)
        - Each question must be answerable from the content provided
        - Include correct answers and brief explanations

        GENERATE:
        1. 3 Multiple Choice Questions (1 easy, 1 medium, 1 hard)
        2. 2 Fill in the Blank questions
        3. 1 True/False question
        4. 1 Short Answer question (2-3 marks)
        5. 1 Long Answer question (5 marks)

        FORMAT (JSON):
        {{
            "questions": [
                {{
                    "type": "mcq",
                    "difficulty": "easy|medium|hard",
                    "question": "...",
                    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
                    "correct_answer": "a",
                    "explanation": "...",
                    "marks": 1,
                    "tags": ["topic1", "topic2"]
                }}
            ]
        }}
        """
    )

    def generate(
        self,
        content: str,
        subject: str,
        class_level: str,
        language: str = "English"
    ) -> List[Dict]:

        chain = LLMChain(llm=self.llm, prompt=self.GENERATION_PROMPT)

        result = chain.run(
            subject=subject,
            class_level=class_level,
            content=content,
            language=language
        )

        return self._parse_and_validate(result)

    def _parse_and_validate(self, llm_response: str) -> List[Dict]:
        """Parse LLM response and validate question quality"""
        # Parse JSON
        # Validate each question has required fields
        # Check answer validity
        # Assign confidence scores
        pass
```

---

## 6. API Reference

### 6.1 Document Upload

```yaml
POST /api/v1/documents/upload
Content-Type: multipart/form-data

Request:
  file: binary (required)
  subject_id: uuid (required)
  class_id: uuid (required)
  chapter: string (optional)
  language: string (optional, auto-detected)
  auto_generate: boolean (default: true)

Response 202 Accepted:
  {
    "document_id": "uuid",
    "filename": "chapter5.pdf",
    "status": "queued",
    "estimated_time_seconds": 45,
    "tracking_url": "/api/v1/documents/{id}/status"
  }
```

### 6.2 Processing Status

```yaml
GET /api/v1/documents/{id}/status

Response 200:
  {
    "document_id": "uuid",
    "status": "processing", // queued, processing, completed, failed
    "progress": {
      "current_stage": "question_detection",
      "stages_completed": ["extraction", "analysis"],
      "percent_complete": 65
    },
    "results": {
      "pages_processed": 12,
      "questions_detected": 8,
      "questions_generated": 15,
      "confidence_avg": 0.87
    }
  }
```

### 6.3 Get Extracted Questions

```yaml
GET /api/v1/documents/{id}/questions
Query params:
  status: pending_review|approved|rejected
  type: mcq|short|long|fill_blank|true_false
  difficulty: easy|medium|hard
  page: 1
  limit: 20

Response 200:
  {
    "total": 23,
    "page": 1,
    "questions": [
      {
        "id": "uuid",
        "document_id": "uuid",
        "question_text": "What is the quadratic formula?",
        "type": "short",
        "difficulty": "medium",
        "options": null,
        "correct_answer": "x = (-b ± √(b²-4ac)) / 2a",
        "explanation": "...",
        "marks": 2,
        "source_page": 5,
        "confidence": 0.92,
        "status": "pending_review",
        "tags": ["quadratic", "formula", "algebra"]
      }
    ]
  }
```

### 6.4 Approve/Edit Question

```yaml
POST /api/v1/questions/{id}/approve

Request:
  {
    "approved": true,
    "corrections": {
      "question_text": "Corrected question text",
      "correct_answer": "b"
    },
    "add_to_question_bank": true
  }

Response 200:
  {
    "question_id": "uuid",
    "status": "approved",
    "question_bank_id": "uuid" // if added to bank
  }
```

### 6.5 Generate More Questions

```yaml
POST /api/v1/documents/{id}/generate

Request:
  {
    "content_selection": "full", // full, pages, custom
    "page_range": [3, 5],
    "custom_content": "...",
    "question_types": ["mcq", "short"],
    "count": {
      "mcq": 5,
      "short": 3
    },
    "difficulty_distribution": {
      "easy": 30,
      "medium": 50,
      "hard": 20
    }
  }

Response 202:
  {
    "job_id": "uuid",
    "status": "queued",
    "estimated_questions": 8
  }
```

---

## 7. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| PDF Processing (10 pages) | < 15 seconds | P95 latency |
| PDF Processing (50 pages) | < 45 seconds | P95 latency |
| OCR Processing | < 3 sec/page | Average |
| Question Detection | < 5 seconds | Per document |
| Question Generation | < 20 seconds | For 10 questions |
| Concurrent Documents | 100+ | Simultaneous processing |
| Detection Accuracy | > 85% | Validated against manual |
| Generation Quality | > 80% | Teacher acceptance rate |

---

## 8. Error Handling

```python
class DocumentProcessingError(Exception):
    """Base exception for document processing"""
    pass

class ExtractionError(DocumentProcessingError):
    """Failed to extract content from document"""
    pass

class OCRError(DocumentProcessingError):
    """OCR processing failed"""
    pass

class LLMError(DocumentProcessingError):
    """LLM API call failed"""
    pass

# Retry Strategy
RETRY_POLICY = {
    "extraction": {"max_retries": 3, "backoff": "exponential"},
    "ocr": {"max_retries": 2, "backoff": "linear"},
    "llm": {"max_retries": 3, "backoff": "exponential", "fallback": "claude"},
}
```

---

## 9. Monitoring & Observability

```yaml
Metrics to Track:
  - document_upload_count (counter)
  - document_processing_duration (histogram)
  - questions_detected_count (counter)
  - questions_generated_count (counter)
  - detection_confidence_score (histogram)
  - ocr_processing_time (histogram)
  - llm_api_latency (histogram)
  - error_rate_by_stage (counter)

Alerts:
  - Processing queue depth > 1000
  - Error rate > 5%
  - Average processing time > 2 minutes
  - LLM API errors > 10/minute
```

---

*Pipeline designed by Winston (Architect) + Amelia (Developer) - BMAD Agent Team*
