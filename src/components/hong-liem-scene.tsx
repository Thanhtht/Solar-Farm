"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, useGLTF } from "@react-three/drei";
import {
  MOUSE,
  TOUCH,
  PerspectiveCamera,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
} from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { ModelInstances, ModelLibrary } from "./scene-models";
import { allModelUrls, type Placement } from "@/data/scene-layout";
import {
  hongLiemBoundary,
  hongLiemCamera,
  hongLiemFence,
  hongLiemFields,
  hongLiemRoads,
  hongLiemTrees,
  photoToGround,
  serviceYard,
  stationLocation,
  vegetationIsland,
  type Point2,
} from "@/data/hong-liem-layout";
import type { HongLiemSnapshot } from "@/lib/hong-liem-simulation";

const colors = { normal: "#168d68", degraded: "#dc9a23", stopped: "#df4e43" };
const cameraSettings = {
  position: hongLiemCamera,
  fov: 43,
  far: 1800,
  near: 0.3,
};
const overviewTarget: [number, number, number] = [0, 0, 0];
function SceneObservations() {
  useFrame(({ gl, camera, scene }) => {
    const canvas = gl.domElement;
    canvas.dataset.cameraPosition = JSON.stringify(camera.position.toArray());
    const world = scene.getObjectByName("hong-liem-3-world");
    if (!world) return;
    canvas.dataset.ready = "true";
    canvas.dataset.pvRows = String(world.userData.pvRows);
    canvas.dataset.drawCalls = String(gl.info.render.calls);
    const first =
      hongLiemFields[0].rows[Math.floor(hongLiemFields[0].rows.length / 2)]
        .position;
    const p = new Vector3(...first).project(camera);
    canvas.dataset.pvPick = JSON.stringify([(p.x + 1) / 2, (1 - p.y) / 2]);
  });
  return null;
}
function GroundPatch({
  points,
  color,
  height = 0.04,
  onSelect,
}: {
  points: Point2[];
  color: string;
  height?: number;
  onSelect?: () => void;
}) {
  const geometry = useMemo(
    () =>
      new ShapeGeometry(new Shape(points.map(([x, z]) => new Vector2(x, -z)))),
    [points],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, height, 0]}
      receiveShadow
      onClick={
        onSelect
          ? (event) => {
              if (event.button !== 0 || event.delta > 4) return;
              event.stopPropagation();
              onSelect();
            }
          : undefined
      }
    >
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function CameraRig({
  controls,
  view,
  reset,
  focus,
  selected,
  onReady,
}: {
  controls: React.RefObject<Controls | null>;
  view: "photo" | "top";
  reset: number;
  focus: number;
  selected: string | null;
  onReady: () => void;
}) {
  const { camera, size, gl, invalidate } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !controls.current) return;
    const orbit = controls.current;
    orbit.enableDamping = false;
    orbit.update();
    // Fit the reference photo's full 640×425 framing in any viewport.
    camera.fov =
      (2 *
        Math.atan(
          Math.tan((43 * Math.PI) / 360) *
            Math.max(1, 640 / 425 / (size.width / size.height)),
        ) *
        180) /
      Math.PI;
    camera.position.set(
      ...(view === "top"
        ? ([0, 440, -100] as [number, number, number])
        : hongLiemCamera),
    );
    orbit.target.set(0, 0, view === "top" ? -100 : 0);
    camera.updateProjectionMatrix();
    orbit.update();
    orbit.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    invalidate();
  }, [camera, controls, view, reset, size.width, size.height, invalidate]);
  useEffect(() => {
    const field = hongLiemFields.find((f) => f.id === selected);
    if (!focus || !field || !controls.current) return;
    const orbit = controls.current;
    orbit.enableDamping = false;
    orbit.update();
    const extent = Math.max(
      ...field.polygon.map(([x, z]) =>
        Math.hypot(x - field.center[0], z - field.center[1]),
      ),
      18,
    );
    camera.position.set(
      field.center[0],
      extent * 1.7,
      field.center[1] + extent * 1.65,
    );
    orbit.target.set(field.center[0], 0, field.center[1]);
    orbit.update();
    gl.domElement.dataset.focusTarget = field.id;
    orbit.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    invalidate();
  }, [focus, selected, camera, controls, invalidate, gl]);
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      onReady();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl, onReady]);
  return null;
}

