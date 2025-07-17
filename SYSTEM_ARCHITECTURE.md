# Simplr Invoicing - Architecture Overview

## Executive Summary

This document outlines the architecture of the Simplr Invoicing application, a modern web-based platform designed to streamline the invoicing process for freelancers and small businesses. The system provides a user-friendly interface for managing clients, creating and sending professional invoices, and tracking payments.

## Business Context

The primary audience for Simplr Invoicing is small business owners and freelancers who require a simple, efficient, and reliable tool for managing their invoicing workflows. The key business goals are:

- To reduce the time and effort spent on creating and managing invoices.
- To provide a professional and customizable invoicing solution.
- To offer a seamless and intuitive user experience.
- To ensure data security and privacy.

## System Overview

Simplr Invoicing is a Single-Page Application (SPA) that provides a rich, interactive user experience. The application is designed with a "simplicity-first" approach, ensuring that all features are easy to use and understand.

### Core Philosophy

The core philosophy is to provide a powerful yet simple invoicing tool. The design prioritizes a clean and intuitive user interface, minimizing complexity and allowing users to focus on their business.

## High-Level Architecture

### Application Type
The application is a modern Single-Page Application (SPA) built with React and Vite. This architecture was chosen for its ability to provide a fast, responsive, and app-like user experience.

### Technology Choices

- **Frontend Framework:** React with TypeScript for building a type-safe and scalable user interface.
- **Build Tool:** Vite for a fast and efficient development and build process.
- **Backend-as-a-Service (BaaS):** Supabase for database, authentication, and storage.
- **Styling:** Tailwind CSS with shadcn/ui for a utility-first approach to styling and a consistent design system.
- **State Management:** Zustand for simple global state management and React Query for managing server state, caching, and data fetching.
- **Routing:** React Router for client-side routing.
- **Form Management:** React Hook Form with Zod for schema validation, providing a robust and efficient way to handle forms.
- **PDF Generation:** jsPDF and jspdf-autotable for generating professional PDF invoices.
- **Testing:** Vitest and React Testing Library for unit and component testing.

## Major System Components

### 1. Invoice Management
The core feature of the application, allowing users to create, edit, send, and track invoices.

- **Key Features:**
  - Create new invoices with custom line items, taxes, and discounts.
  - Edit existing invoices.
  - Send invoices to clients via email.
  - Track the status of invoices (draft, sent, paid, overdue).
  - Generate PDF versions of invoices.

### 2. Client Management
A centralized system for managing client information.

- **Key Features:**
  - Add, edit, and delete clients.
  - View a list of all clients.
  - Associate invoices with specific clients.

### 3. Dashboard & Reporting
Provides an overview of the user's invoicing activity.

- **Key Features:**
  - View key metrics such as total revenue, outstanding payments, and overdue invoices.
  - Visualize data with charts and graphs.

### 4. Authentication & User Management
Handles user authentication and profile management.

- **Key Features:**
  - Secure user registration and login.
  - Password recovery.
  - User profile management.

### 5. Settings
Allows users to customize their experience.

- **Key Features:**
  - Customize invoice templates.
  - Set default tax rates and currency.
  - Manage account settings.

## Data Architecture

### Database Design
The application uses a PostgreSQL database managed by Supabase. The database schema is designed to be relational and scalable.

- **Key Entities:**
  - `users`: Stores user information.
  - `clients`: Stores client information.
  - `invoices`: Stores invoice data, including line items, taxes, and status.
  - `invoice_items`: Stores individual line items for each invoice.

### Data Management
- **Data Integrity:** Enforced through database constraints and Zod schema validation.
- **Data Security:** Supabase provides row-level security to ensure that users can only access their own data.

## Integration Architecture

### Supabase Integration
The application is tightly integrated with Supabase for all backend services.

- **Database:** All application data is stored in the Supabase PostgreSQL database.
- **Authentication:** Supabase handles user authentication, including social providers like Google.
- **Storage:** Supabase Storage is used for storing user-uploaded files, such as company logos.

## Security Architecture

### Authentication and Authorization
- **Authentication:** Handled by Supabase Auth, which supports email/password and social logins.
- **Authorization:** Implemented using Supabase's Row-Level Security (RLS), ensuring that users can only access and modify their own data.

### Data Protection
- **Data in Transit:** All communication between the client and Supabase is encrypted using SSL/TLS.
- **Data at Rest:** Data is encrypted at rest in the Supabase database.
- **Input Validation:** All user input is validated using Zod schemas to prevent common security vulnerabilities like XSS.

## Deployment Architecture

### Infrastructure
- **Frontend:** The frontend is a static build that can be deployed to any modern static hosting provider like Vercel, Netlify, or AWS S3/CloudFront.
- **Backend:** The backend is fully managed by Supabase, which handles the database, authentication, and other services.

### Build & Deployment Process
- The `npm run build` command creates a production-ready build in the `dist/` directory.
- This directory can then be deployed to a static hosting provider.
- Continuous integration and deployment (CI/CD) can be set up using services like GitHub Actions to automate the build and deployment process.

## Performance Considerations

### Load Patterns
The application is designed to handle typical web application load patterns, with peaks during business hours.

### Performance Optimization
- **Code Splitting:** Lazy loading of components and routes to reduce the initial bundle size.
- **Caching:** React Query is used to cache server state, reducing the number of requests to the backend.
- **Optimized Queries:** Database queries are optimized to ensure fast data retrieval.
- **CDN:** Static assets are served through a CDN for faster delivery.

## Future Extensibility

### Planned Enhancements
- **Payment Gateway Integration:** Integration with Stripe or PayPal to allow clients to pay invoices directly online.
- **Recurring Invoices:** Support for creating and managing recurring invoices.
- **Multi-Currency Support:** Ability to create invoices in different currencies.
- **Advanced Reporting:** More detailed and customizable reports.

### Architecture Flexibility
The current architecture is designed to be flexible and extensible. The component-based structure of React allows for easy addition of new features, and the use of Supabase provides a scalable backend that can grow with the application.

## User Interface

The application has a modern and clean user interface. Here is a sample of the login page:



## Conclusion

The architecture of Simplr Invoicing is designed to provide a secure, scalable, and user-friendly platform for managing invoices. By leveraging modern technologies like React, Vite, and Supabase, the application offers a robust and efficient solution for freelancers and small businesses. The focus on simplicity and user experience ensures that the application is easy to use, while the underlying architecture provides a solid foundation for future growth and extensibility.
