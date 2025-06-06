# Simplr Invoice Flow

A professional invoicing app built with **Vite**, **React**, **TypeScript**, **shadcn-ui**, **Tailwind CSS**, and **Supabase**.  
Originally bootstrapped using [Lovable.dev](https://lovable.dev), now fully editable via local development tools.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/christiantoferreira/simplr-invoice-flow.git
cd simplr-invoice-flow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root folder and include the following keys:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ Do **not** commit your `.env` file. It's already ignored by `.gitignore`.

### 4. Run the App Locally

```bash
npm run dev
```

Then open: [http://localhost:3000](http://localhost:3000)

---

## 💠 Available Commands

| Command              | Description                         |
|----------------------|-------------------------------------|
| `npm run dev`        | Start local development server      |
| `npm run build`      | Create a production build           |
| `npm run preview`    | Preview the production build        |
| `npm run lint`       | Run ESLint (if configured)          |
| `npm run typecheck`  | Run TypeScript type checking        |

---

## 📁 Project Structure

```
simplr-invoice-flow/
├── public/                       # Static files
├── src/
│   ├── components/              # Reusable UI components
│   ├── pages/                   # App pages/routes
│   ├── integrations/supabase/   # Supabase config, types & hooks
│   ├── lib/                     # Utility functions
│   └── App.tsx                  # Root component
├── .env                         # Local environment variables
├── index.html                   # App shell
├── package.json                 # Project metadata
└── vite.config.ts              # Vite configuration
```

---

## ✨ Key Features

### Dynamic Invoice Headers
- **Company Information Integration**: Invoice headers automatically populate with company details configured in Settings
- **Real-time Updates**: Changes to company information in Settings are immediately reflected in all invoice previews
- **Smart Fallbacks**: User-friendly placeholder text displays when company information is not yet configured
- **Consistent Data Flow**: Uses centralized InvoiceContext to ensure data consistency across all components

### Invoice Management
- Create, edit, and manage professional invoices
- Multiple invoice templates (Classic, Modern, Creative, Professional)
- PDF generation and download
- Email sending capabilities
- Tax configuration support

### Settings & Configuration
- Company information management (name, address, phone, email)
- Invoice numbering customization with prefixes
- Tax configuration for different provinces/states
- Brand color customization
- GST/HST number support

## 🔐 Supabase Integration

Supabase is used for:
- Authentication
- Realtime database
- Storage (if configured)
- Company settings persistence
- Invoice and client data management

Make sure the `.env` file contains the correct Supabase URL and anon key. The config is located at:

```ts
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

---

## 🔧 Recommended VS Code Extensions

- Prettier – Code formatter  
- ESLint  
- GitLens  
- ES7+ React/Redux Snippets  
- React DevTools  
- Supabase Auth Helpers (if applicable)

---

## 🌐 Git Workflow

```bash
# Get latest main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git add .
git commit -m "feat: add feature"

# Push to remote
git push origin feature/your-feature-name
```

---

## ⚠️ Notes

- Always prefix frontend env variables with `VITE_`
- Use `console.log(import.meta.env)` to debug env vars
- React HMR is enabled by default via Vite
- If HMR breaks, run `npm run dev --force`

---

## 📦 Deployment

This project can be deployed easily via platforms like:
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Render](https://render.com/)

Or continue using [Lovable.dev](https://lovable.dev) for one-click publish.

---

## 📄 License

This project is licensed under the MIT License.
