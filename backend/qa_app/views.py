# Clear only group chat history
def clear_group_chat(request):
	if 'group_chat' in request.session:
		del request.session['group_chat']
	if 'group_chat_created' in request.session:
		del request.session['group_chat_created']
	# Redirect to history page for immediate feedback
	return redirect('history')
# Reset system: delete all resumes, JDs, and chat histories
from .models import JobDescription
def reset_system(request):
	# Delete all resumes and their files
	for res in Resume.objects.all():
		if res.file:
			res.file.delete(save=False)
		res.delete()
	# Delete all job descriptions and their files
	for jd in JobDescription.objects.all():
		if jd.file:
			jd.file.delete(save=False)
		jd.delete()
	# Clear all chat histories and group chat
	keys_to_delete = [key for key in request.session.keys() if key.startswith('chat_') or key == 'group_chat' or key == 'group_chat_created']
	for key in keys_to_delete:
		del request.session[key]
	# Delete all files in bestfit folder
	import os
	bestfit_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'bestfit')
	if os.path.exists(bestfit_dir):
		for filename in os.listdir(bestfit_dir):
			file_path = os.path.join(bestfit_dir, filename)
			if os.path.isfile(file_path):
				os.remove(file_path)
	return redirect('upload_resume')
# Clear all uploaded resumes
from .models import Resume
def clear_resumes(request):
	Resume.objects.all().delete()
	return redirect('upload_resume')
from django.shortcuts import redirect

# Clear all chat histories from session
def clear_history(request):
	keys_to_delete = [key for key in request.session.keys() if key.startswith('chat_') or key == 'group_chat' or key == 'group_chat_created']
	for key in keys_to_delete:
		del request.session[key]
	return redirect('history')
from django.urls import reverse
# History view: show all chat histories
def history(request):
	histories = []
	group_chat = request.session.get('group_chat', [])
	if group_chat and len(group_chat) > 0:
		histories.append({
			'resume_id': None,
			'jd_id': None,
			'key': 'group_chat',
			'chat': group_chat,
			'candidate_name': 'All Best-Fit Candidates',
			'jd_title': '-',
		})
	from .models import Resume, JobDescription
	resumes = {str(r.id): r for r in Resume.objects.all()}
	jds = {str(j.id): j for j in JobDescription.objects.all()}
	import datetime
	for key in list(request.session.keys()):
		if key.startswith('chat_'):
			chat = request.session.get(key, [])
			# Defensive: Remove malformed chat keys from session
			valid_chat = False
			if isinstance(chat, list) and len(chat) > 0:
				for entry in chat:
					if isinstance(entry, dict) and (entry.get('question') or entry.get('answer')):
						valid_chat = True
						break
			if not valid_chat:
				del request.session[key]
				created_key = f'{key}_created'
				# Defensive: Only delete if key exists and avoid double '_created'
				if created_key.endswith('_created_created'):
					created_key = created_key.replace('_created_created', '_created')
				request.session.pop(created_key, None)
				continue
			# If chat is not a list, remove it
			elif not isinstance(chat, list):
				del request.session[key]
				created_key = f'{key}_created'
				if created_key in request.session:
					del request.session[created_key]
				continue
			# Parse key for resume and JD
			parts = key.split('_')
			resume_id = parts[1] if len(parts) > 1 else None
			jd_id = None
			if 'jd' in parts:
				jd_idx = parts.index('jd')
				jd_id = parts[jd_idx+1] if len(parts) > jd_idx+1 else None
			candidate_name = resumes.get(resume_id).candidate_name if resume_id and resume_id in resumes else 'Unknown'
			jd_title = jds.get(jd_id).title if jd_id and jd_id in jds else '-'
			# Get or set creation date
			created_key = f'{key}_created'
			created = request.session.get(created_key)
			if not created and chat:
				created = datetime.datetime.now().isoformat()
				request.session[created_key] = created
			histories.append({
				'resume_id': resume_id,
				'jd_id': jd_id,
				'key': key,
				'chat': chat,
				'candidate_name': candidate_name,
				'jd_title': jd_title,
				'created': created,
			})
	# Add group chat history if present
	return render(request, 'qa_app/history.html', {
		'histories': histories,
	})
