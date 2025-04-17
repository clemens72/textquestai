'use client';

import {useEffect, useState} from 'react';
import {collection, doc, getDoc, getFirestore, setDoc} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {generateHint} from '@/ai/flows/generate-hint';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


let db;

interface Scene {
  id: string;
  description: string;
  choices: {
    text: string;
    nextSceneId: string;
  }[];
}

async function loadScene(sceneId: string): Promise<Scene | undefined> {
  try {
    const sceneDocRef = doc(db, 'scenes', sceneId);
    const sceneDoc = await getDoc(sceneDocRef);

    if (sceneDoc.exists()) {
      return {id: sceneDoc.id, ...sceneDoc.data()} as Scene;
    } else {
      console.log('Scene not found:', sceneId);
      return undefined;
    }
  } catch (error) {
    console.error('Error loading scene:', error);
    return undefined;
  }
}

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [gameStateLoaded, setGameStateLoaded] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const {toast} = useToast();

  useEffect(() => {
    // Initialize Firebase only once
    if (!firebaseInitialized) {
      try {
        initializeApp(firebaseConfig);
        db = getFirestore();
        setFirebaseInitialized(true);
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        toast({
          title: 'Error initializing Firebase!',
          description: 'The application may not function correctly.',
          variant: 'destructive',
        });
      }
    }

    const storedPlayerName = localStorage.getItem('playerName');
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }

    // Load game state only after Firebase is initialized and playerName is available
    if (firebaseInitialized && storedPlayerName) {
      loadGameState(storedPlayerName);
    }
  }, [firebaseInitialized]);

  useEffect(() => {
    if (playerName && gameStarted && !currentScene && firebaseInitialized) {
      startNewGame();
    }
  }, [playerName, gameStarted, currentScene, firebaseInitialized]);

  async function saveGameState(name: string | null, sceneId: string) {
    if (!name || !firebaseInitialized) return;
    try {
      await setDoc(doc(collection(db, 'gameStates'), name), {
        playerName: name,
        currentSceneId: sceneId,
      });
      localStorage.setItem('playerName', name);
    } catch (error) {
      console.error('Error saving game state:', error);
      toast({
        title: 'Error saving game!',
        description: 'Something went wrong while saving your progress.',
        variant: 'destructive',
      });
    }
  }

  async function loadGameState(storedPlayerName: string | null) {
    setLoading(true);
    if (!storedPlayerName || !firebaseInitialized || !db) {
      setLoading(false);
      return;
    }
    try {
      const gameStateDocRef = doc(collection(db, 'gameStates'), storedPlayerName);
      const gameStateDoc = await getDoc(gameStateDocRef);

      if (gameStateDoc.exists()) {
        const gameState = gameStateDoc.data();
        const scene = await loadScene(gameState.currentSceneId);
        if (scene) {
          setCurrentScene(scene);
          setGameStateLoaded(true);
        } else {
          console.log('No saved game state found, starting new game.');
        }
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      toast({
        title: 'Error loading game!',
        description: 'Something went wrong loading your saved progress.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleStartGame = () => {
    if (playerName) {
      setGameStarted(true);
    }
  };

  const startNewGame = async () => {
    setLoading(true);
    try {
      const initialScene = await loadScene('intro');
      if (initialScene) {
        setCurrentScene(initialScene);
        setGameStateLoaded(true);
        await saveGameState(playerName, initialScene.id);
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      toast({
        title: 'Error starting game!',
        description: 'Failed to start a new game. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceSelect = async () => {
    if (choice === null || !currentScene) return;

    setLoading(true);
    setHint(null);
    try {
      const nextSceneId = currentScene.choices[choice].nextSceneId;
      const nextScene = await loadScene(nextSceneId);

      if (nextScene) {
        setCurrentScene(nextScene);
        await saveGameState(playerName, nextScene.id);
        setChoice(null);
      } else {
        toast({
          title: 'Scene not found!',
          description: 'The next scene could not be loaded.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating scene:', error);
      toast({
        title: 'Error updating scene!',
        description: 'Failed to update the scene. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!currentScene) return;

    setLoading(true);
    try {
      const hintData = await generateHint({
        sceneDescription: currentScene.description,
        inventory: [], // Add inventory logic later
      });
      setHint(hintData.hint);
    } catch (error) {
      console.error('Error generating hint:', error);
      toast({
        title: 'Error generating hint!',
        description: 'Could not generate a hint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-background border-secondary">
        <CardHeader>
          {!playerName ? (
            <CardTitle className="text-lg">Welcome to TextQuestAI!</CardTitle>
          ) : (
            <CardTitle className="text-lg">TextQuestAI</CardTitle>
          )}
          <CardDescription>
            {!playerName
              ? 'Enter your name to begin your adventure.'
              : 'Your adventure awaits...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!playerName ? (
            <div className="flex flex-col space-y-2">
              <Input
                type="text"
                placeholder="Enter your name"
                value={playerName || ''}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <Button onClick={handleStartGame} disabled={!playerName}>
                Start Game
              </Button>
            </div>
          ) : !gameStarted ? (
            <div className="text-center">
              <p>Welcome, {playerName}!</p>
              <Button onClick={() => setGameStarted(true)} disabled={loading}>
                {gameStateLoaded ? 'Continue Adventure' : 'Start New Game'}
              </Button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : currentScene ? (
                <div className="space-y-4">
                  <p className="text-md">{currentScene.description}</p>
                  <ul className="space-y-2">
                    {currentScene.choices.map((choiceOption, index) => (
                      <li key={index}>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setChoice(index)}
                          active={choice === index}
                        >
                          {choiceOption.text}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between">
                    <Button
                      onClick={handleChoiceSelect}
                      disabled={choice === null || loading}
                    >
                      Make Choice
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleGetHint}
                      disabled={loading}
                    >
                      Get Hint
                    </Button>
                  </div>
                  {hint && (
                    <div className="p-4 mt-4 rounded-md bg-secondary text-foreground">
                      Hint: {hint}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p>Game Over!</p>
                  <Button onClick={startNewGame}>Start New Game</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
