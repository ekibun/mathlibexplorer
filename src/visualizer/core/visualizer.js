import { WebGLRenderer } from 'three';
import Scene from './scene';

export default class Visualizer {
  startRenderLoop() {
    const loop = () => {
      if (this._isDestroy) return;
      this.resize();
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

  // /**
  //  * @param { PointerEvent } event
  //  */
  // onPointerDown(event) {
  //   if (event.pointerType === 'mouse' && event.button == 0) {
  //     this.down = {
  //       x: event.clientX,
  //       y: event.clientY,
  //       t: Date.now()
  //     };
  //   }
  //   if (event.pointerType === 'touch') {
  //     if (event.isPrimary) {
  //       this.down = {
  //         x: event.clientX,
  //         y: event.clientY,
  //         t: Date.now()
  //       };
  //       // 当第一个触摸点按下时，记录起始信息
  //       this.initialDistance = 0;
  //       this.isZooming = false;  // 重置缩放状态
  //     } else {
  //       // 当第二个触摸点按下时，开始计算缩放
  //       this.down = {};
  //       this.isZooming = true;
  //       this.initialDistance = this.getDistance(event, event.target);
  //       console.log(this.initialDistance);
  //     }
  //   }
  //   return true;
  // }

  // down = {}
  hitInfo = {}

  toggleHit(newHit) {
    if (newHit === this.hitInfo.hit) {
      this.hitInfo.mode = (this.hitInfo.mode + 1) % 4;
    } else {
      this.hitInfo = {
        hit: newHit,
        mode: 1
      }
    }
    const isArray = Array.isArray(newHit);
    if(!newHit) {
      this.scene.graph.setAlpha([], 1.0, true);
    } else switch (this.hitInfo.mode) {
      case 0:
        this.scene.graph.setAlpha([], 1.0, true);
        break;
      case 1:
        this.scene.graph.setAlpha(
          isArray ? newHit : [
            newHit.index, ...newHit.from, ...newHit.to
          ], 0.1, true);
        break;
      case 2:
        this.scene.graph.setAlpha(
          this.scene.graph.getRelates(isArray ? newHit : [newHit.index], false, true),
          0.1, true);
        break;
      case 3:
        this.scene.graph.setAlpha(
          this.scene.graph.getRelates(isArray ? newHit : [newHit.index], true, false),
          0.1, true);
        break;
    }
    this.scene.updateStatus({ graph: { pick: this.hitInfo.mode ? newHit : undefined } });
    this.scene._needRender = true;
  }

  /**
   * @param { PointerEvent } event
   */
  onClick(event) {
    const p = this.scene.pick(this.renderer, event.clientX, event.clientY);
    this.toggleHit(p && this.scene.graph.status.nodes[p]);
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
    const p = this.scene.pick(this.renderer, event.clientX, event.clientY);
    this.scene.updateStatus({ graph: { hit: p } });
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
}
