# TalentGem: AI-Powered Talent Intelligence Platform

TalentGem is a state-of-the-art, full-stack recruitment and career development platform. It leverages **Google Gemini AI** to bridge the gap between candidates and job requirements through deep semantic analysis, automated skill-gap assessments, and personalized learning pathways.

Built with a decoupled architecture using **Django Rest Framework** and **React**, TalentGem provides a premium, responsive experience for both HR professionals and job seekers.

---

## 🚀 Key Features

### 👔 For HR & Recruiters
- **Best-Fit Candidate Ranking**: Automatically rank hundreds of resumes against a Job Description (JD) using AI-driven semantic matching.
- **Bulk Resume Processing**: Upload and analyze multiple resumes simultaneously.
- **Interview Question Generator**: Generate tailored, high-quality interview questions based on specific candidate skill gaps.
- **Talent Analytics Dashboard**: Gain insights into your candidate pool and job requirement status.
- **Group Chat Interface**: Interact with AI to ask complex questions across multiple candidate profiles at once.

### 🎓 For Candidates
- **Deep Skill-Gap Analysis**: Understand exactly how your profile matches a target role with matching/missing skills breakdown.
- **Personalized Course Recommendations**: Get automated learning paths with direct search links to YouTube, Coursera, and Udemy to bridge your skill gaps.
- **Interactive Resume Chat**: Chat with an AI assistant specifically trained on your resume to help you prepare for interviews.
- **Application History**: Keep track of your analyzed resumes and target job descriptions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router, Axios, React Icons, React Hot Toast |
| **Backend** | Django 5.x, Django Rest Framework (DRF), SimpleJWT |
| **AI Engine** | Google Gemini 1.5 Flash / Pro |
| **Database** | SQLite (Development) / PostgreSQL (Production ready) |
| **Parsing** | pdfplumber (High-accuracy PDF text extraction) |

---

## ⚙️ Setup & Installation

### 1. Backend Setup (Django)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (Create a `.env` file):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   SECRET_KEY=your_django_secret_key
   DEBUG=True
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the API server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup (React)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173` (or the port shown in your terminal).

---

## 🧠 AI Integration Details
TalentGem uses advanced prompt engineering to ensure accuracy:
- **Text Extraction**: Uses `pdfplumber` for structured text retrieval from complex resume layouts.
- **Semantic Matching**: Uses Gemini to understand context, not just keywords, when comparing resumes to JDs.
- **Search-Based Recommendations**: Instead of static links, the AI generates optimized search queries to ensure learning resources are always fresh and relevant.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
