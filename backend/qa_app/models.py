from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile with role-based access."""
    ROLE_CHOICES = [
        ('hr', 'HR'),
        ('candidate', 'Candidate'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='candidate')
    avatar_url = models.URLField(blank=True, default='')
    company = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile when a User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class JobDescription(models.Model):
    """Job description uploaded by HR or Candidate."""
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='jds/', blank=True, null=True)
    text_content = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_descriptions')

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-uploaded_at']


class Resume(models.Model):
    """Resume uploaded by a candidate or HR."""
    candidate_name = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='resumes/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    text_content = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resumes')

    def __str__(self):
        return self.candidate_name or self.file.name.split('/')[-1]

    class Meta:
        ordering = ['-uploaded_at']


class SkillGapAnalysis(models.Model):
    """AI-generated skill gap analysis between resume and JD."""
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='analyses')
    job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name='analyses')
    missing_skills = models.JSONField(default=list)
    matching_skills = models.JSONField(default=list)
    match_score = models.FloatField(default=0)
    summary = models.TextField(blank=True, default='')
    recommendations = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='analyses')

    def __str__(self):
        return f"Analysis: {self.resume} vs {self.job_description}"

    class Meta:
        ordering = ['-created_at']


class ChatSession(models.Model):
    """Chat session between user and AI about resumes/JDs."""
    SESSION_TYPES = [
        ('single', 'Single Resume Chat'),
        ('group', 'Group Chat'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    session_type = models.CharField(max_length=10, choices=SESSION_TYPES, default='single')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True)
    job_description = models.ForeignKey(JobDescription, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or f"Chat #{self.id}"

    class Meta:
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    """Individual message in a chat session."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

    class Meta:
        ordering = ['created_at']
