"use client";
import { Canvas, ThreeEvent, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import {
  Component,
  ReactNode,
  Suspense,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  PerspectiveCamera,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import {
  DeviceModel,
  Landscape,
  ModelLibrary,
  useDeviceModel,
} from "./scene-models";
import { allModelUrls } from "@/data/scene-layout";
import { assets, Asset, ScenarioId } from "@/data/plant";
import { number, signalLabel } from "./device-profile";
// Preserve camera pose while widening the vertical lens on narrow screens.
function ResponsiveLens() {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov =
        (2 *
          Math.atan(
            Math.tan((43 * Math.PI) / 360) *
              Math.max(1, 1.45 / (size.width / size.height)),
          ) *
          180) /
        Math.PI;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate]);
  return null;
}
function Equipment({
  asset,
  selected,
  onSelect,
  scenario,
  target,
  severity,
}: {
  asset: Asset;
  selected: boolean;
  onSelect: (id: string) => void;
  scenario: ScenarioId | null;
  target: string;
  severity: number;
}) {
  const affected =
    target === asset.id ||
    (asset.type === "pv" && asset.related.includes(target));
  const model = useDeviceModel(asset.type);
  const selectionRadius = Math.hypot(model.size.x, model.size.z) / 2 + 0.2;
  const alertSignal = asset.signals.find(
    (s) => s.id === asset.attention?.signalId,
  );
  const ringLevel =
    asset.attention?.level ??
    (affected && scenario === "fault"
      ? "critical"
      : affected && scenario === "dust"
        ? "warning"
        : null);
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(asset.id);
  };
  return (
    <group
      position={asset.position}
      name={asset.id}
      userData={{ assetId: asset.id, pickHeight: model.size.y / 2 }}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <DeviceModel model={model} />
      <mesh visible={false} position={[0, model.size.y / 2, 0]}>
        <boxGeometry
          args={[
            Math.max(model.size.x, 1.6),
            model.size.y,
            Math.max(model.size.z, 1.4),
          ]}
        />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
      {(selected || ringLevel) && (
        <mesh
          name="device-ring"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.045, 0]}
        >
          <ringGeometry
            args={[
              selectionRadius,
              selectionRadius + (ringLevel ? 0.28 : 0.12),
              96,
            ]}
          />
          <meshBasicMaterial
            color={
              ringLevel === "critical"
                ? "#e44538"
                : ringLevel === "warning"
                  ? "#e9b323"
                  : "#5affd3"
            }
            transparent
            opacity={
              asset.attention || scenario !== "dust" || !affected
                ? 0.95
                : 0.45 + severity / 200
            }
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      )}
      {affected && scenario === "cloud" && (
        <group position={[0, 5, 0]}>
          {[-2, 0, 2].map((x, i) => (
            <mesh key={x} position={[x, i % 2, 0]}>
              <sphereGeometry args={[2.4, 16, 12]} />
              <meshStandardMaterial
                color="#b6c7d2"
                transparent
                opacity={0.3 + severity / 200}
              />
            </mesh>
          ))}
        </group>
      )}
      {selected && (
        <Html position={model.label} center zIndexRange={[3, 0]}>
          <button
            className={`scene-label ${asset.attention ? "scene-label-attention" : ""}`}
            onClick={() => onSelect(asset.id)}
          >
            {asset.id}
            <span>{asset.type === "pv" ? "Cụm pin đại diện" : asset.name}</span>
            {asset.attention && alertSignal && (
              <span className={`scene-label-reading ${asset.attention.level}`}>
                <small>
                  {asset.operation} · {signalLabel(asset, alertSignal)}
                </small>
                <strong>
                  {alertSignal.value === null ? "—" : number(alertSignal.value)}{" "}
                  <em>{alertSignal.unit}</em>
                </strong>
              </span>
            )}
          </button>
        </Html>
      )}
    </group>
  );
}
function CameraFocus({
  controls,
  selected,
  request,
  reset,
}: {
  controls: React.RefObject<Controls | null>;
  selected: string | null;
  request: number;
  reset: number;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const last = useRef({ request: 0, reset });
  const flight = useRef<{
    from: Vector3;
    to: Vector3;
    targetFrom: Vector3;
    targetTo: Vector3;
    started: number;
  } | null>(null);
  const cancel = useCallback(() => {
    flight.current = null;
    if (controls.current) controls.current.enableDamping = true;
    gl.domElement.dataset.cameraMoving = "false";
  }, [controls, gl]);
  useEffect(() => {
    gl.domElement.dataset.cameraMoving = "false";
    const orbit = controls.current;
    if (!orbit) return;
    orbit.addEventListener("start", cancel);
    return () => {
      orbit.removeEventListener("start", cancel);
      cancel();
    };
  }, [controls, cancel, gl]);
  useEffect(() => {
    if (reset !== last.current.reset) {
      last.current = { reset, request };
      cancel();
      return;
    }
    if (request === last.current.request) return;
    last.current.request = request;
    const asset = assets.find((a) => a.id === selected),
      orbit = controls.current;
    if (!asset || !orbit) return;
    gl.domElement.dataset.focusRequest = String(request);
    gl.domElement.dataset.focusTarget = asset.id;
    const from = camera.position.clone(),
      targetFrom = orbit.target.clone();
    const direction = from.clone().sub(targetFrom).normalize();
    const distance = asset.type === "pv" ? 41 : 31;
    const targetTo = new Vector3(...asset.position);
    targetTo.y += asset.type === "weather" ? 2 : 1;
    camera.updateMatrixWorld();
    const halfHeight =
      distance * Math.tan(((camera as PerspectiveCamera).fov * Math.PI) / 360);
    targetTo.addScaledVector(
      new Vector3().setFromMatrixColumn(camera.matrixWorld, 0),
      halfHeight *
        (size.width / size.height) *
        (size.width < 600 ? 0.38 : 0.18),
    );
    if (size.width < 600)
      targetTo.addScaledVector(
        new Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
        halfHeight * 0.34,
      );
    const to = targetTo.clone().addScaledVector(direction, distance);
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.enableDamping = damping;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.copy(to);
      orbit.target.copy(targetTo);
      orbit.update();
      cancel();
      invalidate();
      return;
    }
    orbit.enableDamping = false;
    flight.current = {
      from,
      to,
      targetFrom,
      targetTo,
      started: performance.now(),
    };
    gl.domElement.dataset.cameraMoving = "true";
    invalidate();
  }, [
    request,
    selected,
    reset,
    camera,
    controls,
    gl,
    invalidate,
    size.width,
    size.height,
    cancel,
  ]);
  useFrame(() => {
    const state = flight.current,
      orbit = controls.current;
    if (!state || !orbit) return;
    const t = Math.min(1, (performance.now() - state.started) / 650),
      ease = t * t * (3 - 2 * t);
    camera.position.lerpVectors(state.from, state.to, ease);
    orbit.target.lerpVectors(state.targetFrom, state.targetTo, ease);
    orbit.update();
    if (t === 1) cancel();
    invalidate();
  });
  return null;
}
function ContextWatch({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      if (!canvas.isConnected) return;
      event.preventDefault();
      onLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}
// Read-only renderer observations for integration checks, without a user-facing debug panel.
function RendererObservations() {
  useFrame(({ gl, scene, camera }) => {
    const projections: Record<string, number[]> = {};
    const colors: Record<string, string> = {};
    const rings: Record<string, string> = {};
    scene.traverse((node) => {
      if (!node.userData.assetId) return;
      const id = node.userData.assetId as string;
      const point = node.getWorldPosition(new Vector3());
      point.y += node.userData.pickHeight;
      point.project(camera);
      projections[id] = [(point.x + 1) / 2, (1 - point.y) / 2];
      const ring = node.getObjectByName("device-ring");
      if (ring instanceof Mesh && ring.material instanceof MeshBasicMaterial)
        rings[id] = ring.material.color.getHexString();
      node.traverse((child) => {
        if (child instanceof Mesh)
          for (const material of [child.material].flat())
            if (
              material instanceof MeshStandardMaterial &&
              /^(PV_CELLS|INV_BODY|TR_BODY|MET_MAST|GW_BODY)$/.test(
                material.name,
              )
            )
              colors[id] = material.color.getHexString();
      });
    });
    gl.domElement.dataset.deviceProjections = JSON.stringify(projections);
    gl.domElement.dataset.deviceColors = JSON.stringify(colors);
    gl.domElement.dataset.deviceRings = JSON.stringify(rings);
    gl.domElement.dataset.cameraPosition = JSON.stringify(
      camera.position.toArray(),
    );
    gl.domElement.dataset.renderCalls = String(gl.info.render.calls);
    gl.domElement.dataset.renderTriangles = String(gl.info.render.triangles);
  });
  return null;
}
function World({
  onReady,
  children,
}: {
  onReady: () => void;
  children: ReactNode;
}) {
  const models = useGLTF(allModelUrls);
  const library = useMemo(
    () => Object.fromEntries(allModelUrls.map((url, i) => [url, models[i]])),
    [models],
  );
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <ModelLibrary.Provider value={library}>
      <Landscape />
      {children}
      <RendererObservations />
    </ModelLibrary.Provider>
  );
}
// Keep the WebGL renderer alive when an individual network/model load fails.
class AssetBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
class SceneBoundary extends Component<
  { children: ReactNode; retry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-message" role="alert">
        <strong>Không thể tải cảnh 3D</strong>
        <p>
          Hãy thử lại hoặc kiểm tra kết nối. Bạn vẫn có thể chọn thiết bị trong
          danh sách.
        </p>
        <button onClick={this.props.retry}>Thử lại cảnh 3D</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function PlantScene(props: {
  selected: string | null;
  focusRequest: number;
  onSelect: (id: string) => void;
  reset: number;
  scenario: ScenarioId | null;
  target: string;
  severity: number;
}) {
  const controls = useRef<Controls>(null);
  const [ready, setReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const markModelError = useCallback(() => {
    setReady(false);
    setModelFailed(true);
  }, []);
  const markReady = useCallback(() => setReady(true), []);
  const [attempt, setAttempt] = useState(0);
  const [supported, setSupported] = useState<boolean | null>(null);
  const markLost = useCallback(() => {
    setReady(false);
    setSupported(false);
  }, []);
  const retryModels = useCallback(() => {
    useGLTF.clear(allModelUrls);
    allModelUrls.forEach((url) => useGLTF.clear(url));
    setReady(false);
    setModelFailed(false);
    setAttempt((n) => n + 1);
  }, []);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    setSupported(Boolean(gl));
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }, [attempt]);
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    // Flush residual damping/zoom before restoring the saved overview.
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.reset();
    orbit.enableDamping = damping;
  }, [props.reset]);
  if (supported === false)
    return (
      <div className="scene-message" role="alert">
        <strong>WebGL chưa khả dụng</strong>
        <p>
          Bật tăng tốc đồ họa để khám phá 3D. Danh sách thiết bị vẫn hoạt động.
        </p>
        <button onClick={retryModels}>Thử lại cảnh 3D</button>
      </div>
    );
  return (
    <SceneBoundary key={attempt} retry={retryModels}>
      {modelFailed && (
        <div className="scene-message" role="alert">
          <strong>Không thể tải cảnh 3D</strong>
          <p>
            Hãy thử lại hoặc kiểm tra kết nối. Bạn vẫn có thể chọn thiết bị
            trong danh sách.
          </p>
          <button onClick={retryModels}>Thử lại cảnh 3D</button>
        </div>
      )}
      {!ready && !modelFailed && (
        <div className="scene-loading" role="status">
          Đang chuẩn bị nhà máy 3D…
        </div>
      )}
      {supported && (
        <Canvas
          frameloop="demand"
          shadows
          camera={{ position: [49, 46, 58], fov: 43 }}
          dpr={[1, 1.5]}
          aria-label="Nhà máy 3D: kéo để xoay, cuộn để zoom"
        >
          <ContextWatch onLost={markLost} />
          <ResponsiveLens />
          <color attach="background" args={["#e8f5fa"]} />
          <fog attach="fog" args={["#e8f5fa", 85, 170]} />
          <ambientLight intensity={0.65} />
          <hemisphereLight args={["#cce9ff", "#b5cbb5", 1.4]} />
          <directionalLight
            castShadow
            position={[-25, 45, 20]}
            intensity={2.3}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-55}
            shadow-camera-right={55}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-far={160}
            shadow-normalBias={0.06}
            shadow-bias={-0.0002}
          />
          <AssetBoundary onError={markModelError}>
            <Suspense fallback={null}>
              <World onReady={markReady}>
                {assets.map((asset) => (
                  <Equipment
                    key={asset.id}
                    asset={asset}
                    selected={props.selected === asset.id}
                    onSelect={props.onSelect}
                    scenario={props.scenario}
                    target={props.target}
                    severity={props.severity}
                  />
                ))}
              </World>
            </Suspense>
          </AssetBoundary>
          <OrbitControls
            ref={controls}
            makeDefault
            target={[0, 0, 0]}
            minDistance={18}
            maxDistance={110}
            maxPolarAngle={Math.PI / 2.15}
            enablePan={false}
          />
          <CameraFocus
            controls={controls}
            selected={props.selected}
            request={props.focusRequest}
            reset={props.reset}
          />
        </Canvas>
      )}
    </SceneBoundary>
  );
}
