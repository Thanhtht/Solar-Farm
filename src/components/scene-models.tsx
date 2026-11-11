"use client";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  Group,
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
import type { AssetType } from "@/data/plant";
import { createDeviceFootprint } from "@/lib/device-footprint";
import { repairRoadCorner } from "@/lib/road-geometry";

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
    const footprint = createDeviceFootprint(object);
    return { object, materials, size, label, bounds, footprint };
  }, [scene]);
  useEffect(
    () => () => {
      model.materials.forEach((m) => m.dispose());
      model.footprint.dispose();
    },
    [model],
  );
  return model;
}
export function DeviceModel({
  model,
}: {
  model: ReturnType<typeof useDeviceModel>;
}) {
  // Status uses ground outlines; model materials stay unchanged.
  return <primitive object={model.object} dispose={null} />;
}
const ignoreRaycast: Mesh["raycast"] = () => {};
export function ModelInstances({
  kind,
  placements,
  onSelect,
  cellColor,
  surfaceColor,
  cellsOnly = false,
  overview = false,
  matte = false,
  onHover,
}: {
  kind: LandscapeKind | AssetType;
  placements: Placement[];
  onSelect?: (index: number) => void;
  onHover?: (index: number | null) => void;
  cellColor?: string;
  surfaceColor?: string;
  cellsOnly?: boolean;
  overview?: boolean;
  matte?: boolean;
}) {
  const url =
    kind in landscapeModels
      ? landscapeModels[kind as LandscapeKind]
      : deviceModels[kind as AssetType];
  const { scene } = useModel(url);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const parts: {
      geometry: Mesh["geometry"];
      material: MeshStandardMaterial;
      matrix: Matrix4;
      ownedGeometry: boolean;
      texture?: CanvasTexture;
    }[] = [];
    if (kind === "pv" && overview) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#81909f";
      context.fillRect(0, 0, 256, 256);
      context.fillStyle = "#ffffff";
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 9; col++)
          context.fillRect(
            (col * 256) / 9 + 1,
            (row * 256) / 6 + 1,
            256 / 9 - 2,
            256 / 6 - 2,
          );
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.anisotropy = 4;
      const geometry = new BoxGeometry(9, 0.07, 9.8);
      geometry.translate(0, 0.9, 0);
      const material = new MeshStandardMaterial({
        color: cellColor ?? "#16477b",
        map: texture,
        roughness: 1,
        metalness: 0,
        envMapIntensity: 0,
      });
      material.name = "PV_CELLS";
      parts.push({
        geometry,
        material,
        matrix: new Matrix4(),
        ownedGeometry: true,
        texture,
      });
      return parts;
    }
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        // At farm scale the sub-pixel frames and supports dominate triangles.
        // Retain the original GLB cell geometry; selected fields use all parts.
        if (
          kind === "pv" &&
          cellsOnly &&
          (node.material as MeshStandardMaterial).name !== "PV_CELLS"
        )
          return;
        const smooth =
          kind === "terrain" ||
          (/^tree|^shrub/.test(kind) && node.name === "VEG_FOLIAGE");
        const geometry =
          kind === "corner"
            ? repairRoadCorner(node.geometry)
            : smooth
              ? node.geometry.clone()
              : node.geometry;
        if (smooth) geometry.computeVertexNormals();
        const material = tintMaterial(
          (node.material as MeshStandardMaterial).clone(),
        );
        if (cellColor && material.name === "PV_CELLS")
          material.color.set(cellColor);
        if (matte && kind === "pv") {
          material.roughness = 1;
          material.metalness = 0;
          material.envMapIntensity = 0;
        }
        if (surfaceColor) material.color.set(surfaceColor);
        if (smooth) material.flatShading = false;
        parts.push({
          geometry,
          material,
          matrix: node.matrixWorld.clone(),
          ownedGeometry: smooth || kind === "corner",
        });
      }
    });
    return parts;
  }, [scene, kind, cellColor, surfaceColor, cellsOnly, overview, matte]);
  useEffect(
    () => () =>
      parts.forEach((p) => {
        p.material.dispose();
        p.texture?.dispose();
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
          onSelect={onSelect}
          onHover={onHover}
          receiveShadow={!(matte && kind === "pv")}
          castShadow={
            !(matte && kind === "pv") &&
            kind !== "terrain" &&
            kind !== "road" &&
            kind !== "corner"
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
  onSelect,
  onHover,
  receiveShadow,
}: {
  part: {
    geometry: Mesh["geometry"];
    material: MeshStandardMaterial;
    matrix: Matrix4;
  };
  placements: Placement[];
  castShadow: boolean;
  onSelect?: (index: number) => void;
  onHover?: (index: number | null) => void;
  receiveShadow: boolean;
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
      receiveShadow={receiveShadow}
      raycast={onSelect ? undefined : ignoreRaycast}
      onClick={
        onSelect
          ? (event: ThreeEvent<MouseEvent>) => {
              if (event.button !== 0 || event.delta > 4) return;
              event.stopPropagation();
              onSelect(event.instanceId ?? 0);
            }
          : undefined
      }
      onPointerOver={
        onHover
          ? (event) => {
              event.stopPropagation();
              if (event.buttons === 0 && event.pointerType !== "touch") {
                onHover(event.instanceId ?? 0);
                document.body.style.cursor = "pointer";
              }
            }
          : undefined
      }
      onPointerOut={
        onHover
          ? () => {
              onHover(null);
              document.body.style.cursor = "auto";
            }
          : undefined
      }
      onPointerDown={onHover ? () => onHover(null) : undefined}
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
        <ModelInstances key={kind} kind={kind} placements={placements[kind]} />
      ))}
    </group>
  );
}
