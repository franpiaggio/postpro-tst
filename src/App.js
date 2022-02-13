import {
  Color,
  HalfFloatType,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  VSMShadowMap,
  WebGLRenderer
} from "three";

import {
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  VignetteEffect
} from "postprocessing";

import { ControlMode, SpatialControls } from "spatial-controls";
import * as CornellBox from "./CornellBox.js";

/**
 * Creates the scene.
 *
 * @param {Map} assets - Preloaded scene assets.
 */

export function initialize(assets) {

  const viewport = document.body;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
	const backgroundColor = new Color(0x151515);

  // Scene, Renderer and Composer

  const scene = new Scene();

  const renderer = new WebGLRenderer({
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
    alpha: false
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(backgroundColor.convertSRGBToLinear(), 1);
	renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = sRGBEncoding;
  renderer.info.autoReset = false;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.enabled = true;

  viewport.append(renderer.domElement);

  const composer = new EffectComposer(renderer, {
    frameBufferType: HalfFloatType
  });

  // Camera and Controls

  const camera = new PerspectiveCamera(59, aspect, 0.3, 1000);
  const controls = new SpatialControls(
    camera.position,
    camera.quaternion,
    renderer.domElement
  );

	const settings = controls.settings;
  settings.general.setMode(ControlMode.THIRD_PERSON);
  settings.translation.setEnabled(false);
  settings.rotation.setSensitivity(2.2);
  settings.rotation.setDamping(0.05);
  settings.zoom.setSensitivity(0.25);
  settings.zoom.setDamping(0.1);
  settings.zoom.setRange(1.0, 10.0);
  controls.setPosition(0, 0, 3.5);

  // Lights

  scene.add(...CornellBox.createLights());

  // Objects

  scene.add(CornellBox.createEnvironment());
  scene.add(CornellBox.createActors());

  // Passes

  const smaaEffect = new SMAAEffect(
    assets.get("smaa-search"),
    assets.get("smaa-area")
  );

  smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.05);

  const noiseEffect = new NoiseEffect({ premultiply: true });
  const vignetteEffect = new VignetteEffect();

  const renderPass = new RenderPass(scene, camera);
  const effectPass = new EffectPass(
    camera,
    noiseEffect,
    vignetteEffect,
    smaaEffect
  );

  noiseEffect.blendMode.opacity.value = 0.75;

  composer.addPass(renderPass);
  composer.addPass(effectPass);

	// Resizing

  window.addEventListener("resize", (event) => {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    composer.setSize(width, height);

  });

	// Render Loop

  requestAnimationFrame(function render(timestamp) {

    requestAnimationFrame(render);
		controls.update(timestamp);
    composer.getRenderer().info.reset();
    composer.render();

  });

}
