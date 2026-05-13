# Project Report: TalentGem (Resume & JD Intelligence Platform)

## 1. Executive Summary
**TalentGem** is a sophisticated full-stack application designed to revolutionize the recruitment process. By transitioning from a monolithic Django architecture to a modern decoupled **DRF + React** stack, the project now offers superior performance, enhanced user experience, and robust AI integration. The platform automates the tedious parts of recruitment (screening, gap analysis) while providing actionable insights for candidates to improve their career prospects.

## 2. System Architecture
The project follows a **Client-Server architecture**:

### 2.1 Backend (Service Layer)
- **Framework**: Django Rest Framework (DRF).
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).
- **Database**: Relational model storing Users, Profiles, Resumes, JDs, and AI Analysis results.
- **AI Core**: Modular integration with Google Gemini API via a dedicated `gemini_api.py` service.
- **File Handling**: PDF processing using `pdfplumber` for high-fidelity text extraction.

### 2.2 Frontend (Presentation Layer)
- **Framework**: React 19 + Vite.
- **State Management**: React Hooks and Context.
- **Navigation**: React Router DOM (v7).
- **Styling**: Modern, responsive CSS with a focus on premium aesthetics and micro-animations.
- **API Integration**: Axios with interceptors for seamless JWT handling.

## 3. Key Modules & Implementation Details

### 3.1 Talent Intelligence (AI Engine)
Located in `backend/qa_app/gemini_api.py`, this module handles all interactions with the LLM. It includes specialized prompts for:
- **Skill Extraction**: Identifying technical and soft skills from unstructured text.
- **Gap Analysis**: Logical comparison of candidate profiles against job requirements.
- **Course Recommendation**: Generating dynamic search URLs for learning platforms.

### 3.2 Candidate Experience
Candidates can upload resumes, select target JDs, and receive a comprehensive **Skill Gap Report**. This report not only shows what is missing but provides a direct path to improvement via curated course recommendations.

### 3.3 HR & Recruiter Suite
HR users have access to a **Best-Fit Dashboard** where they can bulk upload resumes and instantly see a ranked list of candidates. The ranking is based on a multi-dimensional AI score considering skills, experience, and role suitability.

## 4. Technical Achievements
- **Architecture Migration**: Successfully decoupled the frontend from Django templates to a standalone React application.
- **Search-Based Learning**: Implemented a robust recommendation system that generates optimized search queries rather than static URLs, ensuring resource longevity.
- **Robust PDF Parsing**: Handled diverse resume formats and potential parsing errors gracefully.
- **JWT Persistence**: Implemented secure token storage and auto-refresh logic in the frontend.

## 5. Repository Structure
```text
resuemAnalysiser/
├── backend/            # Django REST API
│   ├── qa_app/         # Core application logic
│   │   ├── api_views.py# DRF Viewsets
│   │   ├── gemini_api.py# AI Service Layer
│   │   └── models.py   # Database Schema
│   └── resume_qa/      # Project Configuration
├── frontend/           # React Application
│   ├── src/
│   │   ├── pages/      # Feature-specific components
│   │   ├── api/        # Axios configurations
│   │   └── components/ # Reusable UI elements
│   └── vite.config.js
└── README.md           # Quickstart Guide
```

## 6. Future Roadmap
- **Social Integration**: One-click import from LinkedIn/GitHub.
- **Real-time Collaboration**: Multi-user interview panels with synchronized notes.
- **Advanced Visualization**: Interactive skill maps and career progression charts.
- **Export Capabilities**: Generate PDF reports for HR meetings and candidate feedback.

---
**Date**: May 14, 2026
**Status**: Version 2.0 (Decoupled Migration Complete)
