from django import forms
from datetime import datetime, date, time
# from .models import Student

class ContactForm(forms.Form):
	user_name = forms.CharField(max_length=50,required=True)
	user_password = forms.CharField(widget = forms.PasswordInput(),required=True)

class StudentLoginForm(forms.Form):
	rollno = forms.CharField(max_length=50,required=True)
	password = forms.CharField(widget = forms.PasswordInput(),required=True)

class RegisterForm(forms.Form):
	username = forms.CharField(max_length=50,required=True)
	email = forms.CharField(max_length=50,required=True)
	password = forms.CharField(widget = forms.PasswordInput(),required=True)
	re_password = forms.CharField(widget = forms.PasswordInput(),required=True)

class AdminForm(forms.Form):
	admin_name = forms.CharField(max_length=50,required=True)
	admin_password = forms.CharField(widget = forms.PasswordInput(),required=True)

class AddCourseForm(forms.Form):
	name = forms.CharField(max_length=50,required=True)
	code = forms.CharField(max_length=10,required=True)

class AddFeedbackForm(forms.Form):
	coursecode = forms.CharField(max_length=10,required=True)
	feedbackname = forms.CharField(max_length=20,required=True)
	# feedbackdeadline = forms.DateTimeField()
	
class AddQuestionForm(forms.Form):
	Qtext = forms.CharField(max_length=500,required=True)

class AddAssignmentForm(forms.Form):
	coursecode = forms.CharField(max_length=10,required=True)
	assignmentname = forms.CharField(max_length=50,required=True)
	assignmentdeadline = forms.CharField(max_length=50,required=True)#forms.DateTimeField(required=True, input_formats=['%d/%m/%Y %H:%M'])