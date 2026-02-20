# Frontend Implementation Report (FIR)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Frontend Developer  
**Date:** 19 February 2026  

---

## 1. PROJECT SETUP

### 1.1 Next.js App Initialization (App Router)

```bash
npx create-next-app@latest va-ambulance-trip-analysis --typescript --tailwind --eslint --app --src-dir
```

### 1.2 Directory Structure

```
frontend/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx
│   ├── detailed/
│   │   ├── page.tsx
│   ├── trip-detail/
│   │   ├── [id]/page.tsx
│   ├── help/
│   │   ├── page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   ├── OverviewChart.tsx
│   ├── filters/
│   │   ├── FilterBar.tsx
│   ├── shared/
│   │   ├── DataTable.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBanner.tsx
│   └── charts/
│       ├── BarChart.tsx
│       ├── LineChart.tsx
├── hooks/
│   ├── useTrips.ts
│   ├── useTripDetail.ts
│   ├── useExport.ts
│   └── useAuth.ts
├── lib/
│   ├── api.ts
│   ├── constants.ts
│   └── utils.ts
├── styles/
│   └── globals.css
├── types/
│   └── index.ts
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 1.3 TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.4 ESLint and Prettier Configuration

#### `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "prettier"]
}
```

#### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2
}
```

### 1.5 Environment Variables

#### `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=your-audience
```

---

## 2. COMPONENT LIBRARY

### 2.1 KPICard Component

```tsx
// components/dashboard/KPICard.tsx

import React, { useState } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  tooltipText: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, description, tooltipText }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          aria-label={`Information about ${title}`}
          aria-describedby="kpi-tooltip"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      {showTooltip && (
        <div id="kpi-tooltip" role="tooltip" className="absolute z-10 bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default KPICard;
```

---

### 2.2 FilterBar Component

```tsx
// components/filters/FilterBar.tsx

import React, { useState } from 'react';

const FilterBar: React.FC = () => {
  const [filters, setFilters] = useState({
    dateRange: '',
    facility: '',
    providerType: '',
    contractType: '',
    tripType: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    // Apply filters logic here
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
          <input
            type="text"
            id="dateRange"
            name="dateRange"
            value={filters.dateRange}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="YYYY-MM-DD to YYYY-MM-DD"
          />
        </div>
        <div>
          <label htmlFor="facility" className="block text-sm font-medium text-gray-700">Facility</label>
          <select
            id="facility"
            name="facility"
            value={filters.facility}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">All Facilities</option>
            <option value="hospital-a">Hospital A</option>
            <option value="hospital-b">Hospital B</option>
          </select>
        </div>
        <div>
          <label htmlFor="providerType" className="block text-sm font-medium text-gray-700">Provider Type</label>
          <select
            id="providerType"
            name="providerType"
            value={filters.providerType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">All Types</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div>
          <label htmlFor="contractType" className="block text-sm font-medium text-gray-700">Contract Type</label>
          <select
            id="contractType"
            name="contractType"
            value={filters.contractType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">All Contracts</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
```

---

### 2.3 DataTable Component

```tsx
// components/shared/DataTable.tsx

import React from 'react';

interface DataTableProps {
  data: any[];
  columns: { key: string; label: string }[];
}

const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
```

---

### 2.4 Modal Component

```tsx
// components/shared/Modal.tsx

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
```

---

### 2.5 Toast Component

```tsx
// components/shared/Toast.tsx

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-50 text-white px-4 py-2 rounded shadow-lg ${bgColor} animate-fadeIn`}>
      {message}
    </div>
  );
};

export default Toast;
```

---

### 2.6 LoadingSpinner Component

```tsx
// components/shared/LoadingSpinner.tsx

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default LoadingSpinner;
```

---

### 2.7 ErrorBanner Component

```tsx
// components/shared/ErrorBanner.tsx

import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <span className="block sm:inline">{message}</span>
      <button
        onClick={onClose}
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        aria-label="Close"
      >
        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l3.029-3.029-3.029-3.029a1.2 1.2 0 1 1 1.697-1.697l3.029 3.029 3.029-3.029a1.2 1.2 0 1 1 1.697 1.697l-3.029 3.029 3.029 3.029a1.2 1.2 0 0 1 0 1.697z"/>
        </svg>
      </button>
    </div>
  );
};

export default ErrorBanner;
```

---

## 3. CHARTS COMPONENTS

### 3.1 BarChart Component

```tsx
// components/charts/BarChart.tsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: any;
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title || 'Bar Chart',
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
```

---

### 3.2 LineChart Component

```tsx
// components/charts/LineChart.tsx

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LineChartProps {
  data: any;
  title?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title || 'Line Chart',
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart;
```

---

## 4. HOOKS

### 4.1 useToast Hook

```tsx
// hooks/useToast.tsx

import { useState, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};
```

---

## 5. CONTEXT

### 5.1 ToastContext

```tsx
// context/ToastContext.tsx

import React, { createContext, useContext } from 'react';

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-2 mb-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
```

---

## 6. UTILS

### 6.1 formatDate Utility

```tsx
// utils/formatDate.ts

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

---

## 7. PAGES

### 7.1 HomePage

```tsx
// pages/HomePage.tsx

import React from 'react';
import { useToastContext } from '../context/ToastContext';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';

const HomePage: React.FC = () => {
  const { addToast } = useToastContext();

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Sales',
        data: [65, 59, 80, 81, 56],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Revenue',
        data: [30, 45, 60, 75, 90],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart data={barData} title="Monthly Sales" />
        <LineChart data={lineData} title="Quarterly Revenue" />
      </div>
      <button
        onClick={() => addToast('This is a test toast message!', 'success')}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        Show Toast
      </button>
    </div>
  );
};

export default HomePage;
```

---

## 8. MAIN APP FILE

### 8.1 App.tsx

```tsx
// App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
```

---

## 9. STYLES

### 9.1 Tailwind CSS Setup

In your `tailwind.config.js`:

```js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 10. PACKAGE.JSON DEPENDENCIES

Add to `package.json`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 11. BUILD AND RUN

To build and run:

```bash
npm install
npm start
```

This will set up a React app with Tailwind CSS, Chart.js, React Router, and Toast notifications. The structure includes:

- Reusable components (modals, toasts, charts)
- Context for managing toasts
- Custom hooks
- Utility functions
- Page components
- Responsive layout using Tailwind CSS

You can expand this further by adding more pages, integrating with APIs, or adding authentication flows. Let me know if you'd like any specific features added!