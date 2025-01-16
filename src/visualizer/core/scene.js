import * as THREE from 'three';
import Camera from './camera';
import GraphGroup from './graph';

export default class Scene {
  constructor(setState) {
    this.setState = setState;
    this.picking = new THREE.Scene();
    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new Camera();
    this.camera = camera;
    const graph = new GraphGroup(this);
    this.picking.add(graph.picking);
    this.graph = graph;
    scene.add(graph);
  }

  /**
   * @param { typeof Camera.prototype.status } newStatus
   */
  updateStatus(newStatus, preventState) {
    const { camera, graph } = newStatus;
    this.camera.updateStatus(camera);
    this.graph.status = {
      ...this.graph.status,
      ...graph
    }
    this.graph.status.uniforms.scale.value = this.camera.status.scale;
    this.graph.status.uniforms.pixelRatio.value = this.camera.status.pixelRatio;
    if (!preventState) this.setState({
      camera: this.camera.status,
      graph: this.graph.status
    });
    if (this.camera.status.width * this.camera.status.height <= 1) return;
    this._needRender = true;
  }

  /**
   * @param { THREE.Renderer } renderer
   */
  render(renderer) {
    if (!this._needRender) return;
    this._needRender = false;
    renderer.render(this.scene, this.camera);
  }

  pickingTexture = new THREE.WebGLRenderTarget(1, 1, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  pick(renderer, x, y) {
    this.camera.setViewOffset(this.camera.status.width, this.camera.status.height, x, y, 1, 1);
    renderer.setRenderTarget(this.pickingTexture);
    renderer.render(this.picking, this.camera);
    const pixelBuffer = new Float32Array(4);
    renderer.readRenderTargetPixels(this.pickingTexture, 0, 0, 1, 1, pixelBuffer);
    this.camera.setViewOffset(this.camera.status.width, this.camera.status.height, 0, 0, this.camera.status.width, this.camera.status.height);
    renderer.setRenderTarget(null);
    if (pixelBuffer[3]) return pixelBuffer[0];
  }
}