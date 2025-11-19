<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ColorSpeak Match - AI Powered Memory Game

A fun and interactive memory matching game for kids with voice feedback.

**UPDATE:** Now supports pre-generated audio files, so you don't need an API Key for the live site!

## Features

- **Voice Feedback**: "It's Red!", "It's Blue!" (Pre-generated using AI).
- **Sound Effects**: Custom synthesized sound effects.
- **Responsive Design**: Works great on desktop and mobile devices.
- **Cute UI**: Designed for kids.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. **Generate Audio Files (One-time setup)**:
   To avoid using an API Key in production, we generate the audio files once locally.
   
   - Make sure you have a `.env.local` file with your `GEMINI_API_KEY`.
   - Run the generation script:
     ```bash
     npm run generate-audio
     ```
   - This will create MP3 files in `public/audio/`.

3. Run the app:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 to view it in the browser.

## Deploy to Vercel (No API Key Needed!)

Since the audio is now pre-generated, you **do not** need to set any environment variables on Vercel.

1. **Push your code** (including the generated `public/audio` folder) to GitHub.
2. **Import in Vercel**.
3. **Deploy**.

### Troubleshooting: "Deployment Protected" / Login Required

If your Vercel link asks for a login, it means "Deployment Protection" is enabled. To fix this:

1. Go to your project dashboard on Vercel.
2. Click **Settings** (top menu).
3. Click **Deployment Protection** (left menu).
4. Find **Vercel Authentication** and set it to **Disabled**.
5. Click **Save**.

Now your link should be public!

## Technologies

- **React 19**: UI Framework
- **Vite**: Build tool
- **Google Gen AI SDK**: Used for generating audio assets
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
