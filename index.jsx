import getCaretCoordinates from 'textarea-caret';
import ReactDOM from 'react-dom';
import throttle from 'lodash.throttle';
import React, { PropTypes } from 'react';

const MAX_PARTICLES = 500;
const PARTICLE_NUM_RANGE = () => 5 + Math.round(Math.random() * 5);
const PARTICLE_GRAVITY = 0.075;
const PARTICLE_ALPHA_FADEOUT = 0.96;
const PARTICLE_VELOCITY_RANGE = {
  x: [-1, 1],
  y: [-3.5, -1.5]
};
const COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#bcbd22',
  '#17becf'
];

class RagePower extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    onInput: PropTypes.func,
    colors: PropTypes.array
  }

  static defaultProps = {
    colors: COLORS
  }

  constructor(props, context) {
    super(props, context);
    this._drawFrame = this._drawFrame.bind(this);
    this._onInput = this._onInput.bind(this);
    this._shake = throttle(this._shake.bind(this), 100, { trailing: false });
    this._spawnParticles = throttle(this._spawnParticles.bind(this), 25, { trailing: false });
    this._particles = [];
  }

  componentDidMount() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvasContext = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    window.requestAnimationFrame(this._drawFrame);
  }

  componentWillUnmount() {
    document.body.removeChild(this.canvas);
  }

  render() {
    const { children, style, colors: _, ...others } = this.props;
    const newChildren = React.cloneElement(children, {
      onInput: this._onInput
    });

    return (
      <div
        {...others}
        style={{ position: 'relative', ...style }}
        ref={(ref) => this.node = ref}
      >
        { newChildren }
      </div>
    );
  }

  /**
   * Following code is ported from: https://atom.io/packages/power-mode
   */
  _drawFrame() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._particles.forEach((particle) => {
      particle.velocity.y += PARTICLE_GRAVITY;
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha *= PARTICLE_ALPHA_FADEOUT;

      this.canvasContext.fillStyle = `rgba(${particle.color.join(',')}, ${particle.alpha})`;
      this.canvasContext.fillRect(Math.round(particle.x - 1), Math.round(particle.y - 1), 3, 3);
    });
    this._particles = this._particles
      .slice(Math.max(this._particles.length - MAX_PARTICLES, 0))
      .filter((particle) => particle.alpha > 0.1);
    window.requestAnimationFrame(this._drawFrame);
  }

  _shake() {
    const intensity = 1 + 2 * Math.random();
    const x = intensity * (Math.random() > 0.5 ? -1 : 1);
    const y = intensity * (Math.random() > 0.5 ? -1 : 1);

    this.node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    setTimeout(() => this.node.style.transform = '', 75);
  }

  _spawnParticles(x, y) {
    const { colors } = this.props;
    const numParticles = PARTICLE_NUM_RANGE();
    for (let i = 0; i < numParticles; i++) {
      const colorCode = colors[i % colors.length];
      const r = parseInt(colorCode.slice(1, 3), 16);
      const g = parseInt(colorCode.slice(3, 5), 16);
      const b = parseInt(colorCode.slice(5, 7), 16);
      const color = [r, g, b];
      this._particles.push(this._createParticle(x, y, color));
    }
  }

  _createParticle(x, y, color) {
    return {
      x,
      y: y,
      alpha: 1,
      color,
      velocity: {
        x: PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
          (PARTICLE_VELOCITY_RANGE.x[1] - PARTICLE_VELOCITY_RANGE.x[0]),
        y: PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
          (PARTICLE_VELOCITY_RANGE.y[1] - PARTICLE_VELOCITY_RANGE.y[0])
      }
    };
  }

  _onInput(...args) {
    const { onInput } = this.props;
    onInput && onInput(...args);
    this._shake();
    const target = args[0].target;
    const origin = target.getBoundingClientRect();
    const { top, left } = getCaretCoordinates(target, target.selectionEnd);
    const charHeight = parseInt(getComputedStyle(target)['font-size']);
    setTimeout(() => this._spawnParticles(left + origin.left, top + origin.top + charHeight), 0);
  }
}

export default RagePower;
