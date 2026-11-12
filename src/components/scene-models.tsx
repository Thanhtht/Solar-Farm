"use client";
import { createStablePvSupports } from "@/lib/pv-supports";
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
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  DataTexture,
  DoubleSide,
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
import { createPvFilteredSurface, createFlatGeometry } from "@/lib/pv-surface";

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
export function useDeviceModel(
  type: AssetType,
  scale?: [number, number, number],
  rotation = 0,
) {
  const { scene } = useModel(deviceModels[type]);
  const model = useMemo(() => {
    const object = scene.clone(true);
    if (scale) object.scale.set(...scale);
    object.rotation.y = rotation;
    const materials: MeshStandardMaterial[] = [];
    object.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = [node.material].flat().map((original) => {
          let material = tintMaterial(
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
  }, [scene, scale, rotation]);
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
  stableSupports = false,
  pickOnly = false,
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
  stableSupports?: boolean;
  pickOnly?: boolean;
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
      material: MeshStandardMaterial | MeshBasicMaterial;
      matrix: Matrix4;
      ownedGeometry: boolean;
      texture?: DataTexture;
    }[] = [];
    if (pickOnly && kind === "pv") {
      const geometry = new BoxGeometry(9, 1.1, 9.8);
      geometry.translate(0, 0.55, 0);
      // Whole-block hit area, including module gaps, with no rendered surface.
      const material = new MeshStandardMaterial({ visible: false });
      parts.push({
        geometry,
        material,
        matrix: new Matrix4(),
        ownedGeometry: true,
      });
      return parts;
    }
    if (matte && kind === "pv") {
      const cells = scene.getObjectByName("PV_CELLS") as Mesh;
      const { geometry, texture } = createPvFilteredSurface(cells.geometry);
      const material = new MeshBasicMaterial({
        color: cellColor ?? "#16477b",
        map: texture,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      material.name = "PV_CELLS";
      material.userData.filteredPV = true;
      parts.push({
        geometry,
        material,
        matrix: new Matrix4(),
        ownedGeometry: true,
        texture,
      });
      if (stableSupports) {
        const supportMaterial = new MeshBasicMaterial({ color: "#526568" });
        supportMaterial.name = "PV_SUPPORTS";
        supportMaterial.userData.stablePVSupports = true;
        parts.push({
          geometry: createStablePvSupports(),
          material: supportMaterial,
          matrix: new Matrix4(),
          ownedGeometry: true,
        });
        return parts;
      }
      if (overview || cellsOnly) return parts;
    }
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        if (
          matte &&
          kind === "pv" &&
          (node.material as MeshStandardMaterial).name === "PV_CELLS"
        )
          return;
        // Keep identical tilted module surfaces at every distance. Only the
        // thin frames/supports are omitted at farm scale.
        if (
          kind === "pv" &&
          (cellsOnly || overview) &&
          (node.material as MeshStandardMaterial).name !== "PV_CELLS"
        )
          return;
        const smooth =
          kind === "terrain" ||
          (/^tree|^shrub/.test(kind) && node.name === "VEG_FOLIAGE");
        const mattePv = matte && kind === "pv";
        const geometry = mattePv
          ? createFlatGeometry(node.geometry)
          : kind === "corner"
            ? repairRoadCorner(node.geometry)
            : smooth
              ? node.geometry.clone()
              : node.geometry;
        if (smooth) geometry.computeVertexNormals();
        let material = tintMaterial(
          (node.material as MeshStandardMaterial).clone(),
        );
        if (cellColor && material.name === "PV_CELLS")
          material.color.set(cellColor);
        if (mattePv) {
          const diffuse = new MeshPhysicalMaterial({
            color: material.name === "PV_FRAME" ? "#34536b" : "#526568",
            roughness: 1,
            metalness: 0,
            specularIntensity: 0,
            envMapIntensity: 0,
            side: material.name === "PV_CELLS" ? DoubleSide : material.side,
          });
          diffuse.name = material.name;
          diffuse.userData = material.userData;
          material.dispose();
          material = diffuse;
        }
        if (surfaceColor) material.color.set(surfaceColor);
        if (smooth) material.flatShading = false;
        parts.push({
          geometry,
          material,
          matrix: node.matrixWorld.clone(),
          ownedGeometry: mattePv || smooth || kind === "corner",
        });
      }
    });
    return parts;
  }, [
    scene,
    kind,
    cellColor,
    surfaceColor,
    cellsOnly,
    overview,
    stableSupports,
    matte,
    pickOnly,
  ]);
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
          receiveShadow={!pickOnly && !(matte && kind === "pv")}
          castShadow={
            !pickOnly &&
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
    material: MeshStandardMaterial | MeshBasicMaterial;
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
