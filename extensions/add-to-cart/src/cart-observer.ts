interface CartObserverOptions {
  onAddToCart: (event: CartAddEvent) => void;
}

interface CartAddEvent {
  productId: string;
  productElement: HTMLElement;
  timestamp: number;
}

export class CartObserver {
  private options: CartObserverOptions;
  private mutationObserver: MutationObserver | null = null;
  private cartDrawerObserver: MutationObserver | null = null;

  constructor(options: CartObserverOptions) {
    this.options = options;
  }

  start() {
    this.observeCartDrawer();
    this.observeAddToCartButton();
  }

  stop() {
    this.mutationObserver?.disconnect();
    this.cartDrawerObserver?.disconnect();
  }

  private observeAddToCartButton() {
    // Listen for button clicks on "Add to Cart" buttons
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const addToCartBtn = target.closest('[data-add-to-cart], button[type="submit"]');

      if (addToCartBtn && this.isAddToCartButton(addToCartBtn)) {
        const productElement = this.getProductElement(addToCartBtn);
        if (productElement) {
          const productId = this.extractProductId(productElement);
          setTimeout(() => {
            this.options.onAddToCart({
              productId,
              productElement,
              timestamp: Date.now(),
            });
          }, 100);
        }
      }
    });
  }

  private observeCartDrawer() {
    // Listen for cart drawer opening (item added)
    this.cartDrawerObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.target as HTMLElement).classList.contains('cart-drawer-visible')
        ) {
          // Cart drawer became visible, item was added
          const productElement = document.querySelector('[data-product-image]');
          if (productElement) {
            this.options.onAddToCart({
              productId: this.extractProductId(productElement),
              productElement: productElement as HTMLElement,
              timestamp: Date.now(),
            });
          }
        }
      }
    });

    const cartDrawer = document.querySelector('[data-cart-drawer]');
    if (cartDrawer) {
      this.cartDrawerObserver.observe(cartDrawer, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  }

  private isAddToCartButton(element: HTMLElement): boolean {
    const text = element.textContent?.toLowerCase() || '';
    return (
      text.includes('add to cart') ||
      text.includes('add to bag') ||
      element.hasAttribute('data-add-to-cart')
    );
  }

  private getProductElement(button: HTMLElement): HTMLElement | null {
    return button.closest('[data-product]') || document.querySelector('[data-product]');
  }

  private extractProductId(element: HTMLElement): string {
    return (
      element.dataset.productId ||
      element.dataset.product ||
      element.getAttribute('data-product-id') ||
      ''
    );
  }
}
