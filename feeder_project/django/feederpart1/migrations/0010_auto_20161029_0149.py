# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-28 20:19
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feederpart1', '0009_auto_20161029_0116'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feedbackform',
            name='name',
            field=models.CharField(max_length=50),
        ),
    ]
