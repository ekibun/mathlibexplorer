import * as THREE from 'three';

export default class Camera extends THREE.OrthographicCamera {
  status = {
    scale: 5,
    width: 1,
    height: 1,
    pixelRatio: 1,
    x: 0,
    y: 0,
    xrange: [0,0],
    yrange: [0,0],
  }
  constructor() {
    super(-1, 1, 1, -1, -10, 10);
  }

  /**
   * @param { typeof Camera.prototype.status } newStatus
   */
  updateStatus(newStatus) {
    const status = { ...this.status, ...newStatus };
    status.x = Math.max(status.xrange[0], Math.min(status.xrange[1], status.x));
    status.y = Math.max(status.yrange[0], Math.min(status.yrange[1], status.y));
    this.status = status;
    this.left = status.x - status.width / 2 / status.scale;
    this.right = status.x + status.width / 2 / status.scale;
    this.top = status.y + status.height / 2 / status.scale;
    this.bottom = status.y - status.height / 2 / status.scale;
    this.updateProjectionMatrix();
  }

  project([x, y, z]) {
    let vector = new THREE.Vector3(x, y, z);
    vector.project(this);
    return [(0.5 + vector.x / 2) * this.status.width, (0.5 - vector.y / 2) * this.status.height];
  }
}
