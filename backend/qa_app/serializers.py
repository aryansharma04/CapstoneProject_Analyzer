from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Resume, JobDescription,
    SkillGapAnalysis, ChatSession, ChatMessage
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'avatar_url', 'company', 'bio']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')
    role = serializers.ChoiceField(choices=['hr', 'candidate'], default='candidate')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        role = validated_data.pop('role', 'candidate')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        # Update the auto-created profile with role
        user.profile.role = role
        user.profile.save()
        return user


class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ['id', 'candidate_name', 'file', 'file_url', 'uploaded_at', 'text_content']
        read_only_fields = ['id', 'uploaded_at', 'text_content', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ResumeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no text_content)."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ['id', 'candidate_name', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class JobDescriptionSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'file', 'file_url', 'text_content', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class JobDescriptionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class SkillGapAnalysisSerializer(serializers.ModelSerializer):
    resume_name = serializers.CharField(source='resume.candidate_name', read_only=True)
    jd_title = serializers.CharField(source='job_description.title', read_only=True)

    class Meta:
        model = SkillGapAnalysis
        fields = [
            'id', 'resume', 'job_description', 'resume_name', 'jd_title',
            'missing_skills', 'matching_skills', 'match_score',
            'summary', 'recommendations', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'missing_skills', 'matching_skills',
                           'match_score', 'summary', 'recommendations']


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'session_type', 'resume', 'job_description',
                  'title', 'created_at', 'updated_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for session lists."""
    message_count = serializers.SerializerMethodField()
    resume_name = serializers.CharField(source='resume.candidate_name', read_only=True, default=None)
    jd_title = serializers.CharField(source='job_description.title', read_only=True, default=None)

    class Meta:
        model = ChatSession
        fields = ['id', 'session_type', 'title', 'resume_name', 'jd_title',
                  'created_at', 'updated_at', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()
