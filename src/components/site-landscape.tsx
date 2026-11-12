"use client";
import { useMemo, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { Shape, ShapeGeometry, Vector2, Vector3 } from "three";
import { ModelInstances } from "./scene-models";
import type { Point2 } from "@/data/hong-liem-layout";
import type { hongLayout } from "@/data/site-layout";
import { getSiteLayout, getSiteBlock } from "@/data/site-layout";
import { usePlant } from "./plant-context";
import { resolvePlantAsset } from "@/lib/plant-assets";
import type { Asset, ScenarioId } from "@/data/plant";
import type { HeatmapReading } from "@/lib/history-presentation";
import { assetStatus } from "@/lib/asset-status";
import { number } from "./device-profile";

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

function PVField({
  field,
  index,
  asset,
  selected,
  onSelect,
  onHover,
  reading,
}: {
  field: (typeof hongLayout.fields)[number];
  index: number;
  asset: Asset;
  selected: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  reading?: HeatmapReading;
}) {
  const { camera } = useThree();
  const { plantId } = usePlant();
  const [near, setNear] = useState<number[]>([]);
  const lastCamera = useRef(new Vector3(Infinity, Infinity, Infinity));
  const nearSet = useRef(new Set<number>());
  useFrame(() => {
    if (camera.position.distanceToSquared(lastCamera.current) < 1) return;
    lastCamera.current.copy(camera.position);
    const next = field.rows.flatMap((row, i) =>
      camera.position.distanceToSquared(new Vector3(...row.position)) <
      (nearSet.current.has(i) ? 16 * 16 : 12 * 12)
        ? [i]
        : [],
    );
    if (
      next.length !== nearSet.current.size ||
      next.some((i) => !nearSet.current.has(i))
    ) {
      nearSet.current = new Set(next);
      setNear(next);
    }
  });
  const selectedBlock = getSiteBlock(plantId, selected);
  const forced =
    selectedBlock?.parentId === asset.id ? selectedBlock.index : -1;
  const parts = useMemo(() => {
    const detailed = new Set(near);
    if (forced >= 0) detailed.add(forced);
    const nearIds = Array.from(detailed).sort((a, b) => a - b),
      farIds = field.rows.map((_, i) => i).filter((i) => !detailed.has(i));
    return {
      nearIds,
      farIds,
      nearRows: nearIds.map((i) => field.rows[i]),
      farRows: farIds.map((i) => field.rows[i]),
    };
  }, [field, near, forced]);
  const idFor = (i: number) => `${asset.id}-${String(i + 1).padStart(3, "0")}`;
  const color =
    reading?.color ??
    (asset.operatingState === "stopped"
      ? "#334459"
      : asset.scenario?.kind === "dust"
        ? "#8d7960"
        : "#16477b");
  const status = assetStatus(asset),
    active = selected === asset.id;
  const boundary = [...field.polygon, field.polygon[0]].map(
    ([x, z]) => [x, 0.2, z] as [number, number, number],
  );
  return (
    <group name={asset.id} userData={{ assetId: asset.id, pickHeight: 0.7 }}>
      <GroundPatch
        points={field.polygon}
        color={plantId === "binh-nguyen" ? "#b6a487" : "#bd8056"}
        height={0.07}
        onSelect={() => onSelect(asset.id)}
      />
      <ModelInstances
        kind="pv"
        placements={field.rows}
        pickOnly
        onSelect={(i) => onSelect(idFor(i))}
        onHover={(i) => onHover(i === null ? null : idFor(i))}
      />
      {parts.farRows.length > 0 && (
        <ModelInstances
          kind="pv"
          placements={parts.farRows}
          overview
          matte
          cellColor={color}
          onSelect={(i) => onSelect(idFor(parts.farIds[i]))}
          onHover={(i) => onHover(i === null ? null : idFor(parts.farIds[i]))}
        />
      )}
      {parts.nearRows.length > 0 && (
        <ModelInstances
          kind="pv"
          placements={parts.nearRows}
          matte
          cellColor={color}
          onSelect={(i) => onSelect(idFor(parts.nearIds[i]))}
          onHover={(i) => onHover(i === null ? null : idFor(parts.nearIds[i]))}
        />
      )}
      {(active || (!reading && status.level !== "normal")) && (
        <Line
          points={boundary}
          color={
            active
              ? "#3397e7"
              : status.level === "critical"
                ? "#d76b60"
                : "#b99b56"
          }
          dashed
          dashSize={1}
          gapSize={0.8}
          lineWidth={active ? 1.6 : 0.9}
          transparent
          opacity={0.7}
          userData={{ regionOutline: true }}
        />
      )}
      {active && (
        <Html
          position={[field.center[0], 2, field.center[1]]}
          center
          zIndexRange={[2, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className="selection-marker">Vùng {asset.id}</span>
        </Html>
      )}
    </group>
  );
}

export function SiteLandscape({
  assets,
  selected,
  onSelect,
  scenario,
  severity,
  heatmap,
}: {
  assets: Asset[];
  selected: string | null;
  onSelect: (id: string) => void;
  scenario: ScenarioId | null;
  severity: number;
  heatmap?: Record<string, HeatmapReading>;
}) {
  const { plantId } = usePlant();
  const layout = getSiteLayout(plantId);
  const {
    fields: hongLiemFields,
    boundary: hongLiemBoundary,
    vegetationIsland,
    serviceYard,
    roads: hongLiemRoads,
    fence: hongLiemFence,
    trees: hongLiemTrees,
    building,
    pvRowScale,
    pvRowRotation,
  } = layout;
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );
  const chosen = getSiteBlock(plantId, selected),
    hover = getSiteBlock(plantId, hovered);
  const hoverAsset = hover
    ? resolvePlantAsset(assets, hover.id, plantId)
    : undefined;
  const outline = chosen
    ? [
        [-4.6, -5],
        [4.6, -5],
        [4.6, 5],
        [-4.6, 5],
        [-4.6, -5],
      ].map(([x, z]) => {
        const dx = x * pvRowScale[0],
          dz = z * pvRowScale[2];
        return [
          chosen.placement.position[0] +
            dx * Math.cos(pvRowRotation) +
            dz * Math.sin(pvRowRotation),
          0.2,
          chosen.placement.position[2] -
            dx * Math.sin(pvRowRotation) +
            dz * Math.cos(pvRowRotation),
        ] as [number, number, number];
      })
    : null;
  return (
    <group
      name={`${plantId}-world`}
      userData={{
        fieldCount: hongLiemFields.length,
        pvRows: hongLiemFields.reduce((s, f) => s + f.rows.length, 0),
        pvSurface: "matte-lod",
      }}
    >
      <ModelInstances
        kind="terrain"
        placements={[{ position: [0, -0.5, -130], scale: [4.6, 0.15, 4.7] }]}
        surfaceColor="#697554"
      />
      {layout.groundPatches.map((points, i) => (
        <GroundPatch
          key={i}
          points={points}
          color={plantId === "binh-nguyen" ? "#b6a17e" : "#b26d45"}
        />
      ))}
      {plantId !== "binh-nguyen" && (
        <GroundPatch points={vegetationIsland} color="#667354" height={0.08} />
      )}
      <GroundPatch points={serviceYard} color="#d3c8b3" height={0.09} />
      {"southernYard" in layout && (
        <GroundPatch
          points={layout.southernYard}
          color="#d3c8b3"
          height={0.09}
        />
      )}
      <ModelInstances
        kind="road"
        placements={hongLiemRoads}
        surfaceColor={plantId === "binh-nguyen" ? "#d7c6a5" : "#dca272"}
      />
      <ModelInstances kind="fence" placements={hongLiemFence} />
      <ModelInstances
        kind="building"
        placements={
          "buildings" in layout
            ? layout.buildings
            : [
                {
                  position: [building[0], 0.18, building[1]],
                  rotation: -0.5,
                  scale: [1.35, 1.35, 1.35],
                },
              ]
        }
      />
      {(["treeA", "treeB", "treeC"] as const).map((kind, index) => (
        <ModelInstances
          key={kind}
          kind={kind}
          placements={hongLiemTrees.filter((_, i) => i % 3 === index)}
        />
      ))}
      {hongLiemFields.map((field, index) => {
        const id = `PV-${String(index + 1).padStart(2, "0")}`,
          asset = assets.find((a) => a.id === id)!;
        return (
          <group key={id}>
            <PVField
              field={field}
              index={index}
              asset={asset}
              selected={selected}
              onSelect={(id) => {
                setHovered(null);
                onSelect(id);
              }}
              onHover={setHovered}
              reading={heatmap?.[id]}
            />
            {scenario === "cloud" &&
              asset.scenario?.kind === "cloud" &&
              severity > 0 && (
                <group name="cloud-preview" userData={{ cloudAsset: id }}>
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
                </group>
              )}
          </group>
        );
      })}
      {chosen && outline && (
        <>
          <Line points={outline} color="#3397e7" lineWidth={2.2} />
          <group
            name={chosen.id}
            position={chosen.placement.position}
            userData={{ assetId: chosen.id, pickHeight: 0.7 }}
          />
          <Html
            position={[
              chosen.placement.position[0],
              1.2,
              chosen.placement.position[2],
            ]}
            center
            zIndexRange={[2, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="selection-marker">Đang chọn · {chosen.id}</span>
          </Html>
        </>
      )}
      {hover && hoverAsset && hover.id !== selected && (
        <Html
          position={[
            hover.placement.position[0],
            1.5,
            hover.placement.position[2],
          ]}
          center
          zIndexRange={[3, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div role="tooltip" className="scene-label">
            {hover.id}
            <span>{hover.name}</span>
            {heatmap ? (
              <span>
                Dữ liệu vùng {hover.parentId}: {heatmap[hover.parentId]?.label}
              </span>
            ) : (
              <>
                <span>{assetStatus(hoverAsset).label}</span>
                <span>
                  {number(
                    hoverAsset.signals.find((s) => s.id.endsWith(".pdc"))
                      ?.value ?? 0,
                  )}{" "}
                  kW DC
                </span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
