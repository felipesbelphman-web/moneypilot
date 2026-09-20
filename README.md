# MoneyPilot

## An AI-Assisted Financial Management Platform

MoneyPilot is a personal finance platform designed to help people understand their spending, organize their financial life, and create practical plans for goals such as buying a home, traveling, studying, getting married, or starting a family.

The project combines product design, financial data visualization, business intelligence, secure data management, and AI-assisted guidance in a responsive and accessible web experience.

> MoneyPilot transforms financial data into clear, actionable guidance.

---

## Table of Contents

* [Project Overview](#project-overview)
* [The Problem](#the-problem)
* [The Solution](#the-solution)
* [Core Features](#core-features)
* [My Role](#my-role)
* [Product Structure](#product-structure)
* [Design Process](#design-process)
* [Main Challenge](#main-challenge)
* [How I Solved It](#how-i-solved-it)
* [Technical Decisions](#technical-decisions)
* [Technology Stack](#technology-stack)
* [Project Architecture](#project-architecture)
* [Security and Data Protection](#security-and-data-protection)
* [Testing and Validation](#testing-and-validation)
* [Development Roadmap](#development-roadmap)
* [What I Learned](#what-i-learned)
* [Current Status](#current-status)
* [Author](#author)

---

## Project Overview

**Project type:** Personal product
**My role:** Product Designer and Front-End Developer
**Status:** In active development
**Primary focus:** Personal finance, financial goals, data visualization, and AI-assisted insights

MoneyPilot was created as an end-to-end product, covering product strategy, interface design, component architecture, financial-data management, localization, accessibility, database security, and automated testing.

The platform is designed to make personal finance easier to understand by connecting financial activity with visual summaries, budgets, goals, investments, and personalized guidance.

---

## The Problem

Traditional banking applications show balances and transactions, but they do not always help users understand what their financial data means.

People can see where their money went, but they may still struggle to answer important questions:

* How much am I actually saving each month?
* Which spending categories are affecting my budget?
* Am I making progress toward my financial goals?
* How are my income and expenses changing?
* What financial actions should I prioritize next?
* How can I transform a personal goal into a realistic financial plan?

This creates a gap between having access to financial data and being able to make informed decisions with it.

---

## The Solution

MoneyPilot brings transactions, budgets, financial goals, investments, and personalized insights into one unified experience.

Instead of displaying disconnected numbers, the platform organizes financial data into visual summaries that help users understand their current situation and take practical next steps.

The initial version does not depend on direct bank connectivity. Users can import transactions through CSV files, allowing the core financial experience to be developed and validated before introducing banking integrations.

This approach keeps the MVP focused on the primary value of the product:

> Helping users understand and improve their financial lives.

---

## Core Features

### Financial Dashboard

* Monthly financial overview
* Income and expense summaries
* Current balance visualization
* Net cash-flow tracking
* Spending-category analysis
* Financial-goal progress
* Period and month selection
* Animated financial indicators

### Transactions

* Transaction history
* Income and expense records
* Spending categories
* Search and filtering
* CSV transaction-import workflow
* Transaction-selection controls
* Financial-data validation

### Budgets

* Budget organization
* Category-based spending limits
* Budget-progress visualization
* Planned and actual spending comparison

### Financial Goals

* Personal savings goals
* Goal-progress monitoring
* Target values and deadlines
* Visual progress indicators
* Goal-oriented financial planning

### Investments

* Investment overview
* Portfolio organization
* Financial-performance visualization
* Investment-related summaries

### AI Insights

* Personalized financial observations
* Spending-behavior explanations
* Financial summaries
* Goal-oriented recommendations
* Future conversational assistant experience

### Product Experience

* Day and Night themes
* Seven-language interface
* Multi-currency support
* Responsive desktop and mobile layouts
* Accessible keyboard interactions
* Reusable system states
* Secure authentication
* Protected financial data

---

## My Role

I am responsible for the complete MoneyPilot product experience, from the original idea to design and implementation.

My responsibilities include:

* Defining the product vision
* Planning the MVP
* Researching financial-management experiences
* Identifying user problems and product opportunities
* Mapping user flows and information architecture
* Designing the interface in Figma
* Creating and maintaining the design system
* Developing reusable React components
* Implementing the application with Next.js and TypeScript
* Creating responsive Day and Night experiences
* Implementing localization and currency support
* Integrating the front end with Supabase
* Defining financial-data contracts and validation
* Protecting user data through Row Level Security
* Testing responsiveness, accessibility, data integrity, and permissions
* Documenting technical and product decisions

---

## Product Structure

MoneyPilot is organized into seven primary product areas:

1. **Dashboard**
   Provides a visual summary of the user’s financial situation.

2. **Transactions**
   Organizes income, expenses, categories, history, and CSV imports.

3. **Budgets**
   Helps users define spending limits and monitor budget performance.

4. **AI Insights**
   Transforms financial activity into personalized observations and guidance.

5. **Goals**
   Helps users plan and monitor savings goals.

6. **Investments**
   Provides an organized view of investment information and performance.

7. **Settings**
   Centralizes account, currency, language, appearance, and financial preferences.

A shared application shell keeps navigation, spacing, layout behavior, and accessibility consistent across every product area.

---

## Design Process

### 1. Research and Product Definition

The project began by identifying a common limitation in personal finance products: users can access financial data, but they do not always receive clear explanations or actionable next steps.

From this research, the MVP was organized around four essential user needs:

1. Understand current financial activity
2. Control spending
3. Plan personal goals
4. Receive useful financial guidance

### 2. Information Architecture

The application was divided into focused financial modules while maintaining a shared navigation system and consistent interface structure.

This makes the product easier to understand and allows each module to evolve independently.

### 3. Wireframes and User Flows

The main user journeys were mapped before implementation, including:

* Account creation
* Authentication
* Dashboard navigation
* Transaction management
* CSV import
* Budget monitoring
* Goal creation
* Investment visualization
* Financial settings

### 4. Visual Design

The interface was designed in Figma using reusable visual foundations:

* Typography
* Colors
* Spacing
* Borders
* Shadows
* Cards
* Buttons
* Inputs
* Navigation states
* Feedback states
* Financial charts
* Responsive behavior

### 5. Day and Night Themes

Day and Night modes were designed as complete visual experiences instead of applying a simple color inversion.

Each mode has its own carefully defined:

* Background colors
* Surface colors
* Borders
* Text hierarchy
* Financial-status colors
* Interactive states
* Chart treatments

### 6. Implementation and Validation

The approved designs were translated into reusable React components and validated across desktop and mobile resolutions.

The implementation process includes continuous checks for:

* Visual consistency
* Responsive behavior
* Keyboard navigation
* Focus management
* Data validation
* Database permissions
* Automated tests

---

## Main Challenge

The primary challenge was maintaining a consistent product experience across multiple financial modules, themes, languages, currencies, system states, and screen sizes.

Each area presents different types of information, but the complete application still needs to feel like one connected and reliable financial product.

The project also handles sensitive user information, making security, ownership validation, and database integrity essential parts of the experience.

---

## How I Solved It

I created a shared and reusable application structure with:

* A centralized application shell
* A responsive desktop sidebar
* Consistent page containers
* Shared spacing and typography rules
* Reusable cards and controls
* Standard modal behavior
* Reusable loading, empty, error, and import states
* Theme-specific design tokens
* Centralized localization
* Centralized currency management
* Shared financial-data contracts
* Database-level ownership validation
* Automated security and behavior tests

This architecture reduces duplication, improves consistency, and makes the product easier to maintain and expand.

---

## Technical Decisions

### Next.js App Router

The application uses the Next.js App Router to organize routes, layouts, shared experiences, and server-related functionality.

### Reusable Component Architecture

The interface is divided into reusable components so that shared patterns can evolve consistently across the entire product.

### CSV Import Before Bank Integration

CSV import was selected for the MVP so users can work with real financial information without requiring a banking API during the initial validation stage.

This reduces technical dependency while preserving the primary value of the product.

### Centralized Application Providers

Currency, localization, and theme behavior are managed centrally to prevent inconsistent formatting and duplicated logic.

### Database-Level Security

Security is not handled only by the interface. Financial records are also protected at the database level using ownership rules, constraints, validation, and Row Level Security.

### Progressive Financial Intelligence

Financial intelligence will be implemented progressively, beginning with deterministic calculations and summaries before introducing AI-generated guidance.

This makes the product easier to validate and reduces the risk of unreliable financial responses.

---

## Technology Stack

### Front End

* Next.js
* React
* TypeScript
* Tailwind CSS
* CSS
* HTML
* React Icons

### Product Design

* Figma
* Responsive design
* Design systems
* UI/UX design
* Prototyping
* Accessibility

### Backend and Database

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security
* Database migrations

### Quality and Development

* Git
* GitHub
* ESLint
* TypeScript validation
* Unit testing
* Integration testing
* Permission testing
* Responsive testing

---

## Project Architecture

MoneyPilot follows the Next.js App Router structure and separates route-level experiences, reusable interface components, shared application state, data-access logic, and automated tests.

```text
moneypilot/
│
├── public/
│   └── moneypilot/
│       ├── icons/
│       ├── illustrations/
│       ├── authentication/
│       ├── dashboard/
│       └── shared/
│
├── src/
│   ├── app/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── insights/
│   │   ├── goals/
│   │   ├── investments/
│   │   ├── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── authentication/
│   │   ├── dashboard/
│   │   ├── navigation/
│   │   ├── transactions/
│   │   ├── system-states/
│   │   └── ui/
│   │
│   ├── contexts/
│   │   ├── currency/
│   │   ├── localization/
│   │   └── theme/
│   │
│   ├── lib/
│   │   ├── contracts/
│   │   ├── mappers/
│   │   ├── supabase/
│   │   └── validation/
│   │
│   ├── services/
│   ├── types/
│   └── tests/
│
├── supabase/
│   └── migrations/
│
├── README.md
├── package.json
└── tsconfig.json
```

### Architecture Principles

* **Route separation:** each financial module has its own route and responsibilities.
* **Reusable components:** shared interface patterns reduce duplication across the application.
* **Centralized providers:** currency, localization, and theme behavior remain consistent throughout the product.
* **Protected data access:** contracts, validation, mappers, and database policies help enforce financial-data integrity.
* **Scalable assets:** visual resources are organized by product area and usage.
* **Automated validation:** tests cover interface behavior, financial operations, and database security.

---

## Security and Data Protection

MoneyPilot handles financial information, so security is treated as a core product requirement.

The current security architecture includes:

* Supabase authentication
* Protected application routes
* Row Level Security policies
* User-ownership validation
* Isolated financial records
* Database constraints
* Validated transaction operations
* Sanitized database errors
* Protected account-balance settings
* Controlled financial-data access
* Remote permission testing

Each user is allowed to access only the financial records associated with their authenticated account.

Sensitive credentials and environment variables must never be committed to the repository.

---

## Testing and Validation

The project currently includes:

* **530 passing local tests**
* **34 passing remote Row Level Security tests**
* Ownership validation across financial operations
* Database-integrity testing
* Authentication-flow validation
* Sanitized error testing
* Responsive desktop and mobile validation
* Layout testing at multiple resolutions
* Keyboard interaction validation
* Focus-management validation
* Component-behavior testing
* Localization verification
* URL and modal-state testing

The interface has been reviewed at desktop and mobile resolutions, including:

* 1440 × 1024
* 1366 × 768
* 390 × 844

---

## Development Roadmap

MoneyPilot is being developed incrementally, beginning with the product experience and progressing toward secure financial-data management, intelligent insights, and production readiness.

### Phase 1 — Product Interface

* [x] Marketing landing page
* [x] Responsive mobile landing experience
* [x] Financial preview cards
* [x] Dashboard animations
* [x] Account creation interface
* [x] Login interface
* [x] Forgot-password flow
* [x] Email-verification interface
* [x] Password-reset interface
* [x] Day and Night themes
* [x] Responsive desktop and mobile layouts
* [x] Shared application shell and navigation
* [x] Seven-language interface
* [x] Multi-currency support

### Phase 2 — Authentication

* [x] Supabase integration
* [x] User registration
* [x] Login sessions
* [x] Password recovery
* [x] Email verification
* [x] Protected application routes
* [ ] Google authentication
* [ ] Additional social authentication providers

### Phase 3 — Financial Data

* [x] User financial account settings
* [x] Income and expense records
* [x] Transaction management
* [x] Transaction history
* [x] Spending categories
* [x] CSV transaction-import flow
* [x] Real dashboard data integration
* [ ] Complete budget-management workflow
* [ ] Complete financial-goal workflow
* [ ] Complete investment-management workflow
* [ ] Expanded CSV validation and bank-format support

### Phase 4 — Security and Testing

* [x] Supabase Row Level Security
* [x] User-data ownership enforcement
* [x] Financial-data isolation
* [x] Database-integrity constraints
* [x] Input validation
* [x] Sanitized database errors
* [x] Authentication-flow testing
* [x] Remote permission and RLS testing
* [x] Automated unit and integration tests
* [ ] Independent production security review
* [ ] Expanded end-to-end browser testing

### Phase 5 — Financial Intelligence

* [ ] Financial-data analysis engine
* [ ] Spending-pattern detection
* [ ] Cash-flow calculations
* [ ] Automated monthly summaries
* [ ] Financial-health indicators
* [ ] Data-processing utilities
* [ ] Forecasting and scenario simulation

### Phase 6 — AI Financial Insights

* [ ] AI-service integration
* [ ] Personalized financial observations
* [ ] Spending-behavior explanations
* [ ] Goal recommendations
* [ ] Context-aware financial guidance
* [ ] Conversational financial-assistant experience
* [ ] AI safety rules and response validation

### Phase 7 — Production Readiness

* [ ] Complete accessibility audit
* [ ] Performance optimization
* [ ] End-to-end product validation
* [ ] Production security audit
* [ ] Privacy and data-retention review
* [ ] Monitoring and error reporting
* [ ] Production deployment
* [ ] Initial user-feedback cycle

---

## What I Learned

MoneyPilot has strengthened my ability to think beyond individual screens and approach development from a complete product perspective.

Through this project, I improved my skills in:

* Product thinking
* Financial-data visualization
* Design-system consistency
* Information architecture
* React component architecture
* Responsive interface development
* Accessibility
* Localization
* Multi-currency formatting
* Database security
* Row Level Security
* Financial-data integrity
* Automated testing
* Connecting business requirements with technical decisions

The project has also helped me understand how product design, engineering, security, and business intelligence work together inside a real financial application.

---

## Project Highlights

* Designed and developed as an end-to-end product
* Complete Day and Night experiences
* Seven-language support
* Multi-currency interface
* Responsive desktop and mobile layouts
* Reusable application shell
* Shared component system
* Secure financial-data architecture
* CSV transaction-import workflow
* More than 500 passing automated tests
* Remote database-permission validation
* Product design created in Figma
* Implementation built with Next.js and TypeScript

---

## Current Status

MoneyPilot is currently in active development.

The next stages include:

* Completing budget, goal, and investment workflows
* Improving CSV import compatibility
* Building deterministic financial analysis
* Introducing safe AI-assisted insights
* Conducting complete accessibility and security audits
* Validating the experience with initial users
* Preparing the application for production deployment

---

## Author

Designed and developed by **Felipe S. Belphman**.

* GitHub: [felipesbelphman-web](https://github.com/felipesbelphman-web)
* Location: Dublin, Ireland

---

## Important Notice

MoneyPilot is an educational and personal financial-management project.

The platform does not provide regulated financial, investment, tax, or legal advice. AI-assisted insights must be treated as informational guidance and should not replace advice from a qualified professional.
