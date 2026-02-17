# LeadFlow CRM 🚀

**The Intelligent Customer Relationship Management System**

LeadFlow CRM is a modern, data-driven CRM designed to help sales teams manage leads, track pipelines, and close deals faster. Built with Next.js 15, Tailwind CSS v4, and Firebase, it combines a sleek, responsive UI with powerful features like AI lead scoring and real-time analytics.

---

## 🎯 Purpose

The primary purpose of LeadFlow CRM is to **streamline the sales process** for small to medium-sized businesses. It eliminates the chaos of spreadsheets and disjointed tools by providing a centralized hub where:
-   **Sales Reps** can focus on selling, with clear visibility into their daily tasks and active leads.
-   **Managers/Admins** can monitor team performance, optimize pipelines, and make data-backed decisions.
-   **Businesses** can ensure no lead falls through the cracks, maximizing revenue potential.

---

## 🛠️ Functionality & Features

LeadFlow CRM offers a comprehensive suite of tools to manage the entire sales lifecycle.

### 1. **Pipeline Management**
-   **Kanban Board**: A visual drag-and-drop interface to move leads through customizable stages (e.g., New, Qualified, Negotiation, Won).
-   **Stage Customization**: Admins can define custom pipeline stages with unique colors to match their specific sales process.

### 2. **Smart Lead Management**
-   **Centralized Database**: Store and manage all lead information in one searchable, filterable list.
-   **AI Lead Scoring**: Automatically scores leads significantly (0-100) based on data quality and engagement, helping reps prioritize high-value prospects.
-   **Import/Export**: Easily bulk import leads via CSV or export data for reporting.

### 3. **Activity Tracking & Follow-ups**
-   **Task Scheduling**: Schedule calls, meetings, and emails directly on a lead's profile.
-   **Smart Reminders**: The system flags overdue tasks and highlights today's agenda, ensuring reps never miss a follow-up.
-   **Activity Logging**: A complete history of every interaction (calls logged, emails sent, notes taken) is maintained for each lead.

### 4. **Email Integration**
-   **Templates**: Create reusable email templates for common scenarios (Intro, Follow-up, Closing).
-   **Direct Sending**: Send emails directly from the lead profile.
-   **Logging**: Sent emails are automatically logged to the lead's activity history.

### 5. **Analytics & Reporting**
-   **Real-time Dashboard**: Visual charts showing Revenue, Pipeline Value, Conversion Rates, and Task Completion status.
-   **Performance Tracking**:
    -   **Admin View**: Company-wide overview + Top Performers leaderboard.
    -   **Rep View**: Personal performance stats and individual task lists.

### 6. **Role-Based Access Control (RBAC)**
-   **Admin Role**: Full access to all data, settings, user management, and sensitive configurations.
-   **Sales Rep Role**: Restricted access to their own assigned leads and tasks, ensuring data privacy and focus.

---

## 💻 Tech Stack

-   **Frontend Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS v4 (with custom design system)
-   **Backend / Database**: Firebase (Auth, Firestore, Storage)
-   **Hosting**: Vercel 

---


5.  **First-Time Admin Setup**
    -   Sign up for a new account at `/signup`.
    -   Go to your Firebase Console -> Firestore -> `users` collection.
    -   Find your user document and manually change the `role` field from `"rep"` to `"admin"`.
    -   Refresh the application to access Admin features.

---

## 📂 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── dashboard/       # Protected dashboard routes (Leads, Pipeline, etc.)
│   ├── login/           # Authentication pages
│   └── ...
├── components/          # Reusable UI components
├── lib/                 # Utilities, Firebase config, helpers
│   ├── firebase.ts      # Firebase initialization
│   ├── firestore.ts     # Database interaction functions
│   └── ...
├── types/               # TypeScript type definitions
└── ...
```

---

## 🤝 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

---

© 2026 LeadFlow CRM. All rights reserved.
