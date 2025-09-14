# Welcome to Hyper Pulse Content project

## Project info

**URL**: https://lovable.dev/projects/f69a2022-bfc8-42fe-b82b-1457bc210fbd

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f69a2022-bfc8-42fe-b82b-1457bc210fbd) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables (optional)
# Copy the example environment file and customize as needed
cp .env.development.example .env.development

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables

This project uses environment variables for configuration. The following files are used:

- `.env` - Shared variables across all environments
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables

### Key Environment Variables:

- `VITE_DEV_BYPASS_AUTH` - Set to `true` to bypass authentication in development
- `VITE_DEBUG_MODE` - Enable debug logging in development
- `VITE_ENABLE_MOCK_DATA` - Use mock data instead of real API calls
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Note**: All client-side environment variables must be prefixed with `VITE_` to be accessible in your code.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f69a2022-bfc8-42fe-b82b-1457bc210fbd) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
