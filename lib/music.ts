export type MusicTrack = {
  title: string;
  src: string;
  enabled: boolean;
  initialVolume: number;
};

// User-supplied MP3. Playback begins only from an explicit Enter/Play action.
export const backgroundMusic: MusicTrack = {
  title: "Zelda's Lullaby",
  src: '/audio/zeldas-lullaby.mp3',
  enabled: true,
  initialVolume: 0.22
};

// Original, locally generated soundscape for the optional welcome-screen preview.
export const openingForestTrack: MusicTrack = {
  title: 'Forest prelude',
  src: '/audio/forest-prelude.wav',
  enabled: true,
  initialVolume: 0.3
};
