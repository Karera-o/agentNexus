/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Explicitly expose environment variables to the browser
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_DEEPSEEK_API_KEY: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    NEXT_PUBLIC_REQUESTY_API_KEY: process.env.NEXT_PUBLIC_REQUESTY_API_KEY,
    NEXT_PUBLIC_OLLAMA_HOST: process.env.NEXT_PUBLIC_OLLAMA_HOST,
  },
  // Enable experimental features
  experimental: {
    // Enable server components
    serverComponents: true,
  },
};

module.exports = nextConfig;