from django.utils.http import urlsafe_base64_decode
# Group chat with all best-fit resumes
def group_chat(request):
	jd_id = request.GET.get('jd_id')
	resume_ids = request.GET.getlist('resume_ids')
	jd = None
	resumes = []
	if jd_id:
		try:
			jd = JobDescription.objects.get(id=jd_id)
			print(f"Found JD: {jd.text_content}")	
		except JobDescription.DoesNotExist:
			jd = None
	if resume_ids:
		resumes = Resume.objects.filter(id__in=resume_ids)
	form = QuestionForm()
	chat_history = request.session.get('group_chat', [])
	if request.method == 'POST':
		form = QuestionForm(request.POST)
		if form.is_valid() and jd and resumes:
			question = form.cleaned_data['question'].strip()
			# Combine all resumes' text
			combined_resume_text = '\n\n'.join([f"{r.candidate_name}:\n{r.text_content}" for r in resumes])
			# Prompt includes JD and all resumes
			context = f"JD:\n{jd.text_content}\n\nResumes:\n{combined_resume_text}"
			try:
				answer = ask_gemini(context, question)
			except Exception as e:
				answer = f"[Error from Gemini: {e}]"
			chat_history.append({'question': question, 'answer': answer})
			request.session['group_chat'] = chat_history
			return redirect(request.path + f'?jd_id={jd_id}' + ''.join([f'&resume_ids={rid}' for rid in resume_ids]))
	return render(request, 'qa_app/group_chat.html', {
		'jd': jd,
		'resumes': resumes,
		'form': form,
		'chat_history': chat_history,
	})


from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib import messages
from django.http import JsonResponse
from .models import Resume, JobDescription
from .forms import ResumeUploadForm, BulkResumeUploadForm, JobDescriptionForm, JDTextForm, QuestionForm
from .qa_engine import extract_text_from_pdf, split_into_chunks, embed_texts, retrieve_chunks, match_resumes_to_jd
from django.conf import settings
import shutil

# Bulk upload resumes
def bulk_upload_resumes(request):
	if request.GET.get('clear') == '1':
		# Delete all resumes and their files
		for res in Resume.objects.all():
			if res.file:
				res.file.delete(save=False)
			res.delete()
		messages.success(request, 'All uploaded resumes have been cleared.')
		return redirect('bulk_upload_resumes')
	if request.method == 'POST':
		form = BulkResumeUploadForm(request.POST, request.FILES)
		if form.is_valid():
			files = request.FILES.getlist('files')
			for f in files:
				# Try to extract candidate name from filename (before first dot or dash)
				name_guess = f.name.split('.')[0].replace('-', ' ').replace('_', ' ')
				resume = Resume(candidate_name=name_guess, file=f)
				try:
					text = extract_text_from_pdf(f)
					resume.text_content = text
					resume.save()
				except Exception as e:
					continue
			messages.success(request, f"Uploaded {len(files)} resumes.")
			return redirect('bulk_upload_resumes')
	else:
		form = BulkResumeUploadForm()
	# List all resumes for sidebar
	all_resumes = Resume.objects.order_by('-uploaded_at')
	return render(request, 'qa_app/bulk_upload.html', {'form': form, 'all_resumes': all_resumes})

# Upload JD (PDF or text)
def upload_jd(request):
	if request.method == 'POST':
		form = JobDescriptionForm(request.POST, request.FILES)
		text_form = JDTextForm(request.POST)
		if 'file' in request.FILES and form.is_valid():
			jd = form.save(commit=False)
			try:
				text = extract_text_from_pdf(request.FILES['file'])
				jd.text_content = text
				jd.save()
				messages.success(request, 'JD uploaded.')
				return redirect('upload_jd')
			except Exception as e:
				messages.error(request, f'Error processing JD PDF: {e}')
		elif text_form.is_valid():
			jd = JobDescription(
				title=text_form.cleaned_data['title'],
				text_content=text_form.cleaned_data['text_content']
			)
			jd.save()
			messages.success(request, 'JD text saved.')
			return redirect('upload_jd')
		else:
			messages.error(request, 'Invalid JD submission.')
	else:
		form = JobDescriptionForm()
		text_form = JDTextForm()
	return render(request, 'qa_app/upload_jd.html', {'form': form, 'text_form': text_form})

# Bestfit matching
def bestfit_candidates(request):
	# Use latest JD
	jd = JobDescription.objects.order_by('-uploaded_at').first()
	resumes = Resume.objects.all()
	best, all_results = [], []
	if jd and resumes:
		best, all_results = match_resumes_to_jd(jd.text_content, resumes, top_n=10, threshold=0.5)
		# Copy bestfit resumes to bestfit folder
		bestfit_dir = os.path.join(settings.BASE_DIR, 'bestfit')
		os.makedirs(bestfit_dir, exist_ok=True)
		for res in best:
			src = res.file.path
			dst = os.path.join(bestfit_dir, os.path.basename(res.file.name))
			if not os.path.exists(dst):
				shutil.copy2(src, dst)
	return render(request, 'qa_app/bestfit.html', {
		'jd': jd,
		'best': best,
		'all_results': all_results,
	})
