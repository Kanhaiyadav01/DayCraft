# ✏️ DayCraft — A Cozy Handwritten Productivity Companion

<p align="center">
  <strong>Focus timer · Quick notes · Fullscreen clock · Checklist · 8 hand-drawn themes</strong>
</p>

---

## 🎯 What is DayCraft?

DayCraft is a **notebook-themed productivity web app** that combines focus timers, quick notes, a fullscreen clock, checklist, and a hand-drawn aesthetic. It helps you track your time, organize tasks, take notes, and visualize your focus history in a warm, handwritten interface.

Built with **TanStack Start** (React SSR), **Supabase** (auth + Postgres), **Tailwind CSS v4**, and **Zustand** for state management.

---

## ✨ Features

### 🔥 Focus Mode

- **Preset sessions**: Pomodoro (25m), Deep Work (50m), Ultra Focus (90m), Study Sprint (30m).
- **Immersive fullscreen** countdown with progress tracking and motivational quote.

### ⏱️ Timer & Stopwatch

- **Countdown timer** with customizable durations.
- **Centisecond precision stopwatch** with lap tracking.
- **Alarm sounds**: Web Audio API-synthesized sound alerts that stop automatically.

### 📝 Quick Notes

- **Create, edit, delete** sticky notes with title, body, and tags.
- **6 paper colors**: Paper, Mint, Coral, Sky, Tape, Highlight.
- **Pin notes** to the top and search by text.

### ✅ Today's Goals & Daily Planning

- **Daily task checklist** embedded directly in the dashboard and goals view.
- **Real-time updates** for consistent day planning.

### 📊 Analytics

- **Visual productivity metrics** representing your focus sessions and tracked intervals.

### ⏰ Fullscreen Clock

- Dedicated distraction-free **fullscreen clock** supporting 12h/24h formats and theme-adaptive colors.

### 🎨 8 Hand-Drawn Themes

- Theme configurations adapting colors, borders, and margins to different notebook styles: Classic, Midnight, Sakura, Kyoto Matcha, Lavender Dreams, Ocean Breeze, Forest Cabin, Sunset Sketch.

---

## 🏗️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Rename `.env.example` to `.env` and fill in your Supabase variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Locally

```bash
npm run dev
```
