from django.db import models
from datetime import datetime    

# Create your models here.
class Student(models.Model):
	username=models.CharField(max_length=50)
	password=models.CharField(max_length=20)
	rollno=models.CharField(max_length=20, unique= True,default=True)
	def __str__(self):
		return self.username+':'+self.rollno[max(len(self.rollno)-3,0):len(self.rollno)]

class Assignment(models.Model):
	name=models.CharField(max_length=50)
	urllink=models.CharField(max_length=200, blank=True)
	deadline = models.DateTimeField(default=datetime.now, blank=True)
	def __str__(self):
		return self.name

class Response(models.Model):
	rating=models.CharField(max_length=50)
	# timestamp
	# student=models.OneToOne(Student) # so that one student can give feedback only once

class Question(models.Model):
	text=models.CharField(max_length=500)
	responses=models.ManyToManyField(Response,blank=True)
	def __str__(self):
		return self.text

class Feedbackform(models.Model):
	name=models.CharField(max_length=50)
	questions=models.ManyToManyField(Question,blank=True)
	deadline = models.DateTimeField(default=datetime.now, blank=True)
	def __str__(self):
		return self.name

class Course(models.Model):
	name=models.CharField(max_length=50)
	code=models.CharField(max_length=10, unique= True,)
	students=models.ManyToManyField(Student, blank=True)
	feedbackforms=models.ManyToManyField(Feedbackform,blank=True)
	assignments=models.ManyToManyField(Assignment,blank=True)
	def __str__(self):
		return self.name+' '+self.code

	##############################################################
	##########################   HOW TO ADD FEEDBACK 	##########
	##############################################################
	# f=feedbak(name='form1')
	# f.save()
	# q1=Question(text='Any Question ?')
	# q1.save()
	# q2 ...
	# q2 ...
	# f.questions.add(q1,q2,...)

	# # for all students
	# r=Response(rating=3)
	# r.save()
	# feedbak.questions.all()[0].responses.add(r)
	# len(list(feedbak.questions.all()[0].responses.filter(rating = 5))) //will give no of responses with 5
