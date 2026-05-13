from django import forms
from .models import Resume


class ResumeUploadForm(forms.ModelForm):
    class Meta:
        model = Resume
        fields = ['candidate_name', 'file']

class BulkResumeUploadForm(forms.Form):
    pass  # Use plain HTML input in template, handle files in view

from .models import JobDescription
class JobDescriptionForm(forms.ModelForm):
    class Meta:
        model = JobDescription
        fields = ['title', 'file']

class JDTextForm(forms.Form):
    title = forms.CharField(max_length=255)
    text_content = forms.CharField(widget=forms.Textarea(attrs={'rows': 6, 'class': 'form-control'}))

class QuestionForm(forms.Form):
    question = forms.CharField(
        widget=forms.Textarea(attrs={
            'placeholder': 'Ask a question about your resume...',
            'class': 'form-control',
            'rows': 2,
            'style': 'resize:vertical; min-height:38px; max-height:200px;'
        }),
        required=True
    )
