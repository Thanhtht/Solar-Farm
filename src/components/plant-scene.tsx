"use client";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";
import {
  Component,
  ReactNode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PerspectiveCamera } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { assets, Asset, ScenarioId } from "@/data/plant";
// Preserve camera pose while widening the vertical lens on narrow screens.
function ResponsiveLens() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov =
        (2 *
          Math.atan(
            Math.tan((43 * Math.PI) / 360) *
              Math.max(1, 1.8 / (size.width / size.height)),
          ) *
          180) /
        Math.PI;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
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
  const color = selected
    ? "#53f5ca"
    : affected && scenario === "fault"
      ? "#ff867c"
      : asset.type === "pv"
        ? affected && scenario === "dust"
          ? "#988362"
          : "#16477b"
        : asset.type === "inverter"
          ? "#d8e9df"
          : asset.type === "transformer"
            ? "#8da8a4"
            : "#f2c66f";
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(asset.id);
  };
  return (
    <group
      position={asset.position}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {asset.type === "pv" ? (
        <>
          {Array.from({ length: 6 }, (_, r) => (
            <group
              key={r}
              position={[0, 0.7, (r - 2.5) * 1.7]}
              rotation={[-0.2, 0, 0]}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry args={[9, 0.12, 1.35]} />
                <meshStandardMaterial
                  color={color}
                  metalness={0.55}
                  roughness={0.38}
                />
              </mesh>
              {Array.from({ length: 9 }, (_, c) => (
                <mesh key={c} position={[(c - 4) * 0.98, 0.075, 0]}>
                  <boxGeometry args={[0.025, 0.015, 1.34]} />
                  <meshStandardMaterial color="#658aa7" />
                </mesh>
              ))}
              <mesh position={[0, -0.4, 0]}>
                <boxGeometry args={[8, 0.65, 0.12]} />
                <meshStandardMaterial color="#879797" />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          <mesh
            castShadow
            position={[0, asset.type === "weather" ? 1.5 : 0.5, 0]}
          >
            <boxGeometry
              args={
                asset.type === "transformer"
                  ? [4, 2.3, 3]
                  : asset.type === "weather"
                    ? [0.18, 4, 0.18]
                    : [1.6, 1.7, 1.1]
              }
            />
            <meshStandardMaterial
              color={color}
              metalness={0.35}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[0, 1.3, 0.58]}>
            <boxGeometry args={[0.7, 0.25, 0.06]} />
            <meshStandardMaterial
              color="#36d6b0"
              emissive="#36d6b0"
              emissiveIntensity={0.5}
            />
          </mesh>
          {asset.type === "weather" && (
            <mesh position={[0, 3.4, 0]}>
              <boxGeometry args={[2, 0.1, 0.3]} />
              <meshStandardMaterial color="#e6ede6" />
            </mesh>
          )}
        </>
      )}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry
            args={asset.type === "pv" ? [6.2, 6.35, 64] : [2.4, 2.55, 48]}
          />
          <meshBasicMaterial color="#5affd3" transparent opacity={0.85} />
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
        <Html
          position={[0, asset.type === "pv" ? 2 : 4, 0]}
          center
          distanceFactor={50}
        >
          <button className="scene-label" onClick={() => onSelect(asset.id)}>
            {asset.id}
            <span>{asset.type === "pv" ? "Cụm pin đại diện" : asset.name}</span>
          </button>
        </Html>
      )}
    </group>
  );
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
        <strong>Không thể mở cảnh WebGL</strong>
        <p>
          Hãy bật tăng tốc đồ họa hoặc dùng trình duyệt hỗ trợ WebGL. Bạn vẫn có
          thể chọn thiết bị trong danh sách.
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
  onSelect: (id: string) => void;
  reset: number;
  scenario: ScenarioId | null;
  target: string;
  severity: number;
}) {
  const controls = useRef<Controls>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [supported, setSupported] = useState<boolean | null>(null);
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
        <button onClick={() => setAttempt((n) => n + 1)}>
          Thử lại cảnh 3D
        </button>
      </div>
    );
  return (
    <SceneBoundary
      key={attempt}
      retry={() => {
        setReady(false);
        setAttempt((n) => n + 1);
      }}
    >
      {!ready && (
        <div className="scene-loading" role="status">
          Đang chuẩn bị nhà máy 3D…
        </div>
      )}
      {supported && (
        <Canvas
          shadows
          camera={{ position: [47, 44, 52], fov: 43 }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            setReady(true);
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              setSupported(false);
            });
          }}
          aria-label="Nhà máy 3D: kéo để xoay, cuộn để zoom"
        >
          <ResponsiveLens />
          <color attach="background" args={["#10232b"]} />
          <fog attach="fog" args={["#10232b", 85, 170]} />
          <ambientLight intensity={1.5} />
          <hemisphereLight args={["#cce9ff", "#384a3c", 2]} />
          <directionalLight
            castShadow
            position={[15, 35, -10]}
            intensity={3}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
          />
          <Suspense fallback={null}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.15, 0]}
              receiveShadow
            >
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#233c38" roughness={1} />
            </mesh>
            <mesh position={[0, -0.1, 0]} receiveShadow>
              <boxGeometry args={[70, 0.2, 43]} />
              <meshStandardMaterial color="#526553" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[64, 3]} />
              <meshStandardMaterial color="#a0a590" />
            </mesh>
            <Grid
              position={[0, -0.12, 0]}
              args={[200, 200]}
              cellSize={5}
              cellThickness={0.4}
              cellColor="#40625b"
              sectionSize={25}
              sectionColor="#4a6d64"
              fadeDistance={110}
              infiniteGrid
            />
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
          </Suspense>
          <OrbitControls
            ref={controls}
            makeDefault
            target={[0, 0, 0]}
            minDistance={18}
            maxDistance={110}
            maxPolarAngle={Math.PI / 2.15}
            enablePan={false}
          />
        </Canvas>
      )}
    </SceneBoundary>
  );
}
