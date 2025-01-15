import * as THREE from 'three';
import rawgraph from '../import_graph.txt';

import pointVertShader from './shader/point.vert.glsl';
import pointFragShader from './shader/point.frag.glsl';

import linkVertShader from './shader/link.vert.glsl';
import linkFragShader from './shader/link.frag.glsl';

export default class GraphGroup extends THREE.Group {
  status = {
    uniforms: {
      scale: {
        value: 1.0
      },
      picking: {
        value: false
      }
    },
    hit: undefined
  }
  constructor(scene) {
    super();
    this.initGraph(rawgraph);
    const pointGeometry = this.pointGeometry;
    const xrange = [pointGeometry.boundingBox.min.x, pointGeometry.boundingBox.max.x];
    const yrange = [pointGeometry.boundingBox.min.y, pointGeometry.boundingBox.max.y];
    scene.camera.updateStatus({
      x: (xrange[0] + xrange[1]) / 2,
      y: (yrange[0] + yrange[1]) / 2,
      xrange,
      yrange
    })
    this.setAlpha([], 1.0, false);
  }

  pointMaterial = new THREE.RawShaderMaterial({
    uniforms: this.status.uniforms,
    vertexShader: pointVertShader,
    fragmentShader: pointFragShader,
    glslVersion: THREE.GLSL3,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.MaxEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor
  });

  linkMaterial = new THREE.RawShaderMaterial({
    uniforms: this.status.uniforms,
    vertexShader: linkVertShader,
    fragmentShader: linkFragShader,
    side: THREE.DoubleSide,
    glslVersion: THREE.GLSL3,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.MaxEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor
  });

  getRelates(_nodes, from, to) {
    const full = _nodes.length < 2;
    const nodes = _nodes.slice();
    const ret = _nodes.slice();
    while (nodes.length > 0) {
      const node = this.status.nodes[nodes.pop()];
      if (from) node.from.forEach((j) => {
        if (ret.includes(j)) return;
        ret.push(j);
        if(full) nodes.push(j);
      });
      if (to) node.to.forEach((j) => {
        if (ret.includes(j)) return;
        ret.push(j);
        if(full) nodes.push(j);
      });
    }
    return ret;
  }

  setAlpha(nodes = [], defaultAlpha = 0.2, showLines = false) {
    const pointAlpha = this.status.nodes.map(() => defaultAlpha);
    nodes.forEach((i) => {
      pointAlpha[i] = 1.0;
    });
    this.pointGeometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(pointAlpha), 1));
    const linkAlpha = new Array(this.status.links.length * 4);
    this.status.links.forEach((l, i) => {
      const alpha = showLines && nodes.includes(l[0]) && nodes.includes(l[1]) ? 1.0 : defaultAlpha * 0.05;
      for (var j = 0; j < 4; ++j) linkAlpha[4 * i + j] = alpha;
    });
    this.linkGeometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(linkAlpha), 1));
  }

  /**
   * @param { string } graph
   */
  initGraph(graph) {
    const lines = graph.split('\n');
    const nodeCount = Number(lines[0]);
    console.log(nodeCount);
    const nodes = new Array(nodeCount);
    const links = [];

    const cats = {};
    for (var i = 0; i < nodeCount; ++i) {
      const [name, color, x, y, size] = lines[i + 1].split(' ');
      const relate = lines[nodeCount + i + 1].trim().split(' ').map(Number);
      if (relate[0] != i || relate[1] + 2 != relate.length) throw "data assert failed";
      for (var j = 0; j < relate[1]; ++j) {
        links.push([i, relate[2 + j]]);
      }
      const [_, cat, ...func] = name.split('.');
      if (!cats[cat]) cats[cat] = {
        nodes: [],
        sumsize: 0,
        sumx: 0,
        sumy: 0
      };
      const node = {
        index: i,
        name: `${cat}\n${func.join('.')}`,
        color: new THREE.Color(color).convertLinearToSRGB(),
        from: [],
        to: relate.slice(2),
        x: Number(x),
        y: Number(y),
        size: Number(size)
      };
      nodes[i] = node;
      const catObj = cats[cat];
      catObj.sumsize += node.size;
      catObj.sumx += node.x * node.size;
      catObj.sumy += node.y * node.size;
      catObj.nodes.push(i);
    }

    // const nodes = [
    //   {
    //     name: '1',
    //     color: new THREE.Color(0,1,0),
    //     x: 50,
    //     y: 100,
    //     size: 0.1
    //   },
    //   {
    //     name: '2',
    //     color: new THREE.Color(1,0,0),
    //     x: 100,
    //     y: 50,
    //     size: 0.1
    //   }
    // ]
    // const links = [[0,1]];

    this.clear();
    const pointVerts = [];
    const pointColors = [];
    nodes.forEach((node, i) => {
      pointVerts.push(node.x, node.y, node.size);
      pointColors.push(node.color.r, node.color.g, node.color.b, i);
    });
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pointVerts), 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pointColors), 4));
    pointGeometry.computeBoundingBox();
    this.pointGeometry = pointGeometry;
    this.add(new THREE.Points(pointGeometry, this.pointMaterial));

    const linkVerts = [];
    const linkUVs = [];
    const linkColors = [];
    const indices = [];
    links.forEach((link, i) => {
      const from = nodes[link[0]];
      const to = nodes[link[1]];
      to.from.push(link[0]);
      const dir = from.y < to.y ? 1 : -1;
      linkVerts.push(
        from.x, from.y, dir,
        from.x, to.y, dir,
        to.x, from.y, dir,
        to.x, to.y, dir,
      )
      linkUVs.push(
        0, 0,
        0, 1,
        1, 0,
        1, 1
      );
      linkColors.push(
        from.color.r, from.color.g, from.color.b,
        from.color.r, from.color.g, from.color.b,
        to.color.r, to.color.g, to.color.b,
        to.color.r, to.color.g, to.color.b
      );
      indices.push(
        i * 4, i * 4 + 1, i * 4 + 2,
        i * 4 + 1, i * 4 + 3, i * 4 + 2
      );
    });
    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkVerts), 3));
    linkGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(linkUVs), 2));
    linkGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(linkColors), 3));
    linkGeometry.setIndex(indices);
    this.linkGeometry = linkGeometry;
    this.add(new THREE.Mesh(linkGeometry, this.linkMaterial));

    this.status = {
      ...this.status,
      nodes,
      links,
      cats
    }
    console.log(this.status);
  }
}