import { WebGLRenderer } from 'three';
import Scene from './scene';

export const tree = 'eec581e576bee4a9c19a608976f8a1e87c5b6ed5';

function getDoc(code) {
  const regex = /(-\/|\/-[\-!]?)/g;
  let depth = 0;
  let lastBegin = -1;
  let ret = "";
  let match;
  while ((match = regex.exec(code)) !== null) {
    console.log(match);
    switch (match[0]) {
      case '-/':
        depth -= 1;
        if(depth === 0 && lastBegin > -1){
          ret += code.substring(lastBegin, match.index);
          lastBegin = match.index + match[0].length;
        }
        break;
      default:
        if(depth === 0){
          lastBegin = match[0] == '/-!' ? match.index + match[0].length : -1;
        }
        depth +=1;
        break;
    }
  }
  return ret;
}

export default class Visualizer {
  startRenderLoop() {
    const loop = () => {
      if (this._isDestroy) return;
      this.resize();
      if(this.scene.graph.animate()) {
        this.scene._needRender = true;
      };
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * @param { HTMLCanvasElement } canvas
   */
  constructor(canvas, setState) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({
      canvas,
      context: canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: false }),
    });
    this.scene = new Scene(setState);

    this.startRenderLoop();
  }

  _isDestroy = false;
  destroy() {
    this._isDestroy = true;
  }

  resize() {
    const status = this.scene.camera.status;
    const container = this.canvas.parentElement;
    if (status.width === container.clientWidth
      && status.height === container.clientHeight
      && status.pixelRatio === window.devicePixelRatio
    ) return;
    this.scene.updateStatus({
      camera: {
        width: container.clientWidth,
        height: container.clientHeight,
        pixelRatio: window.devicePixelRatio,
      }
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  render() {
    this.scene.render(this.renderer);
  }

  getDistance(e1, e2) {
    const dx = e2.clientX - e1.clientX;
    const dy = e2.clientY - e1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  hitInfo = {}

  toggleHit(newHit) {
    if (newHit === this.hitInfo.hit) {
      this.hitInfo.mode = (this.hitInfo.mode + 1) % 4;
    } else {
      this.hitInfo = {
        hit: newHit,
        mode: 1
      }
      if(newHit?.path && !newHit?.markdown) fetch(`https://raw.githubusercontent.com/leanprover-community/mathlib4/${tree}/${newHit.path}.lean`).then(
        async (rsp) => {
          const text = await rsp.text();
          newHit.markdown = getDoc(text).trim();
          this.scene.updateStatus({ graph: { pick: this.hitInfo.mode ? newHit : undefined } });
        }
      );
    }
    const isArray = Array.isArray(newHit);
    if (!newHit) {
      this.scene.graph.setAlpha();
    } else switch (this.hitInfo.mode) {
      case 0:
        this.scene.graph.setAlpha();
        break;
      case 1:
        this.scene.graph.setAlpha(
          this.scene.graph.getRelates(isArray ? newHit : [newHit.index], !isArray, !isArray, false));
        break;
      case 2:
        this.scene.graph.setAlpha(
          this.scene.graph.getRelates(isArray ? newHit : [newHit.index], false, true, !isArray));
        break;
      case 3:
        this.scene.graph.setAlpha(
          this.scene.graph.getRelates(isArray ? newHit : [newHit.index], true, false, !isArray));
        break;
    }
    this.scene.updateStatus({ graph: { pick: this.hitInfo.mode ? newHit : undefined } });
  }

  /**
   * @param { PointerEvent } event
   */
  onClick(event) {
    const p = this.scene.pick(this.renderer, event.clientX, event.clientY);
    this.toggleHit(p === undefined ? undefined : this.scene.graph.status.nodes[p]);
  }

  /**
   * @param { PointerEvent } event
   */
  onPointerMove(event) {
    event.preventDefault();
    const dx = event.movementX;
    const dy = event.movementY;
    const isPrimary = (event.pointerType === 'mouse' && event.buttons == 1) || (event.pointerType === 'touch' && event.isPrimary);
    if (isPrimary) {
      let { x, y, scale } = this.scene.camera.status;
      this.scene.updateStatus({ camera: { x: x - dx / scale, y: y + dy / scale } });
      return true;
    }
    if (event.pointerType === 'mouse') {
      const p = this.scene.pick(this.renderer, event.clientX, event.clientY);
      this.scene.updateStatus({ graph: { hit: p } });
    }
    return false;
  }

  /**
   * @param { WheelEvent } event
   */
  onWheel({ deltaY }) {
    const status = this.scene.camera.status;
    const scale = status.scale * (1 - 0.2 * Math.sign(deltaY));
    this.scene.updateStatus({
      camera: {
        scale: scale
      }
    });
  }

  /**
   * @param { TouchEvent } event
   */
  onTouchStart(e) {
    if (e.touches.length === 2) {
      this.isTouching = true;
      this.lastDist = getDistance(e.touches[0], e.touches[1]);
    }
  }

  /**
 * @param { TouchEvent } event
 */
  onTouchMove(e) {
    if (this.isTouching && e.touches.length === 2) {
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const status = this.scene.camera.status;
      const scale = status.scale * newDist / this.lastDist;
      this.scene.updateStatus({
        camera: {
          scale: scale
        }
      });

      this.lastDist = newDist; // 更新最后一次触摸的距离
    }
  }

  /**
  * @param { TouchEvent } event
  */
  onTouchEnd(e) {
    if (e.touches.length < 2) {
      this.isTouching = false;
    }
  }
}

function getDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}