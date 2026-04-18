#!/bin/bash
cd /Users/hemantrawat/Documents/LMS/lms-frontend
git add -A
git commit -m "fix: TopBar crash, missing icons, exam filter bugs

- Safe-access user.first_name/last_name in TopBar and SchoolTopbar to
  prevent crash when fields are empty strings
- Add Bell and Award icons to school sidebar iconMap
- Pass academic year ID to useClasses() in admin exams page
- Fix all filter handlers across admin exams, teacher exams, and
  admin gradebook to reset state to empty instead of passing literal all

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
