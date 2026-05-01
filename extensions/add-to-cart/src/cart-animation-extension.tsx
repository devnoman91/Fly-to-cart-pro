import { useEffect } from 'preact/hooks';
import { CartObserver } from './cart-observer';
import { AnimationEngine } from './animation-engine';
import { AudioPlayer } from './audio-player';

export function CartAnimationExtension() {
  useEffect(() => {
    const animationEngine = new AnimationEngine();
    const audioPlayer = new AudioPlayer();
    const cartObserver = new CartObserver({
      onAddToCart: async (event: any) => {
        try {
          const config = await fetchAnimationConfig(event.productId);
          if (config?.animationKey) {
            animationEngine.play(config.animationKey, event.productElement);
          }
          if (config?.soundKey) {
            audioPlayer.play(config.soundKey);
          }
        } catch (error) {
          console.error('Failed to play animation:', error);
        }
      },
    });

    cartObserver.start();

    return () => {
      cartObserver.stop();
      animationEngine.cleanup();
      audioPlayer.cleanup();
    };
  }, []);

  return null;
}

async function fetchAnimationConfig(productId: string) {
  try {
    const response = await fetch('/api/animation-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch animation config:', error);
    return null;
  }
}
