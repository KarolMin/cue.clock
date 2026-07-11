import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export function useShotClockSounds() {
  const warningPlayer = useAudioPlayer(require('../../assets/sounds/warning.wav'));
  const buzzerPlayer = useAudioPlayer(require('../../assets/sounds/buzzer.wav'));
  const tickPlayer = useAudioPlayer(require('../../assets/sounds/tick.wav'));

  warningPlayer.volume = 1.0;
  buzzerPlayer.volume = 1.0;
  tickPlayer.volume = 1.0;

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

  const playTick = () => {
    tickPlayer.seekTo(0);
    tickPlayer.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return { playWarning, playBuzzer, playTick };
}
