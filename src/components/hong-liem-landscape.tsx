"use client";
import { useMemo, useEffect, useState } from "react";
import { Html, Line } from "@react-three/drei";
import { Shape, ShapeGeometry, Vector2 } from "three";
import { ModelInstances } from "./scene-models";
import {
  hongLiemBoundary,
  hongLiemFence,
  hongLiemFields,
  hongLiemRoads,
  hongLiemTrees,
  photoToGround,
  serviceYard,
  vegetationIsland,
  type Point2,
} from "@/data/hong-liem-layout";
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

export function HongLiemLandscape({
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
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );
  const building = photoToGround([565, 127]);
  return (
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
      <ModelInstances
        kind="building"
        placements={[
          {
            position: [building[0], 0.18, building[1]],
            rotation: -0.5,
            scale: [1.35, 1.35, 1.35],
          },
        ]}
      />
      {(["treeA", "treeB", "treeC"] as const).map((kind, index) => (
        <ModelInstances
          key={kind}
          kind={kind}
          placements={hongLiemTrees.filter((_, i) => i % 3 === index)}
        />
      ))}
      {hongLiemFields.map((field, index) => {
        const id = `PV-${String(index + 1).padStart(2, "0")}`;
        const asset = assets.find((a) => a.id === id)!;
        const active = selected === id;
        const reading = heatmap?.[id];
        const status = assetStatus(asset);
        const lineColor = heatmap
          ? active
            ? "#2563eb"
            : "#93a6b8"
          : status.level === "critical"
            ? "#e44538"
            : status.level === "warning"
              ? "#e9b323"
              : "#19a86b";
        const path = [...field.polygon, field.polygon[0]].map(
          ([x, z]) => [x, 0.3, z] as [number, number, number],
        );
        const select = () => {
          setHovered(null);
          onSelect(id);
        };
        return (
          <group
            key={id}
            name={id}
            userData={{ assetId: id, pickHeight: 0.7 }}
            position={[0, 0, 0]}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (event.pointerType !== "touch" && event.buttons === 0)
                setHovered(id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = "auto";
            }}
          >
            <GroundPatch
              points={field.polygon}
              color="#bd8056"
              height={0.07}
              onSelect={select}
            />
            <ModelInstances
              kind="pv"
              placements={field.rows}
              cellsOnly={!active}
              onSelect={select}
              cellColor={
                reading?.color ??
                (asset.operatingState === "stopped"
                  ? "#334459"
                  : asset.scenario?.kind === "dust"
                    ? "#8d7960"
                    : "#213f69")
              }
            />
            <Line
              points={path}
              color={lineColor}
              lineWidth={active ? 2.5 : 1}
            />
            {active && (
              <Html
                position={[field.center[0], 2, field.center[1]]}
                center
                zIndexRange={[2, 0]}
                style={{ pointerEvents: "none" }}
              >
                <span className="selection-marker">Đang chọn · {id}</span>
              </Html>
            )}
            {hovered === id && (
              <Html
                position={[field.center[0], 3, field.center[1]]}
                center
                zIndexRange={[3, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div
                  role="tooltip"
                  className={`scene-label ${status.level !== "normal" ? "scene-label-attention" : ""}`}
                >
                  {id}
                  <span>{asset.name}</span>
                  <span className="scene-label-status">
                    {reading ? reading.label : status.label}
                  </span>
                  {!heatmap && (
                    <span>
                      {number(
                        asset.signals.find((s) => s.id.endsWith(".pdc"))
                          ?.value ?? 0,
                      )}{" "}
                      MW DC
                    </span>
                  )}
                </div>
              </Html>
            )}
            {scenario === "cloud" &&
              asset.scenario?.kind === "cloud" &&
              severity > 0 && (
                <group name="cloud-preview">
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
    </group>
  );
}
