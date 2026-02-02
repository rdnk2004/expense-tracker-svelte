# 💰 Personal Finance Tracker

A **local-first** personal finance tracker built with SvelteKit, TypeScript, and IndexedDB. No backend required - all your data stays on your device!

## ✨ Features

- ✅ **100% Client-Side**: No server, no API - everything runs in your browser
- ✅ **Local Data Storage**: Uses IndexedDB via `idb-keyval` for persistence
- ✅ **SPA Mode**: Fast navigation with client-side routing
- ✅ **TypeScript Strict Mode**: Full type safety throughout the app
- ✅ **Dark Theme**: Beautiful silver-accented dark theme
- ✅ **Reactive Stores**: Svelte stores automatically sync with IndexedDB
- ✅ **Vercel Ready**: Pre-configured for static deployment

## 🛠 Tech Stack

- **Framework**: SvelteKit 2.x (SPA mode)
- **Language**: TypeScript 5.x (strict mode)
- **Storage**: IndexedDB via `idb-keyval`
- **Styling**: Vanilla CSS with custom properties
- **Build Tool**: Vite 7.x
- **Adapter**: @sveltejs/adapter-static

## 📁 Project Structure

```
src/
├── lib/
│   ├── db/              # IndexedDB operations
│   │   └── index.ts     # CRUD functions for expenses, income, categories
│   ├── stores/          # Svelte stores
│   │   ├── expenses.ts  # Expense store with derived stores
│   │   ├── income.ts    # Income store with derived stores
│   │   └── categories.ts # Category store with derived stores
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts     # All type definitions
│   └── utils/           # Utility functions
│       └── index.ts     # Formatters, calculations, helpers
├── routes/              # Pages
│   ├── +layout.svelte   # Root layout (initializes DB)
│   ├── layout.css       # Global styles & dark theme
│   └── +page.svelte     # Home page
└── hooks.ts             # SvelteKit hooks (disables SSR)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app will run at `http://localhost:5173`

Open your browser's DevTools → Application → IndexedDB to see your data being stored locally.

## 📊 Data Schema

### Expense & Income
```typescript
{
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  type: 'expense' | 'income';
  createdAt: Date;
  updatedAt: Date;
}
```

### Category
```typescript
{
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon?: string;
  createdAt: Date;
}
```

## 🎨 Theme Customization

The dark theme uses CSS custom properties defined in `src/routes/layout.css`:

```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --accent-primary: #c0c0c0;
  --success: #4ade80;
  --warning: #fbbf24;
  --danger: #f87171;
  /* ... and more */
}
```

## 🗄️ Using the Database

### Import and use stores:

```typescript
import { expenses } from '$lib/stores/expenses';
import { formatCurrency } from '$lib/utils';

// Add an expense
await expenses.add({
  amount: 50.00,
  description: 'Groceries',
  categoryId: 'category-id',
  date: new Date(),
  type: 'expense'
});

// Access reactive values
$: total = $expenses.reduce((sum, e) => sum + e.amount, 0);
```

### Direct database access:

```typescript
import { addExpense, getExpenses } from '$lib/db';

const expenses = await getExpenses();
const newExpense = await addExpense({ /* ... */ });
```

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy! (Vercel auto-detects SvelteKit)

The project includes `vercel.json` for configuration.

### Manual Static Hosting

```bash
# Build the static site
npm run build

# Upload the 'build' folder to any static host
# (Netlify, GitHub Pages, Cloudflare Pages, etc.)
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript checks
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 📝 Default Data

The app comes with 11 pre-configured categories:

**Expense Categories:**
- Food & Dining 🍔
- Transportation 🚗
- Shopping 🛍️
- Entertainment 🎬
- Bills & Utilities 💡
- Healthcare ⚕️
- Other 📦

**Income Categories:**
- Salary 💰
- Freelance 💼
- Investments 📈
- Other Income 💵

## 🛣️ Future Enhancements

This is a foundation. Consider adding:
- Budget tracking with alerts
- Data visualization (charts)
- Recurring transactions
- Data export/import (CSV, JSON)
- Multiple accounts
- Tags and custom fields
- Search and filters
- Monthly/yearly reports
- Dark/light theme toggle
- PWA support for offline use

## 🤝 Contributing

This is a personal project template. Feel free to fork and customize!

## 📄 License

MIT - Use it however you want!

---

**Built with ❤️ using SvelteKit**
