"use client";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Group,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Raycaster,
  Vector3,
} from "three";
import {
  deviceModels,
  landscapeModels,
  landscapePlacements,
  type LandscapeKind,
  type Placement,
} from "@/data/scene-layout";
import type { Asset, AssetType, ScenarioId } from "@/data/plant";

export const ModelLibrary = createContext<Record<
  string,
  { scene: Group }
> | null>(null);
function useModel(url: string) {
  const library = useContext(ModelLibrary);
  if (!library?.[url]) throw new Error(`Model library missing: ${url}`);
  return library[url];
}
function tintMaterial(material: MeshStandardMaterial) {
  const colors: Record<string, string> = {
    PV_CELLS: "#16477b",
    PV_FRAME: "#b9c7ce",
    PV_SUPPORTS: "#7c908f",
    INV_BODY: "#e6eeeb",
    INV_VENTS: "#607782",
    GW_BODY: "#e6eeeb",
    TR_BODY: "#738b87",
    TR_RADIATORS: "#607d74",
    VEG_FOLIAGE: "#739554",
    VEG_TRUNK: "#806d53",
  };
  if (colors[material.name]) material.color.set(colors[material.name]);
  if (material.name === "PV_CELLS") {
    material.metalness = 0.05;
    material.roughness = 0.4;
  }
  material.userData.baseColor = material.color.clone();
  material.userData.baseEmissive = material.emissive.clone();
  return material;
}
export function useDeviceModel(type: AssetType) {
  const { scene } = useModel(deviceModels[type]);
  const model = useMemo(() => {
    const object = scene.clone(true);
    const materials: MeshStandardMaterial[] = [];
    object.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = [node.material].flat().map((original) => {
          const material = tintMaterial(
            (original as MeshStandardMaterial).clone(),
          );
          materials.push(material);
          return material;
        });
        if (node.material.length === 1) node.material = node.material[0];
      }
    });
    object.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(object, true);
    const size = bounds.getSize(new Vector3());
    const anchor = object.getObjectByName("ANCHOR_LABEL");
    const label = anchor
      ? anchor.getWorldPosition(new Vector3())
      : new Vector3(0, bounds.max.y + 0.4, 0);
    const statusAnchor = object.getObjectByName("ANCHOR_STATUS");
    const status = statusAnchor
      ? statusAnchor.getWorldPosition(new Vector3())
      : new Vector3(0, bounds.max.y + 0.2, 0);
    return { object, materials, size, label, status, bounds };
  }, [scene]);
  useEffect(() => () => model.materials.forEach((m) => m.dispose()), [model]);
  return model;
}
export function DeviceModel({
  model,
  selected,
  affected,
  scenario,
  severity,
  attention,
}: {
  model: ReturnType<typeof useDeviceModel>;
  selected: boolean;
  affected: boolean;
  scenario: ScenarioId | null;
  severity: number;
  attention?: Asset["attention"];
}) {
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    for (const material of model.materials) {
      material.color.copy(material.userData.baseColor as Color);
      material.emissive.copy(material.userData.baseEmissive as Color);
      const mutable =
        /^(PV_CELLS|INV_BODY|INV_INDICATOR|TR_BODY|GW_BODY|MET_MAST)$/.test(
          material.name,
        );
      if (!mutable) continue;
      if (attention) {
        material.color.lerp(
          new Color(attention.level === "critical" ? "#e44538" : "#e9b323"),
          0.78,
        );
        material.emissive.set(
          attention.level === "critical" ? "#4d0b04" : "#4b3100",
        );
      } else if (affected && scenario === "fault") {
        material.color.lerp(new Color("#e66a57"), 0.7);
        material.emissive.set("#3d0f08");
      } else if (
        affected &&
        scenario === "dust" &&
        material.name === "PV_CELLS"
      ) {
        material.color.lerp(new Color("#a28b62"), severity / 100);
      } else if (selected) {
        material.color.lerp(new Color("#47d5ac"), 0.16);
        material.emissive.set("#07382d");
      }
    }
    invalidate();
  }, [model, selected, affected, scenario, severity, attention, invalidate]);
  return <primitive object={model.object} dispose={null} />;
}
const ignoreRaycast: Mesh["raycast"] = () => {};
function Instances({
  kind,
  placements,
}: {
  kind: LandscapeKind;
  placements: Placement[];
}) {
  const { scene } = useModel(landscapeModels[kind]);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const parts: {
      geometry: Mesh["geometry"];
      material: MeshStandardMaterial;
      matrix: Matrix4;
      ownedGeometry: boolean;
    }[] = [];
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        const smooth =
          kind === "terrain" ||
          (/^tree|^shrub/.test(kind) && node.name === "VEG_FOLIAGE");
        const geometry = smooth ? node.geometry.clone() : node.geometry;
        if (smooth) geometry.computeVertexNormals();
        const material = tintMaterial(
          (node.material as MeshStandardMaterial).clone(),
        );
        if (smooth) material.flatShading = false;
        parts.push({
          geometry,
          material,
          matrix: node.matrixWorld.clone(),
          ownedGeometry: smooth,
        });
      }
    });
    return parts;
  }, [scene, kind]);
  useEffect(
    () => () =>
      parts.forEach((p) => {
        p.material.dispose();
        if (p.ownedGeometry) p.geometry.dispose();
      }),
    [parts],
  );
  return (
    <group>
      {parts.map((part, i) => (
        <Batch
          key={i}
          part={part}
          placements={placements}
          castShadow={
            kind !== "terrain" && kind !== "road" && kind !== "corner"
          }
        />
      ))}
    </group>
  );
}
function Batch({
  part,
  placements,
  castShadow,
}: {
  part: {
    geometry: Mesh["geometry"];
    material: MeshStandardMaterial;
    matrix: Matrix4;
  };
  placements: Placement[];
  castShadow: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.rotation.set(0, p.rotation ?? 0, 0);
      dummy.scale.set(...(p.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      ref.current!.setMatrixAt(
        i,
        new Matrix4().multiplyMatrices(dummy.matrix, part.matrix),
      );
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
    invalidate();
  }, [placements, part, invalidate]);
  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material, placements.length]}
      castShadow={castShadow}
      receiveShadow
      raycast={ignoreRaycast}
      dispose={null}
    />
  );
}
export function Landscape() {
  const { scene: terrain } = useModel(landscapeModels.terrain);
  const narrow = useThree((s) => s.size.width < 600);
  const placements = useMemo(() => {
    terrain.updateMatrixWorld(true);
    const ray = new Raycaster();
    const result = {} as typeof landscapePlacements;
    for (const [name, items] of Object.entries(landscapePlacements)) {
      const kind = name as LandscapeKind;
      const vegetation = /^tree|^shrub/.test(kind);
      result[kind] = items
        .filter((_, i) => !(narrow && vegetation && i % 2))
        .map((p) => {
          if (!vegetation) return p;
          ray.set(
            new Vector3(p.position[0], 10, p.position[2]),
            new Vector3(0, -1, 0),
          );
          const height = ray.intersectObject(terrain, true)[0]?.point.y ?? 0;
          return {
            ...p,
            position: [p.position[0], height, p.position[2]] as [
              number,
              number,
              number,
            ],
          };
        });
    }
    return result;
  }, [terrain, narrow]);
  return (
    <group>
      {(Object.keys(landscapeModels) as LandscapeKind[]).map((kind) => (
        <Instances key={kind} kind={kind} placements={placements[kind]} />
      ))}
    </group>
  );
}
