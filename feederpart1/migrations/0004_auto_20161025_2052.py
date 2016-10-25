# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-25 15:22
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feederpart1', '0003_auto_20161024_2039'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('code', models.CharField(max_length=3)),
            ],
        ),
        migrations.CreateModel(
            name='Instructor',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=50)),
                ('fullname', models.CharField(max_length=50)),
                ('instiname', models.CharField(max_length=50)),
                ('password', models.CharField(max_length=20)),
                ('email', models.CharField(max_length=50)),
            ],
        ),
        migrations.RemoveField(
            model_name='student',
            name='email',
        ),
        migrations.RemoveField(
            model_name='student',
            name='fullname',
        ),
        migrations.RemoveField(
            model_name='student',
            name='instiname',
        ),
        migrations.AddField(
            model_name='student',
            name='courses',
            field=models.ManyToManyField(to='feederpart1.Course'),
        ),
    ]
