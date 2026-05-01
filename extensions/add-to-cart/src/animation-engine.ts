import gsap from 'gsap';

type AnimationType = 'slide_in' | 'bounce' | 'flip' | 'pulse' | 'spiral';

interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
}

const ANIMATIONS: Record<AnimationType, AnimationConfig> = {
  slide_in: { duration: 1, easing: 'power2.inOut' },
  bounce: { duration: 1.2, easing: 'back.out' },
  flip: { duration: 1, easing: 'back.inOut' },
  pulse: { duration: 0.6, easing: 'power1.inOut' },
  spiral: { duration: 1.2, easing: 'power2.inOut' },
};

export class AnimationEngine {
  private activeAnimations: gsap.core.Tween[] = [];
  private cartIcon: HTMLElement | null = null;

  constructor() {
    this.cartIcon = this.findCartIcon();
  }

  play(animationType: AnimationType, productElement: HTMLElement) {
    const config = ANIMATIONS[animationType];
    if (!config) {
      console.warn(`Unknown animation type: ${animationType}`);
      return;
    }

    const clone = this.createProductClone(productElement);
    if (!clone) return;

    switch (animationType) {
      case 'slide_in':
        this.animateSlideIn(clone, config);
        break;
      case 'bounce':
        this.animateBounce(clone, config);
        break;
      case 'flip':
        this.animateFlip(clone, config);
        break;
      case 'pulse':
        this.animatePulse(config);
        break;
      case 'spiral':
        this.animateSpiral(clone, config);
        break;
    }
  }

  private animateSlideIn(element: HTMLElement, config: AnimationConfig) {
    const tween = gsap.to(element, {
      duration: config.duration,
      x: 100,
      y: -100,
      opacity: 0,
      ease: config.easing,
      onComplete: () => this.cleanup(),
    });
    this.activeAnimations.push(tween);
  }

  private animateBounce(element: HTMLElement, config: AnimationConfig) {
    const tween = gsap.timeline()
      .to(
        element,
        { duration: config.duration * 0.4, y: -30, ease: 'power1.out' },
        0
      )
      .to(element, { duration: config.duration * 0.3, y: 10, ease: 'bounce.out' })
      .to(element, { duration: config.duration * 0.3, x: 100, y: -100, opacity: 0 });

    this.activeAnimations.push(tween);
    tween.eventCallback('onComplete', () => this.cleanup());
  }

  private animateFlip(element: HTMLElement, config: AnimationConfig) {
    const tween = gsap.timeline()
      .to(element, { duration: config.duration * 0.7, rotationY: 360 }, 0)
      .to(element, { duration: config.duration * 0.3, x: 100, y: -100, opacity: 0 });

    this.activeAnimations.push(tween);
    tween.eventCallback('onComplete', () => this.cleanup());
  }

  private animatePulse(_config: AnimationConfig) {
    if (!this.cartIcon) return;

    const tween = gsap.timeline()
      .to(this.cartIcon, { duration: 0.3, scale: 1.2 })
      .to(this.cartIcon, { duration: 0.3, scale: 1 });

    this.activeAnimations.push(tween);
    tween.eventCallback('onComplete', () => this.cleanup());
  }

  private animateSpiral(element: HTMLElement, config: AnimationConfig) {
    const tween = gsap.timeline()
      .to(
        element,
        {
          duration: config.duration,
          x: 100,
          y: -100,
          rotationZ: 360,
          opacity: 0,
          ease: config.easing,
        },
        0
      );

    this.activeAnimations.push(tween);
    tween.eventCallback('onComplete', () => this.cleanup());
  }

  private createProductClone(productElement: HTMLElement): HTMLElement | null {
    try {
      const clone = productElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '9999';
      clone.style.width = productElement.offsetWidth + 'px';
      clone.style.height = productElement.offsetHeight + 'px';

      const rect = productElement.getBoundingClientRect();
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';

      document.body.appendChild(clone);
      return clone;
    } catch (error) {
      console.error('Failed to create product clone:', error);
      return null;
    }
  }

  private findCartIcon(): HTMLElement | null {
    return (
      document.querySelector('[data-cart-icon]') ||
      document.querySelector('.cart-icon') ||
      document.querySelector('[aria-label*="cart"]')
    );
  }

  cleanup() {
    const element = document.querySelector('[style*="position: fixed"]');
    if (element) {
      element.remove();
    }
  }

  cleanup() {
    this.activeAnimations.forEach((tween) => tween.kill());
    this.activeAnimations = [];
  }
}