function World({
  snapshot,
  selected,
  onSelect,
  labels,
  onReady,
}: {
  snapshot: HongLiemSnapshot;
  selected: string | null;
  onSelect: (id: string) => void;
  labels: boolean;
  onReady: () => void;
}) {
  const models = useGLTF(allModelUrls);
  const library = useMemo(
    () =>
      Object.fromEntries(
        allModelUrls.map((url, index) => [url, models[index]]),
      ),
    [models],
  );
  useEffect(() => onReady(), [onReady]);
  const inverterPlacements: Placement[] = hongLiemFields.map((field) => ({
    position: [field.inverter[0], 0.18, field.inverter[1]],
    scale: [0.8, 0.8, 0.8],
    rotation: -0.3,
  }));
  const service = (du: number, dv: number, scale = 1): Placement => {
    const p = photoToGround([565 + du, 127 + dv]);
    return {
      position: [p[0], 0.18, p[1]],
      rotation: -0.5,
      scale: [scale, scale, scale],
    };
  };
  return (
    <ModelLibrary.Provider value={library}>
      <group
        name="hong-liem-3-world"
        userData={{
          fieldCount: hongLiemFields.length,
          pvRows: hongLiemFields.reduce((s, f) => s + f.rows.length, 0),
        }}
      >
        <ModelInstances
          kind="terrain"
          placements={[{ position: [0, -0.5, -130], scale: [4.6, 0.15, 4.7] }]}
          surfaceColor="#697554"
        />
        <GroundPatch points={hongLiemBoundary} color="#b26d45" />
        <GroundPatch points={vegetationIsland} color="#667354" height={0.08} />
        <GroundPatch points={serviceYard} color="#d3c8b3" height={0.09} />
        <ModelInstances
          kind="road"
          placements={hongLiemRoads}
          surfaceColor="#dca272"
        />
        <ModelInstances kind="fence" placements={hongLiemFence} />
        <ModelInstances kind="building" placements={[service(0, 0, 1.35)]} />
        <ModelInstances
          kind="transformer"
          placements={[service(-9, 2, 1.3)]}
          onSelect={() => onSelect("HL3-TR-01")}
        />
        <ModelInstances
          kind="weather"
          placements={[service(13, 2)]}
          onSelect={() => onSelect("HL3-MET-01")}
        />
        <ModelInstances
          kind="gateway"
          placements={[service(4, 7)]}
          onSelect={() => onSelect("HL3-GW-01")}
        />
        {(["treeA", "treeB", "treeC"] as const).map((kind, index) => (
          <ModelInstances
            key={kind}
            kind={kind}
            placements={hongLiemTrees.filter((_, i) => i % 3 === index)}
          />
        ))}
        {hongLiemFields.map((field, index) => {
          const reading = snapshot.fields[index],
            active = field.id === selected || reading.inverterId === selected;
          const path = [...field.polygon, field.polygon[0]].map(
            ([x, z]) => [x, 0.3, z] as [number, number, number],
          );
          return (
            <group key={field.id} name={field.id}>
              <GroundPatch
                points={field.polygon}
                color="#bd8056"
                height={0.07}
                onSelect={() => onSelect(field.id)}
              />
              <ModelInstances
                kind="pv"
                placements={field.rows}
                cellsOnly={!active}
                onSelect={() => onSelect(field.id)}
                cellColor={
                  reading.status === "stopped"
                    ? "#334459"
                    : snapshot.scenario === "dust" && reading.lossMW > 0
                      ? "#8d7960"
                      : "#213f69"
                }
              />
              <ModelInstances
                kind="inverter"
                placements={[inverterPlacements[index]]}
                onSelect={() => onSelect(reading.inverterId)}
              />
              {(active || reading.status !== "normal") && (
                <Line
                  points={path}
                  color={active ? "#47a6ff" : colors[reading.status]}
                  lineWidth={active ? 2.5 : 1.4}
                />
              )}
              {labels && (
                <Html
                  position={[field.center[0], 1, field.center[1]]}
                  center
                  zIndexRange={[3, 0]}
                >
                  <button
                    className={`hl3-map-label ${active ? "active" : ""}`}
                    onClick={() => onSelect(field.id)}
                    aria-label={`Chọn vùng ${field.name}`}
                  >
                    <i style={{ background: colors[reading.status] }} />
                    {String(index + 1).padStart(2, "0")}
                  </button>
                </Html>
              )}
              {snapshot.scenario === "cloud" && reading.lossMW > 0 && (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[field.center[0], 4, field.center[1]]}
                >
                  <circleGeometry
                    args={[Math.sqrt(field.rows.length) * 1.7, 32]}
                  />
                  <meshBasicMaterial
                    color="#cad9e4"
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>
          );
        })}
        {labels && (
          <Html
            position={[stationLocation[0], 5, stationLocation[1]]}
            center
            zIndexRange={[3, 0]}
          >
            <button
              className="hl3-station-label"
              onClick={() => onSelect("HL3-TR-01")}
            >
              Trạm điện
            </button>
          </Html>
        )}
      </group>
    </ModelLibrary.Provider>
  );
}

class SceneBoundary extends Component<
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

export default function HongLiemScene(props: {
  snapshot: HongLiemSnapshot;
  selected: string | null;
  onSelect: (id: string) => void;
  view: "photo" | "top";
  reset: number;
  focus: number;
  labels: boolean;
}) {
  const controls = useRef<Controls>(null);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [supported, setSupported] = useState<boolean | null>(null),
    [attempt, setAttempt] = useState(0);
  const markReady = useCallback(() => setReady(true), []),
    markError = useCallback(() => {
      setReady(false);
      setFailed(true);
    }, []);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    setSupported(Boolean(gl));
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }, [attempt]);
  const retry = () => {
    useGLTF.clear(allModelUrls);
    allModelUrls.forEach((url) => useGLTF.clear(url));
    setFailed(false);
    setReady(false);
    setSupported(null);
    setAttempt((n) => n + 1);
  };
  return (
    <>
      {(supported === false || failed) && (
        <div className="scene-message" role="alert">
          <strong>
            {supported === false
              ? "WebGL chưa khả dụng"
              : "Không thể tải cảnh 3D"}
          </strong>
          <p>Bạn vẫn có thể xem dữ liệu và chọn vùng trong danh sách.</p>
          <button onClick={retry}>Thử lại cảnh 3D</button>
        </div>
      )}
      {!ready && supported !== false && !failed && (
        <div className="scene-loading" role="status">
          Đang dựng nhà máy Hồng Liêm 3…
        </div>
      )}
      {supported && !failed && (
        <SceneBoundary key={attempt} onError={markError}>
          <Canvas
            frameloop="demand"
            dpr={[1, 1.25]}
            camera={cameraSettings}
            aria-label="Hồng Liêm 3 trong 3D: kéo để xoay, cuộn để phóng to"
            data-ready={ready}
            data-field-count={hongLiemFields.length}
            data-pv-rows={hongLiemFields.reduce((s, f) => s + f.rows.length, 0)}
          >
            <color attach="background" args={["#e7edf0"]} />
            <ambientLight intensity={1.2} />
            <hemisphereLight args={["#e1efff", "#c3a079", 1.8]} />
            <directionalLight position={[-100, 180, 70]} intensity={2.1} />
            <Suspense fallback={null}>
              <World
                snapshot={props.snapshot}
                selected={props.selected}
                onSelect={props.onSelect}
                labels={props.labels}
                onReady={markReady}
              />
            </Suspense>
            <SceneObservations />
            <OrbitControls
              ref={controls}
              makeDefault
              target={overviewTarget}
              minDistance={8}
              maxDistance={900}
              maxPolarAngle={Math.PI / 2.08}
              screenSpacePanning
              mouseButtons={{
                LEFT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
                RIGHT: MOUSE.PAN,
              }}
              touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
            />
            <CameraRig
              controls={controls}
              selected={props.selected}
              reset={props.reset}
              focus={props.focus}
              view={props.view}
              onReady={markError}
            />
          </Canvas>
        </SceneBoundary>
      )}
    </>
  );
}
