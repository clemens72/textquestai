# **App Name**: TextQuestAI

## Core Features:

- Scene Display: Display the current scene's descriptive text to the player.
- Choice Presentation: Show the player's available choices as a list of options.
- Choice Handling & State Update: Handle player input, update the game state in Firestore based on their choice, and load the next scene.
- Game State Persistence: Use Firestore to store and retrieve the player's name and current scene to persist game progress.
- AI-Powered Hint System: Employ an AI tool to generate hints based on the current scene and player's inventory, if the player gets stuck.

## Style Guidelines:

- Primary color: Dark gray (#333) for a mysterious and immersive feel.
- Secondary color: Light beige (#F5F5DC) for readability and a vintage look.
- Accent: Teal (#008080) for interactive elements and highlights.
- Clean, sans-serif font for body text to ensure readability.
- Centralized content area with a muted background to focus the player's attention.
- Simple, line-based icons for inventory items (if implemented) and navigational cues.
- Subtle fade-in animations for scene transitions and choice outcomes.

## Original User Request:
Create a simple, web-based, text adventure RPG application.

Core Features:

Game Start:

Display a welcome message and a brief introduction to the game's premise.

Prompt the user to enter their character's name.

Gameplay Loop:

Present the player with descriptive text outlining the current scene, situation, or location.

Provide the player with 2-4 numbered or lettered choices relevant to the current scene.

Allow the player to input their choice.

Based on the player's choice, update the game state (e.g., move to a new scene, find an item, encounter a character).

Display the outcome of the choice and the next scene/situation description.

Game State Management:

Use Firestore database to store the player's current progress, including:

Player Name

Current location or scene identifier

(Optional) Basic inventory (list of item names)

(Optional) Simple stats (e.g., Health Points)

Ensure the game state persists between sessions for the logged-in user (if user authentication is included) or using local storage/session storage for simplicity.

Technology:

Use HTML, CSS, and JavaScript for the front-end interface.

Use Firebase Firestore to manage and persist game data.

(Optional) Use Firebase Authentication if user accounts are desired.

(Optional) Consider using Cloud Functions for more complex game logic if needed, but start simple.

Initial Content:

Define at least 3-4 interconnected scenes or locations to start.

Write the introductory text and the descriptive text for each initial scene.

Create the corresponding choices for each scene and define their outcomes (which scene they lead to, items found, etc.).

Goal: Create a functional prototype demonstrating the core text-adventure loop: Read -> Choose -> Update State -> Read. Keep the initial scope small and focus on the mechanics.
  