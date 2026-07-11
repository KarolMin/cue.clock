import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export function useShotClockSounds() {
  const warningPlayer = useAudioPlayer(require('../../assets/sounds/warning.wav'));
  const buzzerPlayer = useAudioPlayer(require('../../assets/sounds/buzzer.wav'));

  const playWarning = () => {
    warningPlayer.seekTo(0);
    warningPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const playBuzzer = () => {
    buzzerPlayer.seekTo(0);
    buzzerPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return { playWarning, playBuzzer };
}
