# Sprint 1 Review – SmartShooter

**Sprint Goal 🎯**  
Deliver a deployed MVP shell with Firebase integration and first working feature (log basketball training session).

---

## ✅ Achievements
- Repo initialized with Vite + TypeScript + Tailwind + shadcn
- Firebase configured (Web App, SDK, envs)
- Anonymous sign-in wired via AppProviders
- Firestore connected with rules v1
- Firebase Hosting set up — app deployed at [smartshooter-react.web.app](https://smartshooter-react.web.app)
- Log Session Form built with React Hook Form + Zod validation

---

## 📺 Demo
- Open app → anonymous sign-in → fill form → save session
- Firestore → new `sessions` document with totals + validation

---

## 👍 What Went Well
- Smooth setup of tooling + Firebase
- Early validation: confirmed rules prevent invalid data
- Deployment cycle working (build → deploy → live)

---

## 🔧 What Could Be Improved
- Documentation (README expanded)
- Git hooks skipped for now
- UI minimal — no session listing yet

---

## 📌 Next Sprint (Sprint 2)
- Build Sessions List view (query Firestore)
- Add Edit/Delete sessions
- UI polish (shadcn, dark mode)
- Finalize developer docs
