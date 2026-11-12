"use client";
import { resolvePlantAsset } from "@/lib/plant-assets";
import { getHongLiemBlock } from "@/data/hong-liem-blocks";
import { usePlant } from "./plant-context";
import { HongLiemLandscape } from "./hong-liem-landscape";
import { hongLiemCamera, hongLiemFields } from "@/data/hong-liem-layout";
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
  Color,
  PerspectiveCamera,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Vector3,
  DoubleSide,
  MOUSE,
  TOUCH,
} from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import {
  DeviceModel,
  Landscape,
  ModelLibrary,
  useDeviceModel,
} from "./scene-models";
import { allModelUrls } from "@/data/scene-layout";
import { Asset, ScenarioId } from "@/data/plant";
import { number, signalLabel } from "./device-profile";
import { assetStatus } from "@/lib/asset-status";
import { PowerNetwork } from "./power-network";
import type { PowerLink } from "@/lib/power-network";
import type { Line2 } from "three-stdlib";
import type { HeatmapReading } from "@/lib/history-presentation";
import { TriangleAlert } from "lucide-react";
// Preserve camera pose while widening the vertical lens on narrow screens.
function ResponsiveLens({ minimumAspect = 1.45 }: { minimumAspect?: number }) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov =
        (2 *
          Math.atan(
            Math.tan((43 * Math.PI) / 360) *
              Math.max(1, minimumAspect / (size.width / size.height)),
          ) *
          180) /
        Math.PI;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate, minimumAspect]);
  return null;
}
function Equipment({
  asset,
  selected,
  onSelect,
  scenario,
  target,
  severity,
  historical,
  reading,
}: {
  asset: Asset;
  selected: boolean;
  onSelect: (id: string) => void;
  scenario: ScenarioId | null;
  target: string;
  severity: number;
  historical?: boolean;
  reading?: HeatmapReading;
}) {
  const affected = Boolean(asset.scenario);
  const model = useDeviceModel(asset.type);
  const [hovered, setHovered] = useState(false);
  const dusty =
    affected && scenario === "dust" && asset.type === "pv" && severity > 0;
  useLayoutEffect(() => {
    for (const material of model.materials) {
      if (material.name !== "PV_CELLS") continue;
      material.color.copy(material.userData.baseColor);
      material.roughness = 0.4;
      if (reading) {
        material.color.set(reading.color);
        continue;
      }
      if (dusty) {
        material.color.lerp(new Color("#c29658"), 0.6 + severity / 250);
        material.roughness = 1;
      }
    }
  }, [model, dusty, severity, reading]);

  const outlineMaterial = useRef<MeshBasicMaterial>(null);
  const alertSignal = asset.signals.find(
    (s) => s.id === asset.attention?.signalId,
  );
  const status = assetStatus(asset);
  const ringLevel = status.level;
  const baseOpacity =
    asset.attention || scenario !== "dust" || !affected
      ? 0.95
      : 0.45 + severity / 200;
  useLayoutEffect(() => {
    if (!selected && outlineMaterial.current)
      outlineMaterial.current.opacity = baseOpacity;
  }, [selected, baseOpacity, ringLevel, historical]);
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.button !== 0 || e.delta > 4) return;
    e.stopPropagation();
    if (historical && !reading) return;
    setHovered(false);
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
        if (e.pointerType !== "touch" && e.buttons === 0) setHovered(true);
        document.body.style.cursor =
          historical && !reading ? "default" : "pointer";
      }}
      onPointerDown={() => setHovered(false)}
      onPointerOut={() => {
        setHovered(false);
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
      <mesh
        name="device-footprint"
        geometry={model.footprint}
        position={[0, 0.045, 0]}
      >
        <meshBasicMaterial
          ref={outlineMaterial}
          color={
            historical
              ? selected
                ? "#2563eb"
                : reading?.quality === "partial"
                  ? "#a16207"
                  : "#93a6b8"
              : ringLevel === "critical"
                ? "#e44538"
                : ringLevel === "warning"
                  ? "#e9b323"
                  : "#19a86b"
          }
          transparent
          opacity={
            asset.attention || scenario !== "dust" || !affected
              ? 0.95
              : 0.45 + severity / 200
          }
          toneMapped={false}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {(selected || (!historical && ringLevel === "critical")) && (
        <SelectionPulse material={outlineMaterial} />
      )}
      {!historical && ringLevel === "critical" && asset.type !== "pv" && (
        <Html
          position={[model.label.x, model.label.y + 1.8, model.label.z]}
          center
          zIndexRange={[2, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="scene-critical-marker"
            role="note"
            aria-label={`Cảnh báo ${asset.id}: ${status.label}`}
          >
            <TriangleAlert size={14} aria-hidden="true" />
            <span>
              <strong>{asset.id}</strong>
              <small>
                Cảnh báo
                {asset.operatingState === "stopped" ? " · Dừng phát điện" : ""}
              </small>
              {selected && (
                <span className="selection-marker">Đang chọn · {asset.id}</span>
              )}
            </span>
          </span>
        </Html>
      )}
      {selected &&
        (historical || ringLevel !== "critical" || asset.type === "pv") && (
          <Html
            position={[model.label.x, model.label.y + 0.4, model.label.z]}
            center
            zIndexRange={[2, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="selection-marker">Đang chọn · {asset.id}</span>
          </Html>
        )}
      {scenario === "cloud" &&
        asset.type === "pv" &&
        asset.scenario?.kind === "cloud" &&
        severity > 0 && (
          <group name="cloud-preview" position={[0, 7, 0]}>
            {[-3, 0, 3].map((x, i) => (
              <mesh
                key={x}
                position={[x, (i % 2) * 0.6, 0]}
                scale={[1.3, 0.6, 2.2]}
                castShadow
                raycast={() => {}}
              >
                <sphereGeometry args={[2.6, 16, 12]} />
                <meshStandardMaterial
                  color="#e1e7ec"
                  transparent
                  opacity={0.55 + severity / 250}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        )}
      {dusty && (
        <Html
          position={[model.label.x, model.label.y + 1.5, model.label.z]}
          center
          zIndexRange={[2, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className="dust-marker">Bám bụi · {asset.id}</span>
        </Html>
      )}
      {hovered && (
        <Html
          position={model.label}
          center
          zIndexRange={[3, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            role="tooltip"
            className={`scene-label ${!historical && (asset.attention || asset.scenario) ? "scene-label-attention" : ""}`}
          >
            {asset.id}
            <span>{asset.name}</span>
            {historical ? (
              <span className="scene-label-status">
                {reading
                  ? `${reading.label} · Độ phủ ${reading.coveragePct?.toFixed(1) ?? "—"}%`
                  : "Chọn cụm pin để xem lịch sử"}
              </span>
            ) : (
              (!asset.attention ||
                asset.scenario ||
                asset.attention.signalId.endsWith(".fault")) && (
                <span className="scene-label-status">{status.label}</span>
              )
            )}
            {!historical &&
              asset.attention &&
              alertSignal &&
              !alertSignal.id.endsWith(".fault") && (
                <span
                  className={`scene-label-reading ${asset.attention.level}`}
                >
                  <small>
                    {asset.operation} · {signalLabel(asset, alertSignal)}
                  </small>
                  <strong>
                    {alertSignal.value === null
                      ? "—"
                      : number(alertSignal.value)}{" "}
                    <em>{alertSignal.unit}</em>
                  </strong>
                </span>
              )}
          </div>
        </Html>
      )}
    </group>
  );
}
function SelectionPulse({
  material,
}: {
  material: React.RefObject<MeshBasicMaterial | null>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useRef(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      reduced.current = preference.matches;
      if (material.current) material.current.opacity = 1;
      if (!preference.matches && !document.hidden)
        timer = setInterval(invalidate, 80);
      invalidate();
    };
    update();
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [invalidate, material]);
  useFrame(() => {
    if (material.current)
      material.current.opacity = reduced.current
        ? 1
        : 0.6 +
          0.4 * (0.5 + 0.5 * Math.sin((performance.now() * Math.PI) / 1000));
  });
  return null;
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
  const { assets, plantId } = usePlant();
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
      const orbit = controls.current;
      if (orbit) {
        // Reset in the same renderer as OrbitControls, after its props commit.
        // Flush the remaining pan/rotation before restoring the saved target.
        orbit.enableDamping = false;
        orbit.update();
        orbit.reset();
        orbit.enableDamping = true;
      }
      invalidate();
      return;
    }
    if (request === last.current.request) return;
    last.current.request = request;
    const asset = resolvePlantAsset(assets, selected, plantId),
      orbit = controls.current;
    if (!asset || !orbit) return;
    gl.domElement.dataset.focusRequest = String(request);
    gl.domElement.dataset.focusTarget = asset.id;
    const from = camera.position.clone(),
      targetFrom = orbit.target.clone();
    const direction = from.clone().sub(targetFrom).normalize();
    // 1.5x apparent zoom while keeping the overview unchanged.
    const field =
      plantId === "hong-liem-3" && asset.type === "pv" && !asset.parentId
        ? hongLiemFields[Number(asset.id.slice(-2)) - 1]
        : null;
    const distance = asset.parentId
      ? 12
      : field
        ? Math.max(
            40,
            ...field.polygon.map(
              ([x, z]) =>
                Math.hypot(x - field.center[0], z - field.center[1]) * 2.3,
            ),
          )
        : (asset.type === "pv" ? 32.8 : 24.8) / 1.5;
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
    assets,
    plantId,
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
  useFrame(({ gl, scene, camera, controls }) => {
    const projections: Record<string, number[]> = {};
    const cloudAssets: string[] = [];
    const colors: Record<string, string> = {};
    const outlines: Record<string, string> = {};
    const outlineOpacity: Record<string, number> = {};
    const footprintBounds: Record<string, number[]> = {};
    let roughness = 1,
      metalness = 0,
      specular = 0;
    const powerLinks: Record<
      string,
      {
        color: string;
        powerMW: number | null;
        running: boolean;
        role?: string;
        lineWidth?: number;
      }
    > = {};
    scene.traverse((node) => {
      if (node.userData.cloudAsset) cloudAssets.push(node.userData.cloudAsset);
      const link = node.userData.powerLink as PowerLink | undefined;
      if (link)
        powerLinks[link.id] = {
          color: (node as Line2).material.color.getHexString(),
          powerMW: link.powerMW,
          running: link.running,
          ...(link.role
            ? { role: link.role, lineWidth: (node as Line2).material.linewidth }
            : {}),
        };
      if (!node.userData.assetId) return;
      const id = node.userData.assetId as string;
      if (node.getObjectByName("cloud-preview")) cloudAssets.push(id);
      const point = node.getWorldPosition(new Vector3());
      point.y += node.userData.pickHeight;
      if (/^PV-\d{2}$/.test(id) && scene.getObjectByName("hong-liem-3-world")) {
        const field = hongLiemFields[Number(id.slice(-2)) - 1];
        if (field) point.set(field.center[0], 0.7, field.center[1]);
      }
      point.project(camera);
      projections[id] = [(point.x + 1) / 2, (1 - point.y) / 2];
      const outline = node.getObjectByName("device-footprint");
      if (
        outline instanceof Mesh &&
        outline.material instanceof MeshBasicMaterial
      ) {
        outlines[id] = outline.material.color.getHexString();
        outlineOpacity[id] = outline.material.opacity;
        const bounds = outline.geometry.boundingBox;
        if (bounds)
          footprintBounds[id] = [
            bounds.min.x,
            bounds.max.x,
            bounds.min.z,
            bounds.max.z,
          ];
      }
      node.traverse((child) => {
        if (child instanceof Mesh)
          for (const material of [child.material].flat())
            if (
              material instanceof MeshBasicMaterial &&
              material.name === "PV_CELLS"
            ) {
              colors[id] = material.color.getHexString();
              gl.domElement.dataset.pvMaterial = material.type;
              gl.domElement.dataset.pvFiltering = material.userData.filteredPV
                ? "mipmap-alpha"
                : "none";
            } else if (
              material instanceof MeshStandardMaterial &&
              /^(PV_CELLS|INV_BODY|TR_BODY|MET_MAST|GW_BODY)$/.test(
                material.name,
              )
            ) {
              colors[id] = material.color.getHexString();
              if (material.name === "PV_CELLS") {
                roughness = Math.min(roughness, material.roughness);
                metalness = Math.max(metalness, material.metalness);
                specular = Math.max(
                  specular,
                  material instanceof MeshPhysicalMaterial
                    ? material.specularIntensity
                    : 1,
                );
              }
            }
      });
    });
    gl.domElement.dataset.cloudAssets = JSON.stringify(cloudAssets.sort());
    gl.domElement.dataset.powerLinks = JSON.stringify(powerLinks);
    gl.domElement.dataset.deviceProjections = JSON.stringify(projections);
    gl.domElement.dataset.deviceColors = JSON.stringify(colors);
    gl.domElement.dataset.deviceOutlines = JSON.stringify(outlines);
    gl.domElement.dataset.outlineOpacity = JSON.stringify(outlineOpacity);
    gl.domElement.dataset.footprintBounds = JSON.stringify(footprintBounds);
    gl.domElement.dataset.cameraFov = String((camera as PerspectiveCamera).fov);
    gl.domElement.dataset.pvRoughness = String(roughness);
    gl.domElement.dataset.pvMetalness = String(metalness);
    gl.domElement.dataset.pvSpecular = String(specular);
    gl.domElement.dataset.cameraPosition = JSON.stringify(
      camera.position.toArray(),
    );
    const orbit = controls as Controls | null;
    if (orbit?.target)
      gl.domElement.dataset.cameraTarget = JSON.stringify(
        orbit.target.toArray(),
      );
    const hong = scene.getObjectByName("hong-liem-3-world");
    if (hong) {
      gl.domElement.dataset.plantId = "hong-liem-3";
      gl.domElement.dataset.pvRows = String(hong.userData.pvRows);
    }
    gl.domElement.dataset.renderCalls = String(gl.info.render.calls);
    gl.domElement.dataset.renderTriangles = String(gl.info.render.triangles);
  });
  return null;
}
function World({
  onReady,
  children,
  landscape,
}: {
  landscape?: ReactNode;
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
      {landscape ?? <Landscape />}
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
  assets: Asset[];
  selected: string | null;
  focusRequest: number;
  onSelect: (id: string) => void;
  reset: number;
  scenario: ScenarioId | null;
  target: string;
  severity: number;
  heatmap?: Record<string, HeatmapReading>;
}) {
  const { plantId } = usePlant();
  const isHong = plantId === "hong-liem-3";
  const cameraSettings = useMemo(
    () => ({
      position: isHong
        ? hongLiemCamera
        : ([0, 33, 51] as [number, number, number]),
      fov: 43,
      far: isHong ? 1800 : 1000,
      near: isHong ? 0.8 : 0.1,
    }),
    [isHong],
  );
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
          camera={cameraSettings}
          dpr={[1, isHong ? 1.25 : 1.5]}
          aria-label="Nhà máy 3D: kéo chuột trái để xoay, kéo chuột phải để dịch chuyển, cuộn để zoom"
        >
          <ContextWatch onLost={markLost} />
          <ResponsiveLens minimumAspect={props.heatmap ? 1.2 : 1.45} />
          <color attach="background" args={["#e8f5fa"]} />
          <fog
            attach="fog"
            args={["#e8f5fa", isHong ? 600 : 85, isHong ? 1400 : 170]}
          />
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
              <World
                onReady={markReady}
                landscape={
                  isHong ? (
                    <HongLiemLandscape
                      assets={props.assets}
                      selected={props.selected}
                      onSelect={props.onSelect}
                      scenario={props.scenario}
                      severity={props.severity}
                      heatmap={props.heatmap}
                    />
                  ) : undefined
                }
              >
                {!props.heatmap && (
                  <PowerNetwork
                    assets={props.assets}
                    selected={props.selected}
                  />
                )}
                {props.assets
                  .filter((asset) => !isHong || asset.type !== "pv")
                  .map((asset) => (
                    <Equipment
                      key={asset.id}
                      asset={asset}
                      selected={props.selected === asset.id}
                      onSelect={props.onSelect}
                      scenario={props.scenario}
                      target={props.target}
                      severity={props.severity}
                      historical={Boolean(props.heatmap)}
                      reading={props.heatmap?.[asset.id]}
                    />
                  ))}
              </World>
            </Suspense>
          </AssetBoundary>
          <OrbitControls
            ref={controls}
            makeDefault
            target={[0, 0, 0]}
            minDistance={12}
            maxDistance={isHong ? 900 : 110}
            maxPolarAngle={Math.PI / 2.15}
            enablePan
            screenSpacePanning
            panSpeed={0.8}
            mouseButtons={{
              LEFT: MOUSE.ROTATE,
              MIDDLE: MOUSE.DOLLY,
              RIGHT: MOUSE.PAN,
            }}
            touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
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
