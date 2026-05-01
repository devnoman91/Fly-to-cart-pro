import { render } from 'preact';
import { CartAnimationExtension } from './cart-animation-extension';

const container = document.body;
if (container) {
  render(<CartAnimationExtension />, container);
}
