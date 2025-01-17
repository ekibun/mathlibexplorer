import * as THREE from 'three';
import rawgraph from '../import_graph.txt';

import pointVertShader from './shader/point.vert.glsl';
import pointFragShader from './shader/point.frag.glsl';

import pickVertShader from './shader/pick.vert.glsl';
import pickFragShader from './shader/pick.frag.glsl';

import linkVertShader from './shader/link.vert.glsl';
import linkFragShader from './shader/link.frag.glsl';

export default class GraphGroup extends THREE.Group {
  status = {
    uniforms: {
      scale: {
        value: 1.0
      },
      pixelRatio: {
        value: 1.0
      }
    },
    hit: undefined
  }
  constructor(scene) {
    super();
    this.picking = new THREE.Group();
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
    this.setAlpha();
  }

  pickMaterial = new THREE.RawShaderMaterial({
    uniforms: this.status.uniforms,
    vertexShader: pickVertShader,
    fragmentShader: pickFragShader,
    glslVersion: THREE.GLSL3,
    depthTest: true,
    depthWrite: true
  });

  pointMaterial = new THREE.RawShaderMaterial({
    uniforms: this.status.uniforms,
    vertexShader: pointVertShader,
    fragmentShader: pointFragShader,
    glslVersion: THREE.GLSL3,
    depthTest: true,
    depthWrite: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.MaxEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor
  });

  getRelates(_nodes, from, to, iter) {
    const stack = _nodes.slice();
    const retNode = _nodes.slice();
    const retLink = [];
    while (stack.length > 0) {
      const node = this.status.nodes[stack.pop()];
      node.from.forEach((j) => {
        if (retLink.includes(j)) return;
        const relNode = this.status.links[j][0];
        if (from || retNode.includes(relNode)) retLink.push(j);
        if (!from || retNode.includes(relNode)) return;
        retNode.push(relNode);
        if (iter) stack.push(relNode);
      });
      node.to.forEach((j) => {
        if (retLink.includes(j)) return;
        const relNode = this.status.links[j][1];
        if (to || retNode.includes(relNode)) retLink.push(j);
        if (!to || retNode.includes(relNode)) return;
        retNode.push(relNode);
        if (iter) stack.push(relNode);
      });
    }
    return [retNode, retLink];
  }

  setAlpha([nodes, links] = []) {
    const reset = !nodes || !links;
    const defaultAlpha = reset ? 0.8 : 0.2
    const showLines = !reset;
    const pointAlpha = this.status.nodes.map(() => defaultAlpha);
    nodes?.forEach((i) => {
      pointAlpha[i] = 1.0;
    });
    const lineAlpha = this.status.links.map((_, i) => defaultAlpha * 0.05);
    if(showLines) links?.forEach((i) => {
      lineAlpha[i] = 1.0;
    });

    const begin = Date.now();
    this.animateAlpha = () => {
      const delta = Math.min(1, (Date.now() - begin)/500);
      const pointAttribute = this.pointGeometry.getAttribute('alpha');
      pointAlpha.forEach((v, i) => {
        pointAttribute.array[i] = pointAttribute.array[i] * (1 - delta) + delta * v;
      });
      pointAttribute.needsUpdate = true;
      this.linkUniforms.forEach((v, i) => {
        v.value = v.value * (1 - delta) + delta * lineAlpha[i];
      });
      if (delta === 1) this.animateAlpha = undefined;
      return true;
    };
  }

  animate() {
    if(this.animateAlpha) return this.animateAlpha();
  }

  /**
   * @param { string } graph
   */
  initGraph(graph) {
    const lines = graph.split('\n');
    const nodeCount = Number(lines[0]);
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
        cat: func.length ? cat : '',
        name: func.length ? func.join('.') : cat,
        path: name.replaceAll('.', '/')+".lean",
        color: new THREE.Color(color).convertLinearToSRGB(),
        from: [],
        to: [],
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

    this.clear();
    const pointVerts = [];
    const pointColors = [];
    nodes.forEach((node, i) => {
      pointVerts.push(node.x, node.y, node.size);
      pointColors.push(node.color.r, node.color.g, node.color.b, i);
    });
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pointVerts), 3));
    pointGeometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(nodes.length), 1));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pointColors), 4));
    pointGeometry.computeBoundingBox();
    this.pointGeometry = pointGeometry;
    this.add(new THREE.Points(pointGeometry, this.pointMaterial));
    this.picking.add(new THREE.Points(pointGeometry, this.pickMaterial));

    const lineSplit = 20;

    const linkUniforms = [];

    links.forEach((link, i) => {
      const from = nodes[link[0]];
      const to = nodes[link[1]];
      from.to.push(i);
      to.from.push(i);

      const linkVerts = [];
      const linkColors = [];
      for (var j = 0; j < lineSplit; ++j) {
        const x = j / (lineSplit - 1);
        const y = (1 - Math.cos(x * Math.PI)) / 2;
        linkVerts.push(
          from.x + x * (to.x - from.x),
          from.y + y * (to.y - from.y),
          0
        )
        linkColors.push(
          from.color.r + x * (to.color.r - from.color.r),
          from.color.g + x * (to.color.g - from.color.g),
          from.color.b + x * (to.color.b - from.color.b),
        );
      }
      const linkGeometry = new THREE.BufferGeometry();
      linkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkVerts), 3));
      linkGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(linkColors), 3));
      const alpha = { value: 0 }
      linkUniforms[i] = alpha;
      this.add(new THREE.Line(linkGeometry, new THREE.RawShaderMaterial({
        uniforms: {
          ...this.status.uniforms,
          alpha
        },
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
      })));
    });
    this.linkUniforms = linkUniforms;

    this.status = {
      ...this.status,
      nodes,
      links,
      cats
    }
  }
}