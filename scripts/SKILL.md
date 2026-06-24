---
name: thai-snake-classifier-demo
description: Demo web application for Thai Snake Image Classification with Expert Data Validation (HITL). Frontend Next.js demo with mock data. Based on thesis by Korawit Thipmonthian, NRRU CS 2569.
---

# 🐍 Thai Snake AI Classifier — SKILL Reference

## Project
- Researcher: กรวิชญ์ ทิพมนเทียน (Korawit Thipmonthian)
- University: มหาวิทยาลัยราชภัฏนครศรีธรรมราช (NRRU)
- Stack: Next.js + TypeScript + Tailwind CSS + Framer Motion + Three.js + Recharts
- Deploy: Vercel

## File Structure
```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout
  page.tsx              # Landing
  predict/page.tsx      # AI classification
  snakes/page.tsx       # Snake gallery
  snakes/[id]/page.tsx  # Snake detail
  expert/page.tsx       # Expert dashboard
  expert/annotate/[id]  # Annotation tool
  admin/page.tsx        # Admin dashboard
  login/page.tsx        # Mock login
components/
  layout/               # Navbar, Footer
  ui/                   # GlassCard, Badge, DangerBar, Button
  home/                 # HeroSection, Features, Stats, SpeciesStrip, CTA
lib/
  types.ts              # TypeScript interfaces
  data.ts               # Mock data (7 snakes, images, experts, stats)
  utils.ts              # Helpers
```

## Mock Credentials
- Expert: expert@snake.ai / demo1234
- Admin: admin@snake.ai / admin1234

## Snake Species (QSMI Reference)
7 medically important venomous snakes of Thailand.
Neurotoxic: งูเห่าไทย, งูจงอาง, งูสามเหลี่ยม, งูทับสมิงคลา
Hemotoxic: งูกะปะ, งูแมวเซา, งูเขียวหางไหม้

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Framework: Next.js (auto-detected)
4. No env vars needed (all mock data)
