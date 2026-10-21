import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { haptics } from '@/lib/haptics';

import crunch from '../../../assets/games/sounds/crunch.wav';
import flap from '../../../assets/games/sounds/flap.wav';
import flip from '../../../assets/games/sounds/flip.wav';
import pop from '../../../assets/games/sounds/pop.wav';
import right from '../../../assets/games/sounds/right.wav';
import splash from '../../../assets/games/sounds/splash.wav';
import thud from '../../../assets/games/sounds/thud.wav';
import win from '../../../assets/games/sounds/win.wav';
import wrong from '../../../assets/games/sounds/wrong.wav';
import { useGameSettings } from '../settings';
import type { GameSound } from './scene';

/**
 * Light sounds (apps/mobile/scripts/game-sounds.py) and vibrations, each cut by its switch in the
 * pause menu. Both are a bonus: a missing audio module, an unsupported vibration or the phone's
 * silent switch leave the game as it is.
 */

const SOUNDS: Record<GameSound | 'win', number> = {
  right,
  wrong,
  pop,
  crunch,
  splash,
  flap,
  thud,
  flip,
  win,
};

const VOLUME = 0.6;
let players: Partial<Record<keyof typeof SOUNDS, AudioPlayer>> = {};
let audioReady = false;

function playerOf(sound: keyof typeof SOUNDS): AudioPlayer | null {
  try {
    if (!audioReady) {
      audioReady = true;
      // Respect the silent switch, and never stop the child's music: the games mix in.
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
        () => undefined,
      );
    }
    const player = players[sound] ?? createAudioPlayer(SOUNDS[sound]);
    player.volume = VOLUME;
    players[sound] = player;
    return player;
  } catch {
    return null;
  }
}

export function playSound(sound: keyof typeof SOUNDS) {
  if (!useGameSettings.getState().sound) return;
  const player = playerOf(sound);
  if (!player) return;
  try {
    player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // A sound that does not play changes nothing to the game.
  }
}

/** Frees the players when the child leaves the games. */
export function releaseSounds() {
  for (const player of Object.values(players)) {
    try {
      player.remove();
    } catch {
      // Already released.
    }
  }
  players = {};
}

/** One vibration per moment that counts, never per frame. */
export const feel = {
  right: () => useGameSettings.getState().vibration && haptics.success(),
  wrong: () => useGameSettings.getState().vibration && haptics.soft(),
  bump: () => useGameSettings.getState().vibration && haptics.soft(),
};
