# Compux - Campus Social Network

## ✨ About

Compux is a modern campus social network built with **React 19**, **Vite**, and **Tailwind CSS**. It connects students, facilitates knowledge sharing, and creates community engagement through posts, study groups, events, and messaging.

### Key Features
- 🎓 **Student Profiles** with verification badges
- 📝 **Posts & Interactions** - like, comment, share
- 👥 **Follow System** with followers/following counts
- 📚 **Study Groups** - collaborative learning spaces
- 📅 **Events** - campus activities and RSVP
- 💬 **Direct Messaging** - private conversations
- 🔔 **Notifications** - stay updated
- 🌍 **Multi-language** - English & Arabic support
- 🎨 **Dark/Light Mode** - theme toggle
- ✅ **Admin Panel** - moderation and analytics

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Fast build tool |
| **TypeScript 5.7** | Type safety |
| **Tailwind CSS 4** | Styling |
| **Supabase** | Backend & Auth |

## 📁 Project Structure

```
src/
├── components/        # Reusable components
│   └── ErrorBoundary.tsx
├── hooks/            # Custom React hooks
│   └── useCustom.ts
├── services/         # API & data services
│   └── api.ts
├── utils/            # Utility functions
│   ├── security.ts   # Auth & sanitization
│   └── logger.ts     # Logging
├── App.tsx           # Main app component (needs refactoring)
├── main.tsx          # React entry point
├── store.tsx         # Global state management
├── types.ts          # TypeScript types
├── i18n.ts          # Internationalization
├── supabase.ts      # Supabase client
└── index.css        # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/ameersaad1/compux1.git
cd compux1

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Add your Supabase credentials to .env.local
```

### Running the App

```bash
# Development server (runs on http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Check TypeScript errors
pnpm lint

# Format code
pnpm format
```

## 🔐 Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## ⚠️ Known Issues & TODO

### High Priority
- [ ] Split `App.tsx` into smaller components (currently 2100 lines)
- [ ] Implement proper routing with React Router
- [ ] Add real password hashing (currently using SHA256)
- [ ] Implement proper session management
- [ ] Add comprehensive error handling

### Medium Priority
- [ ] Add loading skeletons for better UX
- [ ] Optimize re-renders with React.memo
- [ ] Implement lazy loading for routes
- [ ] Add accessibility features (ARIA labels)
- [ ] Add unit & integration tests

### Low Priority
- [ ] Add animations for page transitions
- [ ] Implement offline mode
- [ ] Add PWA support
- [ ] Performance optimizations

## 🔒 Security Notes

⚠️ **Current Limitations (Development Only):**
- Passwords are stored in plain text (use proper hashing in production)
- No real authentication with Supabase yet
- Data is stored in application state (use database in production)

**For Production:**
- Use bcrypt or Argon2 for password hashing
- Implement Supabase authentication properly
- Set up database with proper encryption
- Add CSRF protection
- Implement rate limiting

## 🎯 Development Guidelines

### Code Quality
- Use TypeScript for all new code
- Keep components under 300 lines
- Use custom hooks to share logic
- Add comments for complex logic
- Follow naming conventions

### Git Workflow
```bash
# Create a feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: description"

# Push to GitHub
git push origin feature/feature-name

# Create a pull request
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation
- Review code comments

---

**Last Updated:** September 3, 2026
**Version:** 1.0.0
