# AgentNexus

AgentNexus is an AI-powered development assistant with multiple specialized agents for software development and research tasks. It provides a unified interface to interact with various AI model providers and helps streamline your development and research workflows.

## Features

- Multiple specialized agents for different aspects of software development
- Support for research projects with dedicated research assistant
- Integration with multiple AI model providers
- Local model support via Ollama
- Project-based organization with dedicated storage for each project

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Ollama (optional, for local models)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Karera-o/agentNexus.git
   cd agentNexus
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Add your API keys to the `.env` file (see API Keys section below)
5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
6. Open [http://localhost:3002](http://localhost:3002) in your browser (or the port shown in your terminal)

## API Keys

The application supports multiple AI model providers. You can add your API keys to the `.env` file to avoid having to enter them each time you start the application.

### Supported Providers

- **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
- **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/account/keys)
- **Google Gemini**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **DeepSeek**: Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
- **OpenRouter**: Get your API key from [OpenRouter](https://openrouter.ai/keys)
- **Requesty**: Get your API key from [Requesty](https://requesty.ai/)

### Setting Up API Keys

1. Open the `.env` file in the root directory
2. Add your API keys to the corresponding variables:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   NEXT_PUBLIC_REQUESTY_API_KEY=your_requesty_api_key
   ```
3. Save the file and restart the application

Alternatively, you can enter your API keys in the Settings panel within the application. To save these keys permanently, click the "Save API Keys" button in the Settings panel, which will provide instructions for updating your `.env` file.

## Project Types

The application supports two types of projects:

1. **Software Projects**: Full suite of specialized agents for software development tasks
   - **Requirements Analyst**: Helps gather, analyze, and refine project requirements, creating detailed specifications and user stories
   - **Software Documentor**: Creates comprehensive documentation for code, APIs, and system architecture
   - **System Designer**: Designs overall system architecture, component interactions, and technical specifications
   - **DB Designer**: Designs database schemas, relationships, and optimizes data structures
   - **UI Architect**: Provides UI/UX design guidance, wireframes, and aesthetic recommendations

2. **Research Projects**: Simplified interface with a dedicated research assistant
   - **Research Assistant**: Analyzes research papers, extracts key information, answers questions, and helps synthesize findings into coherent summaries

## Project Storage

Each project has a dedicated storage location for files and chat history:

- Software projects: `~/Documents/Personal/Agents/Software/{Project Name}/`
- Research projects: `~/Documents/Personal/Agents/Research/{Project Name}/`

## Recent Improvements

- **Automatic Model Loading**: OpenRouter and Ollama models are now loaded automatically when the application starts
- **Enhanced UI**: Improved aesthetics with consistent design language
- **Better Model Selection**: Two-step model selection process (provider first, then model)
- **Project Organization**: Clear separation between software and research projects

## Learn More

This project is built with [Next.js](https://nextjs.org). To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
