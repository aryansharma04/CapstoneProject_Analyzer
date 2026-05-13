from django.contrib import admin
from .models import Resume, JobDescription, UserProfile, SkillGapAnalysis, ChatSession, ChatMessage

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
	list_display = ('candidate_name', 'file', 'uploaded_at', 'uploaded_by')

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
	list_display = ('title', 'uploaded_at', 'uploaded_by')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'role', 'company', 'created_at')

@admin.register(SkillGapAnalysis)
class SkillGapAnalysisAdmin(admin.ModelAdmin):
	list_display = ('resume', 'job_description', 'match_score', 'created_at')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
	list_display = ('title', 'user', 'session_type', 'created_at')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
	list_display = ('session', 'role', 'created_at')