from .gemini_api import ask_gemini
import os

def upload_resume(request):
	if request.method == 'POST':
		form = ResumeUploadForm(request.POST, request.FILES)
		if form.is_valid():
			resume = form.save(commit=False)
			try:
				text = extract_text_from_pdf(request.FILES['file'])
				if not text.strip():
					messages.error(request, 'No text found in PDF.')
					return render(request, 'qa_app/upload.html', {'form': form})
				resume.text_content = text
				resume.save()
				return redirect('chat', resume_id=resume.id)
			except Exception as e:
				messages.error(request, f'Error processing PDF: {e}')
		else:
			messages.error(request, 'Invalid form submission.')
	else:
		form = ResumeUploadForm()
	return render(request, 'qa_app/upload.html', {'form': form})

def chat(request, resume_id):
	resume = get_object_or_404(Resume, id=resume_id)
	form = QuestionForm()
	jd = None
	jd_id = request.GET.get('jd_id')
	print(f"JD ID from GET: {jd_id}")
	chat_key = f'chat_{resume_id}'
	if jd_id:
		try:
			from .models import JobDescription
			jd = JobDescription.objects.get(id=jd_id)
			print(f"Found JD: {jd.text_content}")
			chat_key = f'chat_{resume_id}_jd_{jd_id}'
		except JobDescription.DoesNotExist:
			jd = None
	# Handle delete chat actions
	if request.method == 'POST' and request.POST.get('delete_chat'):
		idx = request.POST.get('delete_idx')
		if idx == 'all':
			request.session[chat_key] = []
		else:
			chat_history = request.session.get(chat_key, [])
			try:
				idx = int(idx)
				chat_history.pop(idx)
				request.session[chat_key] = chat_history
			except Exception:
				pass
		return redirect(request.path + (f'?jd_id={jd_id}' if jd_id else ''))
	chat_history = request.session.get(chat_key, [])
	return render(request, 'qa_app/chat.html', {
		'resume': resume,
		'form': form,
		'chat_history': chat_history,
		'jd': jd,
		'jd_id': jd_id,
	})

def ask_question(request, resume_id):
	resume = get_object_or_404(Resume, id=resume_id)
	jd_id = request.POST.get('jd_id') or request.GET.get('jd_id')
	chat_key = f'chat_{resume_id}'
	if jd_id:
		chat_key = f'chat_{resume_id}_jd_{jd_id}'
	if request.method == 'POST':
		form = QuestionForm(request.POST)
		if form.is_valid():
			question = form.cleaned_data['question'].strip()
			if not question:
				if request.headers.get('x-requested-with') == 'XMLHttpRequest':
					return JsonResponse({'success': False, 'error': 'Please enter a question.'})
				messages.error(request, 'Please enter a question.')
				return redirect('chat', resume_id=resume_id)
			chunks = split_into_chunks(resume.text_content)
			chunk_embs = embed_texts(chunks)
			top_chunks = retrieve_chunks(question, chunks, chunk_embs, top_k=3)
			if jd_id:
				from .models import JobDescription
				try:
					jd = JobDescription.objects.get(id=jd_id)
					context = f"JD:\n{jd.text_content}\n\nResume:\n" + '\n'.join(top_chunks)
				except JobDescription.DoesNotExist:
					context = '\n'.join(top_chunks)
			else:
				context = '\n'.join(top_chunks)
			try:
				answer = ask_gemini(context, question)
			except Exception as e:
				answer = f"[Error from Gemini: {e}]"
			chat_history = request.session.get(chat_key, [])
			chat_history.append({'question': question, 'answer': answer})
			request.session[chat_key] = chat_history
			if request.headers.get('x-requested-with') == 'XMLHttpRequest':
				return JsonResponse({'success': True, 'question': question, 'answer': answer})
			# Preserve JD id in redirect
			return redirect(f'/chat/{resume_id}/' + (f'?jd_id={jd_id}' if jd_id else ''))
		else:
			if request.headers.get('x-requested-with') == 'XMLHttpRequest':
				return JsonResponse({'success': False, 'error': 'Invalid question.'})
			messages.error(request, 'Invalid question.')
	if request.headers.get('x-requested-with') == 'XMLHttpRequest':
		return JsonResponse({'success': False, 'error': 'Invalid request.'})
	return redirect(f'/chat/{resume_id}/' + (f'?jd_id={jd_id}' if jd_id else ''))
