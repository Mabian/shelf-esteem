import { Component, input } from '@angular/core';

// Fixed spots so the snowfall looks the same on every visit, delays are negative so it is
// already snowing when the page opens
const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 53) % 400,
  r: 1.5 + (i % 3),
  duration: 7 + (i % 5) * 1.5,
  delay: -((i * 1.7) % 12),
}));

@Component({
  selector: 'app-room-scene',
  templateUrl: './room-scene.html',
  styleUrl: './room-scene.scss',
  host: {
    'aria-hidden': 'true',
    '[class.room-scene-paused]': 'paused()',
  },
})
export class RoomScene {
  readonly room = input.required<string>();
  readonly paused = input(false);

  protected readonly flakes = FLAKES;
}
