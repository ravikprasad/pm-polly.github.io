# PM Polly – Project Management Feedback Portal

A mobile-responsive, static feedback website for collecting peer evaluations of **6 project management case study presentations**. Students rate each presentation on three criteria (score 1–10), and results are aggregated in real time.

---

## Features

- 📱 **Mobile-first responsive** design – works on phones, tablets, and laptops
- 🗂️ **6 case studies** – each with its own feedback card and direct link
- ⭐ **3 rating criteria per case study** (1–10 scale):
  - 🎤 Overall Presentation
  - 📋 Content
  - 🤝 Group Participation
- 📊 **Results dashboard** – per-case averages with bar charts and a full submissions table
- 📥 **CSV export** of all collected data
- 🔗 **Google Sheets backend** (optional) – automatically stores every submission in a Google Sheet

---

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/index.html` | Landing page with case study cards |
| Feedback | `/feedback.html` | Submit ratings for a case study |
| Results | `/results.html` | View aggregated averages and all submissions |

---

## Quick Start (GitHub Pages)

1. Fork or clone this repository.
2. Push to a branch named `gh-pages` (or enable GitHub Pages on `main` in repo settings).
3. Visit `https://<your-username>.github.io/<repo-name>/`.

No build step required – it is pure HTML, CSS, and vanilla JavaScript.

---

## Customising Case Studies

Edit the `CASE_STUDIES` array in `js/app.js`:

```js
const CASE_STUDIES = [
  { id: 1, title: 'Your Title Here', team: 'Group Name', description: 'Short description.' },
  // …
];
```

---

## Backend Setup – Google Sheets (Recommended)

By default, submissions are stored in **browser localStorage** (per device). To collect all 40 students' responses centrally, connect the Google Apps Script backend:

### Steps

1. Go to [script.google.com](https://script.google.com) and create a **new project**.
2. Paste the contents of `apps-script/Code.gs` into the editor.
3. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and copy the **Web App URL**.
5. Open `js/app.js` and replace the placeholder:
   ```js
   APPS_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
   ```
   with your copied URL.
6. Push the change to GitHub. Done!

Every submission now lands in a Google Sheet called **"PM Polly Responses"** in your Google Drive, with columns for timestamp, student name, case study, and all three ratings.

---

## Project Structure

```
pm-polly.github.io/
├── index.html          # Landing page
├── feedback.html       # Feedback form
├── results.html        # Results dashboard
├── css/
│   └── style.css       # All styles (mobile-first)
├── js/
│   └── app.js          # All JavaScript logic + case study data
└── apps-script/
    └── Code.gs         # Google Apps Script backend
```

---

## Rating Scale Guide

| Score | Meaning |
|-------|---------|
| 1–3 | Poor |
| 4–6 | Average |
| 7–8 | Good |
| 9–10 | Excellent / Outstanding |
