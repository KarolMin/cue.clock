import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Settings } from '../types/settings';

export function useShotClockSounds(settings: Settings) {
  const warningPlayer = useAudioPlayer(require('../../assets/sounds/warning.wav'));
  const buzzerPlayer = useAudioPlayer(require('../../assets/sounds/buzzer.wav'));
  const tickPlayer = useAudioPlayer(require('../../assets/sounds/tick.wav'));
  const gameTimeWarningPlayer = useAudioPlayer(require('../../assets/sounds/gametime_warning.wav'));

  warningPlayer.volume = 1.0;
  buzzerPlayer.volume = 1.0;
  tickPlayer.volume = 1.0;
  gameTimeWarningPlayer.volume = 1.0;

  const playWarning = () => {
    if (settings.shotClockSoundEnabled) {
      warningPlayer.seekTo(0);
      warningPlayer.play();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const playBuzzer = () => {
    if (settings.shotClockSoundEnabled) {
      buzzerPlayer.seekTo(0);
      buzzerPlayer.play();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const playTick = () => {
    if (settings.shotClockSoundEnabled) {
      tickPlayer.seekTo(0);
      tickPlayer.play();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Distinct bell sound for the 2-minute / 1-minute game-time-remaining
  // warning, independent of the shot clock's own sounds.
  const playGameTimeWarning = () => {
    if (settings.gameTimeWarningSoundEnabled) {
      gameTimeWarningPlayer.seekTo(0);
      gameTimeWarningPlayer.play();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return { playWarning, playBuzzer, playTick, playGameTimeWarning };
}
