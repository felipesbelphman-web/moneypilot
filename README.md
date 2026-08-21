<div align="center">

<img src="./public/moneypilot/moneypilot-logo.svg" alt="MoneyPilot Logo" width="240" />

# MoneyPilot

### Personal Finance Assistant

A modern and responsive personal finance web application designed to help users understand their money, organize financial goals, and build better financial habits.

Built with **Next.js, React, TypeScript and Tailwind CSS**, with **Python, Supabase and AI-powered financial insights planned for future development**.

</div>

---

## Overview

MoneyPilot is a personal finance application focused on making financial management simple, visual and accessible.

The project is being designed as a complete financial experience where users will be able to track income and expenses, visualize spending patterns, create savings goals and receive intelligent financial insights.

The current development phase includes a responsive landing page, animated financial dashboard previews and a complete authentication user interface for desktop and mobile.

---

## Current Features

- Responsive landing page
- Desktop and mobile layouts
- Animated financial dashboard preview
- Income visualization
- Expense visualization
- Net balance visualization
- Spending categories chart
- Financial goal progress visualization
- Create account interface
- Login interface
- Forgot password flow
- Email verification screen
- Reset password screen
- Password visibility controls
- Password strength indicator
- Responsive 440px mobile design system
- Reduced-motion accessibility support
- Reusable React animation components

---

## Authentication Experience

MoneyPilot currently includes the complete visual authentication flow:

```text
Create Account
      ↓
Login
      ↓
Forgot Password
      ↓
Verify Email
      ↓
Create New Password
```

The authentication UI is complete for both desktop and mobile.

Real authentication and user sessions will be implemented with **Supabase Auth** in a future development phase.

---

## Financial Dashboard Preview

The landing experience introduces users to the core MoneyPilot financial concepts through animated cards:

- Overview
- Income
- Expenses
- Net Balance
- Spending by Category
- Financial Goals

These components currently work as interactive visual previews of the future authenticated dashboard.

---

## Tech Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Next.js App Router
- Next/Image

### Development

- Visual Studio Code
- Git
- GitHub
- ESLint
- Figma

### Planned Technologies

- Supabase
- PostgreSQL
- Python
- OpenAI API

Python is planned for future financial analysis, automation and data-processing features.

---

## Design & UX

MoneyPilot was designed with a strong focus on financial clarity, accessibility and responsive behavior.

The interface includes:

- Custom financial dashboard components
- Goal-oriented visual storytelling
- Responsive desktop and mobile experiences
- Animated financial indicators
- Consistent design tokens
- Accessible reduced-motion behavior
- Dedicated authentication experiences
- Mobile layouts based on a 440px design canvas

The interface is designed in **Figma** and implemented manually with React, TypeScript and Tailwind CSS.

---

## Project Architecture

```text
moneypilot/
│
├── public/
│   └── moneypilot/
│       ├── icons
│       ├── illustrations
│       ├── authentication assets
│       └── dashboard assets
│
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   └── components/
│       ├── AnimatedBalanceValues.tsx
│       ├── AnimatedExpenseCategories.tsx
│       ├── AnimatedExpenseTotalChart.tsx
│       ├── AnimatedGoalGauge.tsx
│       ├── AnimatedIncomeChart.tsx
│       ├── AnimatedOverviewChart.tsx
│       ├── MobileScaleCanvas.tsx
│       ├── MoneyPilotMobileAuth.tsx
│       └── MoneyPilotMobileHome.tsx
│
└── README.md
```

---

## Development Roadmap

### Phase 1 — Interface

- [x] Landing page
- [x] Responsive mobile landing
- [x] Financial preview cards
- [x] Dashboard animations
- [x] Create account screen
- [x] Login screen
- [x] Forgot password screen
- [x] Verify email screen
- [x] Reset password screen

### Phase 2 — Authentication

- [ ] Supabase integration
- [ ] User registration
- [ ] Login sessions
- [ ] Password recovery
- [ ] Protected routes
- [ ] Google authentication

### Phase 3 — Financial Data

- [ ] User financial profile
- [ ] Income management
- [ ] Expense management
- [ ] Transaction history
- [ ] Spending categories
- [ ] Financial goals
- [ ] Real dashboard data

### Phase 4 — Security & Testing

- [ ] Supabase Row Level Security
- [ ] User data isolation
- [ ] Input validation
- [ ] Authentication security testing
- [ ] Permission testing
- [ ] Production security review

### Phase 5 — Python & Financial Intelligence

- [ ] Financial data analysis
- [ ] Spending pattern analysis
- [ ] Financial calculations
- [ ] Automated financial summaries
- [ ] Data-processing utilities

### Phase 6 — AI Financial Insights

- [ ] OpenAI API integration
- [ ] Personalized financial insights
- [ ] Spending observations
- [ ] Goal recommendations
- [ ] Financial assistant experience

### Phase 7 — Production

- [ ] Final accessibility audit
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## Project Status

> **Active Development**

The interface and authentication experience are currently under active development.

The next major phase will connect the application to a real backend and authentication system using Supabase.

---

## Quality Checks

Current project validation:

```text
ESLint        ✅ Passed
TypeScript    ✅ Passed
Next.js Build ✅ Passed
Responsive UI ✅ Implemented
GitHub        ✅ Version Controlled
```

---

## Learning Goals

MoneyPilot is also being developed as a practical software engineering project focused on strengthening real-world Front-End development skills, including:

- Component architecture
- Responsive design
- React state management
- TypeScript
- Next.js
- Accessibility
- Git and GitHub workflow
- Authentication
- Backend integration
- Application security
- Python integration
- AI-assisted financial features

---

## Author

**Felipe Belphman**

Front-End Developer focused on building modern, responsive and practical web applications.

---

<div align="center">

### MoneyPilot

**Plan better. Understand your money. Reach your goals.**

</div>