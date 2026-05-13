import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = 'gemini-2.5-flash'


def _get_model():
    """Configure and return Gemini model instance."""
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(GEMINI_MODEL)


def ask_gemini(context, question):
    """General Q&A with resume/JD context."""
    prompt = f"""You are a resume and job description assistant. Use the provided context, which may include both a job description (JD) and a candidate resume, to answer the question. If both are present, use both for your answer.

{context}

Question: {question}
Answer:"""
    model = _get_model()
    response = model.generate_content(prompt)
    return response.text.strip()


def analyze_skill_gap(resume_text, jd_text):
    """Analyze skill gap between resume and JD. Returns structured JSON."""
    prompt = f"""You are an expert career advisor and HR consultant. Analyze the following resume against the job description and provide a detailed skill gap analysis.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{{
    "match_score": <number between 0 and 100>,
    "matching_skills": ["skill1", "skill2", ...],
    "missing_skills": ["skill1", "skill2", ...],
    "summary": "A 2-3 sentence summary of the candidate's fit for this role.",
    "strengths": ["strength1", "strength2", ...],
    "improvement_areas": ["area1", "area2", ...]
}}"""
    model = _get_model()
    response = model.generate_content(prompt)
    text = response.text.strip()
    # Clean markdown code blocks if present
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else text[3:]
    if text.endswith('```'):
        text = text[:-3]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "match_score": 0,
            "matching_skills": [],
            "missing_skills": [],
            "summary": text,
            "strengths": [],
            "improvement_areas": []
        }


def _build_search_url(platform, query):
    """Build a reliable search URL for a given platform and query."""
    import urllib.parse
    q = urllib.parse.quote_plus(query)
    platform_lower = platform.lower()
    if platform_lower == 'youtube':
        return f"https://www.youtube.com/results?search_query={q}"
    elif platform_lower == 'coursera':
        return f"https://www.coursera.org/search?query={q}"
    elif platform_lower == 'udemy':
        return f"https://www.udemy.com/courses/search/?q={q}"
    return f"https://www.google.com/search?q={q}+online+course"


def recommend_courses(skills_list):
    """Get course recommendations for a list of skills. Returns structured JSON."""
    skills_str = ", ".join(skills_list)
    prompt = f"""You are a learning advisor. For the following skills that a candidate needs to learn, recommend the best online courses from YouTube, Coursera, and Udemy.

SKILLS TO LEARN: {skills_str}

For each skill, provide 2-3 course recommendations. Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{{
    "courses": [
        {{
            "skill": "skill name",
            "title": "Course Title",
            "platform": "YouTube" or "Coursera" or "Udemy",
            "search_query": "a short search query to find this exact course on the platform",
            "instructor": "Instructor Name",
            "duration": "e.g., 12 hours",
            "level": "Beginner" or "Intermediate" or "Advanced",
            "description": "Brief 1-line description",
            "rating": 4.5,
            "thumbnail": "provide a relevant placeholder description for the course"
        }}
    ]
}}

Provide real, well-known courses that actually exist on these platforms. For search_query, give a concise query that would find this specific course on the platform (e.g. "Python for Everybody" or "React Tutorial Traversy Media")."""
    model = _get_model()
    response = model.generate_content(prompt)
    text = response.text.strip()
    # Clean markdown code blocks if present
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else text[3:]
    if text.endswith('```'):
        text = text[:-3]
    text = text.strip()
    try:
        data = json.loads(text)
        # Build real working URLs from the search queries
        for course in data.get('courses', []):
            search_query = course.pop('search_query', course.get('title', course.get('skill', '')))
            course['url'] = _build_search_url(course.get('platform', ''), search_query)
        return data
    except json.JSONDecodeError:
        return {"courses": []}


def generate_interview_questions(resume_text, jd_text):
    """Generate interview questions based on resume and JD."""
    prompt = f"""You are an expert interviewer. Based on the resume and job description below, generate 10 targeted interview questions that assess the candidate's fit.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Respond ONLY with valid JSON (no markdown, no code blocks):
{{
    "questions": [
        {{
            "question": "The interview question",
            "category": "Technical" or "Behavioral" or "Situational",
            "difficulty": "Easy" or "Medium" or "Hard",
            "purpose": "What this question evaluates"
        }}
    ]
}}"""
    model = _get_model()
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else text[3:]
    if text.endswith('```'):
        text = text[:-3]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"questions": []}
