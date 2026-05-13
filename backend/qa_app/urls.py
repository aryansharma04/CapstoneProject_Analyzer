from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import api_views

urlpatterns = [
    # Auth
    path('api/auth/register/', api_views.RegisterView.as_view(), name='api_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='api_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('api/auth/me/', api_views.MeView.as_view(), name='api_me'),

    # Dashboard
    path('api/dashboard/', api_views.DashboardStatsView.as_view(), name='api_dashboard'),

    # Resumes
    path('api/resumes/', api_views.ResumeListCreateView.as_view(), name='api_resumes'),
    path('api/resumes/bulk/', api_views.BulkResumeUploadView.as_view(), name='api_bulk_resumes'),
    path('api/resumes/bulk-delete/', api_views.BulkDeleteResumesView.as_view(), name='api_bulk_delete_resumes'),
    path('api/resumes/<int:pk>/', api_views.ResumeDetailView.as_view(), name='api_resume_detail'),

    # Job Descriptions
    path('api/jds/', api_views.JDListCreateView.as_view(), name='api_jds'),
    path('api/jds/bulk-delete/', api_views.BulkDeleteJDsView.as_view(), name='api_bulk_delete_jds'),
    path('api/jds/<int:pk>/', api_views.JDDetailView.as_view(), name='api_jd_detail'),

    # Analysis
    path('api/analyze/skill-gap/', api_views.SkillGapAnalysisView.as_view(), name='api_skill_gap'),
    path('api/analyze/courses/', api_views.CourseRecommendationView.as_view(), name='api_courses'),
    path('api/analyze/best-fit/', api_views.BestFitCandidatesView.as_view(), name='api_best_fit'),
    path('api/analyze/interview-questions/', api_views.InterviewQuestionsView.as_view(), name='api_interview'),

    # Chat
    path('api/chat/sessions/', api_views.ChatSessionListCreateView.as_view(), name='api_chat_sessions'),
    path('api/chat/sessions/<int:pk>/', api_views.ChatSessionDetailView.as_view(), name='api_chat_detail'),
    path('api/chat/sessions/<int:session_id>/messages/', api_views.ChatMessageCreateView.as_view(), name='api_chat_messages'),
]
