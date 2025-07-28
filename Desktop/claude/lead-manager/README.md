# Lead Manager

A modern, React-based lead qualification and script management system designed for door-to-door sales teams. Built with TypeScript, React, and Vite.

## Features

### 🎯 Script Builder
- **Visual Workflow Editor**: Drag-and-drop interface for creating multi-step sales scripts
- **Conditional Logic**: Build dynamic scripts with branching paths based on customer responses
- **Multiple Field Types**: Support for text, email, phone, address, checkboxes, radio buttons, and more
- **Page Types**: Welcome screens, form pages, and ending pages with full customization

### 👥 User Management
- **Role-Based Access Control**: Define roles with specific permissions
- **Built-in Roles**: Admin, Manager, Sales Agent, and Viewer
- **Module Access**: Control access to Content Editor, Workflow, Leads, and other modules
- **User Authentication**: Secure login system with session management

### 📊 Lead Management
- **Lead Capture**: Automatic lead storage from completed scripts
- **Advanced Filtering**: Filter leads by script name, agent, date range, and custom search
- **Lead Details**: View complete submission data with export capabilities
- **Agent Assignment**: Automatic assignment of leads to the agent who captured them

### 🚀 Active Scripts
- **Script Publishing**: Deploy scripts for live use by sales agents
- **Embedded Preview**: See exactly how scripts will appear to users
- **Live Mode**: Agents can run scripts in new tabs for lead capture
- **Real-time Updates**: Changes to scripts are immediately available

### 🔗 Integrations (Coming Soon)
- Webhook connections for external systems
- Zillow integration
- Custom API endpoints

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with CSS Variables for theming
- **State Management**: React Context API
- **Routing**: React Router (when needed)
- **UI Components**: Custom components with Lucide React icons
- **Workflow Editor**: React Flow for visual scripting

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/joshbakergf/lead-manager.git
cd lead-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
lead-manager/
├── src/
│   ├── components/        # React components
│   │   ├── Login.tsx     # Authentication UI
│   │   ├── FormBuilder.tsx # Script page builder
│   │   ├── WorkflowView.tsx # Visual workflow editor
│   │   ├── PublicPreview.tsx # Script preview
│   │   ├── LiveScript.tsx # Live script execution
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── assets/           # Images and static assets
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static public assets
├── package.json          # Dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## Default Login

For testing purposes, a default user is available:

- **Email**: john@example.com
- **Password**: password
- **Role**: Sales Agent

## Usage

### Creating a Script

1. Navigate to the **Content Editor** tab
2. Add pages using the "+" button in the sidebar
3. Configure each page with fields and content
4. Set up page visibility and types

### Setting Up Workflow Logic

1. Go to the **Workflow** tab
2. Connect pages by dragging from connection points
3. Define conditional paths based on form responses
4. Test the flow using the preview feature

### Publishing Scripts

1. In the **Active Scripts** tab, click "Publish New Script"
2. Select the pages to include
3. Give your script a name and description
4. Click "Publish Script"

### Capturing Leads

1. Agents see published scripts in the **Active Scripts** tab
2. Click "Start Call" to open the script in a new tab
3. Fill out the form with customer information
4. Submit to capture the lead

### Managing Leads

1. View all captured leads in the **Leads** tab
2. Use filters to find specific submissions
3. Click "View Details" to see complete lead information
4. Export lead data as JSON

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- TypeScript for type safety
- Functional React components with hooks
- CSS modules for component styling
- Consistent naming conventions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For questions or support, please contact the development team.

---

Built with ❤️ for sales teams everywhere