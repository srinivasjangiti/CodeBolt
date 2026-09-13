# CODEBOLT - Ultra-Fast AI Coding Assistant

An ultra-fast, production-ready ChatGPT-style coding assistant powered by **NVIDIA NIM APIs**. Stream responses, switch models, and build faster than ever.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## 🚀 Features

- ⚡ **Streaming Responses** - Real-time message generation with live cursor feedback
- 🔄 **Instant Model Switching** - Choose from 8 NVIDIA models, switch anytime
- 💾 **Persistent Chat History** - All conversations saved to Supabase
- 📝 **Full Markdown Support** - Syntax-highlighted code blocks and rich formatting
- 🎨 **Dark Mode by Default** - Beautiful dark theme optimized for coding sessions
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: React 19.2.4 + TypeScript
- **Styling**: Tailwind CSS v4 with OKLCH colors
- **Build Tool**: Vite 7.3.1
- **Routing**: React Router DOM v7
- **UI Components**: shadcn/ui (60+ components)
- **Database**: Supabase (PostgreSQL)
- **AI Models**: NVIDIA NIM APIs
- **Backend**: Express.js (dev), Vercel Serverless (prod)
- **Deployment**: Vercel

## 📊 Supported Models

1. **Mistral Small 4 119B** - Fast and efficient
2. **DeepSeek V4 Flash** - High-speed inference
3. **DeepSeek V4 Pro** - Advanced reasoning
4. **GLM 5.1** - Multilingual support
5. **Kimi K2.6** - Context-aware responses
6. **Nemotron 3 Super 120B** - High-quality outputs
7. **Nemotron 3 Nano Omni** - Lightweight model
8. **Gemma 4 31B** - Ethical AI outputs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- NVIDIA API key (free from [build.nvidia.com](https://build.nvidia.com))
- Supabase account (free tier available)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/srinivasjangiti/Codebolt.git
   cd Codebolt
   ```

2. **Install dependencies**
   ```bash
   cd project
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with:
   - `VITE_NVIDIA_API_KEY` - Your NVIDIA API key (optional, can be set via UI)
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

4. **Run development servers**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend Proxy: http://localhost:3001

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage

### Landing Page
- Navigate to `/` to see the product landing page
- Review features and supported models
- Click "Enter NVIDIA Key" to enter your API key

### How To Get Your NVIDIA API Key
1. Open https://build.nvidia.com and sign in.
2. Go to API Keys and create a new key.
3. Copy the key value.
4. Open CODEBOLT and click Enter NVIDIA Key.
5. Paste the key and click Continue.
6. Choose a model and start chatting.

### SaaS Flow
1. **Landing Page** → Display product features
2. **API Key Input** → User provides NVIDIA API key
3. **Chat App** → Protected route after authentication
4. **Logout** → Button in top-right clears key and returns to landing

### Chat Interface
- **Keyboard Shortcuts**:
  - `Ctrl+N` (or `Cmd+N`) - New chat
  - `Ctrl+B` (or `Cmd+B`) - Toggle sidebar
  - `Shift+Enter` - New line in input
  
- **Features**:
  - Rename chats
  - Delete conversations
  - Copy code blocks
  - Regenerate last response
  - Switch models mid-conversation

## 🔐 Security

- API keys stored securely in browser localStorage
- Keys never sent to CodeBolt servers
- Backend proxy accepts keys via headers
- Environment variables fallback for dev/prod
- RLS policies on Supabase for data isolation

## 📁 Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx       # SaaS landing page
│   │   ├── ChatApp.tsx            # Main chat interface
│   │   ├── ChatArea.tsx           # Message display
│   │   ├── ChatInput.tsx          # Message input
│   │   ├── ChatSidebar.tsx        # Chat history sidebar
│   │   ├── ModelSelector.tsx      # Model switcher
│   │   ├── SettingsPanel.tsx      # Temperature, tokens, etc.
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/
│   │   ├── useChats.ts            # Chat CRUD operations
│   │   ├── useMessages.ts         # Message streaming
│   │   └── use-mobile.ts          # Responsive detection
│   ├── lib/
│   │   ├── nvidia.ts              # NVIDIA API client
│   │   ├── supabase.ts            # Database client
│   │   └── utils.ts               # Utilities
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── App.tsx                    # Router setup
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── api/
│   └── chat/completions.js        # Vercel serverless function
├── public/
│   ├── index.html                 # HTML template
│   └── landing.html               # Static landing (optional)
├── server.js                      # Express dev server
├── vite.config.ts                 # Vite configuration
├── vercel.json                    # Vercel deployment config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Fork the repository** to your GitHub account
2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import from GitHub
   - Select the CodeBolt repository
   - Configure root directory as `project/`

3. **Set environment variables** in Vercel dashboard:
   ```
   VITE_NVIDIA_API_KEY=your_key (optional)
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

4. **Deploy**
   - Vercel automatically builds and deploys on push
   - Production URL: `https://your-project.vercel.app`

## 📝 API Integration

### NVIDIA NIM
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Endpoint**: `/chat/completions`
- **Auth**: Bearer token in Authorization header
- **Rate Limits**: Check NVIDIA documentation

### Supabase
- **Tables**:
  - `public.chats` - Chat metadata
  - `public.messages` - Message content
- **RLS Enabled**: Public access without auth
- **Streaming**: Real-time message updates via subscriptions

## 🐛 Troubleshooting

### API Key Not Working
- Verify key is from [build.nvidia.com](https://build.nvidia.com)
- Check for leading/trailing whitespace
- Ensure it starts with expected NVIDIA key format and was copied fully
- Ensure model is available in your account

### Chat Not Persisting
- Verify Supabase credentials in `.env`
- Check browser console for errors
- Ensure RLS policies allow public access

### Build Errors
- Run `npm install` to update dependencies
- Delete `node_modules` and `.next` folders
- Clear npm cache: `npm cache clean --force`
- Rebuild: `npm run build`

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Creator & Author

<div align="center">

### **Srinivas Jangiti**
*AI Engineer & Full-Stack Architect*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/srinivasajan/)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/sriwanders)
[![Substack](https://img.shields.io/badge/Substack-FF6719?style=for-the-badge&logo=substack&logoColor=white)](https://substack.com/@sriwanders)
[![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@sriwanders)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@srinivasjan)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/srinivasjangiti)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:srinivasajan.work@gmail.com)
[![Call](https://img.shields.io/badge/Phone-+91_8767505121-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](tel:+918767505121)

</div>

### 🌐 Connect with Srinivas Jangiti

| Channel | Link |
| :--- | :--- |
| 💼 **LinkedIn** | [linkedin.com/in/srinivasajan](https://www.linkedin.com/in/srinivasajan/) |
| 𝕏 **X (Twitter)** | [x.com/sriwanders](https://x.com/sriwanders) |
| 📰 **Substack** | [substack.com/@sriwanders](https://substack.com/@sriwanders) |
| ✍️ **Medium** | [medium.com/@sriwanders](https://medium.com/@sriwanders) |
| 🎥 **YouTube** | [youtube.com/@srinivasjan](https://www.youtube.com/@srinivasjan) |
| 🐙 **GitHub** | [github.com/srinivasjangiti](https://github.com/srinivasjangiti) |
| 📧 **Email** | [srinivasajan.work@gmail.com](mailto:srinivasajan.work@gmail.com) |
| 📞 **Phone** | [+91 8767505121](tel:+918767505121) |


## 🙏 Acknowledgments

- **NVIDIA NIM** - For incredible AI models and APIs
- **Supabase** - For scalable PostgreSQL database
- **shadcn/ui** - For beautiful, accessible components
- **Vercel** - For seamless deployment platform
- **React Team** - For the amazing framework

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)
- [NVIDIA NIM Docs](https://build.nvidia.com)
- [Supabase Docs](https://supabase.com/docs)

## 🔄 Version History

### v1.0.0 - May 16, 2026
- ✅ Initial release with SaaS flow
- ✅ Landing page with feature showcase
- ✅ Chat interface with streaming responses
- ✅ Model switching (8 NVIDIA models)
- ✅ Chat history persistence
- ✅ API key management
- ✅ Dark theme with responsive design
- ✅ Vercel deployment ready

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/srinivasjangiti/Codebolt/issues)
- Email: [srinivasajan.work@gmail.com](mailto:srinivasajan.work@gmail.com)
- Tweet: [@sriwanders](https://x.com/sriwanders)

---

**Made with ❤️ by [Srinivas Jangiti](https://github.com/srinivasjangiti)**

*"Build faster. Think clearer. Code better."* ⚡
