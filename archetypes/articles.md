---
title: '{{ replace .File.ContentBaseName "-" " " | title }}'
date: '{{ .Date }}'
draft: true
description: ''
tags: []
# Use the same translationKey in the French and English versions.
translationKey: '{{ .File.ContentBaseName }}'
---
