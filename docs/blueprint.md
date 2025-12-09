# **App Name**: Valo Agent Roulette

## Core Features:

- Agent Data Fetch: Automatically fetches Valorant agent data from https://dash.valorant-api.com/endpoints/agents on a monthly schedule.
- Data Storage: Stores the fetched agent data in Firestore for persistent storage and easy retrieval.
- Agent Roulette: Generates a random agent selection from the stored data, creating a 'roulette' experience for the user.
- Agent Display: Displays the selected agent's information, including their name, abilities, and a character image.
- Roulette Spin Animation: When the 'roulette' spins, uses visual animations to represent the current probability of different agents, serving as a tool for the agent-choosing LLM to provide additional insights.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to reflect the game's intense and strategic nature.
- Background color: Very light grey (#F0F0F0) to ensure the agent details stand out.
- Accent color: Vibrant Yellow (#FFC61E) for highlighting key actions and elements.
- Headline font: 'Space Grotesk' (sans-serif) for a modern and technical feel.
- Body font: 'Inter' (sans-serif) to complement headlines and for readability.
- Use clean, vector-based icons to represent agent roles and abilities.
- Smooth transitions and subtle animations to enhance the user experience.