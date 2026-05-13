import os
import shutil
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings

from .models import (
    Resume, JobDescription, SkillGapAnalysis,
    ChatSession, ChatMessage, UserProfile
)
from .serializers import (
    RegisterSerializer, UserSerializer,
    ResumeSerializer, ResumeListSerializer,
    JobDescriptionSerializer, JobDescriptionListSerializer,
    SkillGapAnalysisSerializer,
    ChatSessionSerializer, ChatSessionListSerializer,
    ChatMessageSerializer
)
from .qa_engine import extract_text_from_pdf, split_into_chunks, embed_texts, retrieve_chunks, match_resumes_to_jd
from .gemini_api import ask_gemini, analyze_skill_gap, recommend_courses, generate_interview_questions


class IsHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'hr'


class IsCandidate(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'candidate'


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({'user': UserSerializer(user).data, 'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    def patch(self, request):
        profile = request.user.profile
        for field in ['company', 'bio', 'avatar_url']:
            if field in request.data.get('profile', {}):
                setattr(profile, field, request.data['profile'][field])
        profile.save()
        for field in ['first_name', 'last_name']:
            if field in request.data:
                setattr(request.user, field, request.data[field])
        request.user.save()
        return Response(UserSerializer(request.user).data)


class ResumeListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request):
        resumes = Resume.objects.all() if request.user.profile.role == 'hr' else Resume.objects.filter(uploaded_by=request.user)
        return Response(ResumeListSerializer(resumes, many=True, context={'request': request}).data)
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        try:
            text = extract_text_from_pdf(file)
            if not text.strip():
                return Response({'error': 'No text found in PDF'}, status=400)
        except Exception as e:
            return Response({'error': f'Error: {e}'}, status=400)
        name = request.data.get('candidate_name', '') or file.name.split('.')[0].replace('-', ' ').replace('_', ' ')
        resume = Resume.objects.create(candidate_name=name, file=file, text_content=text, uploaded_by=request.user)
        return Response(ResumeSerializer(resume, context={'request': request}).data, status=201)


class ResumeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            return Response(ResumeSerializer(Resume.objects.get(pk=pk), context={'request': request}).data)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if resume.file:
            resume.file.delete(save=False)
        resume.delete()
        return Response(status=204)


class BulkResumeUploadView(APIView):
    permission_classes = [IsHR]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'No files'}, status=400)
        uploaded, errors = [], []
        for f in files:
            try:
                text = extract_text_from_pdf(f)
                name = f.name.split('.')[0].replace('-', ' ').replace('_', ' ')
                resume = Resume.objects.create(candidate_name=name, file=f, text_content=text, uploaded_by=request.user)
                uploaded.append(ResumeListSerializer(resume, context={'request': request}).data)
            except Exception as e:
                errors.append({'file': f.name, 'error': str(e)})
        return Response({'uploaded': uploaded, 'errors': errors, 'total_uploaded': len(uploaded)}, status=201)


class BulkDeleteResumesView(APIView):
    permission_classes = [IsHR]
    def delete(self, request):
        resumes = Resume.objects.all()
        count = resumes.count()
        for r in resumes:
            if r.file:
                r.file.delete(save=False)
        resumes.delete()
        return Response({'deleted': count}, status=200)


class BulkDeleteJDsView(APIView):
    permission_classes = [IsHR]
    def delete(self, request):
        jds = JobDescription.objects.all()
        count = jds.count()
        for j in jds:
            if j.file:
                j.file.delete(save=False)
        jds.delete()
        return Response({'deleted': count}, status=200)



class JDListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request):
        return Response(JobDescriptionListSerializer(JobDescription.objects.all(), many=True).data)
    def post(self, request):
        title = request.data.get('title', '')
        text_content = request.data.get('text_content', '')
        file = request.FILES.get('file')
        if not title:
            return Response({'error': 'Title required'}, status=400)
        if file:
            try:
                text_content = extract_text_from_pdf(file)
            except Exception as e:
                return Response({'error': f'Error: {e}'}, status=400)
        if not text_content.strip():
            return Response({'error': 'JD content required'}, status=400)
        jd = JobDescription.objects.create(title=title, file=file, text_content=text_content, uploaded_by=request.user)
        return Response(JobDescriptionSerializer(jd, context={'request': request}).data, status=201)


class JDDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            return Response(JobDescriptionSerializer(JobDescription.objects.get(pk=pk), context={'request': request}).data)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
    def delete(self, request, pk):
        try:
            jd = JobDescription.objects.get(pk=pk)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if jd.file:
            jd.file.delete(save=False)
        jd.delete()
        return Response(status=204)


class SkillGapAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        resume_id, jd_id = request.data.get('resume_id'), request.data.get('jd_id')
        if not resume_id or not jd_id:
            return Response({'error': 'resume_id and jd_id required'}, status=400)
        try:
            resume = Resume.objects.get(pk=resume_id)
            jd = JobDescription.objects.get(pk=jd_id)
        except (Resume.DoesNotExist, JobDescription.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)
        result = analyze_skill_gap(resume.text_content, jd.text_content)
        analysis = SkillGapAnalysis.objects.create(
            resume=resume, job_description=jd, missing_skills=result.get('missing_skills', []),
            matching_skills=result.get('matching_skills', []), match_score=result.get('match_score', 0),
            summary=result.get('summary', ''), recommendations=result.get('improvement_areas', []), user=request.user
        )
        return Response(SkillGapAnalysisSerializer(analysis).data, status=201)
    def get(self, request):
        return Response(SkillGapAnalysisSerializer(SkillGapAnalysis.objects.filter(user=request.user), many=True).data)


class CourseRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        skills = request.data.get('skills', [])
        if not skills:
            return Response({'error': 'skills list required'}, status=400)
        return Response(recommend_courses(skills))


class BestFitCandidatesView(APIView):
    permission_classes = [IsHR]
    def post(self, request):
        jd_id = request.data.get('jd_id')
        if not jd_id:
            return Response({'error': 'jd_id required'}, status=400)
        try:
            jd = JobDescription.objects.get(pk=jd_id)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        resumes = Resume.objects.all()
        if not resumes.exists():
            return Response({'error': 'No resumes'}, status=400)
        best, all_results = match_resumes_to_jd(jd.text_content, resumes, top_n=10, threshold=0.3)
        all_data = [{'id': r.id, 'candidate_name': r.candidate_name, 'file_url': request.build_absolute_uri(r.file.url) if r.file else None, 'score': round(s * 100, 1)} for r, s in all_results]
        best_ids = {r.id for r in best}
        return Response({'jd': {'id': jd.id, 'title': jd.title}, 'best_fit': [d for d in all_data if d['id'] in best_ids], 'all_candidates': all_data})


class InterviewQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        resume_id, jd_id = request.data.get('resume_id'), request.data.get('jd_id')
        if not resume_id or not jd_id:
            return Response({'error': 'resume_id and jd_id required'}, status=400)
        try:
            resume = Resume.objects.get(pk=resume_id)
            jd = JobDescription.objects.get(pk=jd_id)
        except (Resume.DoesNotExist, JobDescription.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)
        return Response(generate_interview_questions(resume.text_content, jd.text_content))


class ChatSessionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(ChatSessionListSerializer(ChatSession.objects.filter(user=request.user), many=True).data)
    def post(self, request):
        resume_id, jd_id = request.data.get('resume_id'), request.data.get('jd_id')
        session_type = request.data.get('session_type', 'single')
        title = request.data.get('title', '')
        resume, jd = None, None
        if resume_id:
            try: resume = Resume.objects.get(pk=resume_id)
            except Resume.DoesNotExist: pass
        if jd_id:
            try: jd = JobDescription.objects.get(pk=jd_id)
            except JobDescription.DoesNotExist: pass
        if not title:
            parts = []
            if resume: parts.append(resume.candidate_name or 'Resume')
            if jd: parts.append(jd.title)
            title = ' × '.join(parts) if parts else 'Chat Session'
        session = ChatSession.objects.create(user=request.user, resume=resume, job_description=jd, session_type=session_type, title=title)
        return Response(ChatSessionSerializer(session).data, status=201)


class ChatSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            return Response(ChatSessionSerializer(ChatSession.objects.get(pk=pk, user=request.user)).data)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
    def delete(self, request, pk):
        try:
            ChatSession.objects.get(pk=pk, user=request.user).delete()
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(status=204)


class ChatMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, session_id):
        try:
            session = ChatSession.objects.get(pk=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        question = request.data.get('message', '').strip()
        if not question:
            return Response({'error': 'Message required'}, status=400)
        user_msg = ChatMessage.objects.create(session=session, role='user', content=question)
        context_parts = []
        if session.job_description:
            context_parts.append(f"JD:\n{session.job_description.text_content}")
        if session.session_type == 'group':
            for r in Resume.objects.all():
                context_parts.append(f"{r.candidate_name}:\n{r.text_content}")
        elif session.resume:
            chunks = split_into_chunks(session.resume.text_content)
            chunk_embs = embed_texts(chunks)
            top_chunks = retrieve_chunks(question, chunks, chunk_embs, top_k=3)
            context_parts.append("Resume:\n" + '\n'.join(top_chunks))
        try:
            answer = ask_gemini('\n\n'.join(context_parts), question)
        except Exception as e:
            answer = f"[Error: {e}]"
        ai_msg = ChatMessage.objects.create(session=session, role='assistant', content=answer)
        return Response({'user_message': ChatMessageSerializer(user_msg).data, 'ai_message': ChatMessageSerializer(ai_msg).data}, status=201)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.profile.role == 'hr':
            return Response({'role': 'hr', 'total_resumes': Resume.objects.count(), 'total_jds': JobDescription.objects.count(), 'total_chats': ChatSession.objects.filter(user=user).count(),
                'recent_resumes': ResumeListSerializer(Resume.objects.all(), many=True, context={'request': request}).data,
                'recent_jds': JobDescriptionListSerializer(JobDescription.objects.all(), many=True).data})
        return Response({'role': 'candidate', 'my_resumes': ResumeListSerializer(Resume.objects.filter(uploaded_by=user), many=True, context={'request': request}).data,
            'total_analyses': SkillGapAnalysis.objects.filter(user=user).count(), 'total_chats': ChatSession.objects.filter(user=user).count(),
            'available_jds': JobDescriptionListSerializer(JobDescription.objects.all()[:10], many=True).data})
