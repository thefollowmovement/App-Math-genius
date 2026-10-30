import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The games' sounds and vibrations, on or off for this device (the pause menu). */
export type GameSettings = { sound: boolean; vibration: boolean };

export const useGameSettings = create<GameSettings>()(
  persist((): GameSettings => ({ sound: true, vibration: true }), {
    name: 'math-genius.game-settings',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

export const setGameSound = (sound: boolean) => useGameSettings.setState({ sound });
export const setGameVibration = (vibration: boolean) => useGameSettings.setState({ vibration });
