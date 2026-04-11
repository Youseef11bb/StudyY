export const SOUNDS = {
  TIMER_END: 'alarm.mp3', // Success bell
  TASK_COMPLETE: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3', // Pop/Click
  NOTIFICATION: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3', // Soft chime
};

export const playSound = (soundUrl: string) => {
  if (!soundUrl) return;
  
  const audio = new Audio();
  
  audio.addEventListener('error', (e) => {
    console.warn('Sound failed to load, skipping playback:', soundUrl);
  });

  audio.src = soundUrl;
  audio.play().catch(err => {
    // Autoplay policy might block this if no user interaction has occurred
    if (err.name !== 'NotAllowedError') {
      console.warn('Playback failed:', err.message);
    }
  });
};
