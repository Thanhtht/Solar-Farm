"use client";
import { resolvePlantAsset } from "@/lib/plant-assets";
import { usePlant } from "./plant-context";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { Color, SphereGeometry, InstancedMesh, Object3D, Vector3 } from "three";
import type { Asset } from "@/data/plant";
import { binhTerminals } from "@/lib/binh-nguyen-cables";
import { buildPowerLinks, powerColors } from "@/lib/power-network";

const ignoreRaycast = () => {};

export function PowerNetwork({
  assets,
  selected,
}: {
  assets: Asset[];
  selected?: string | null;
}) {
  const { invalidate, gl } = useThree();
  const { plantId } = usePlant();
  const links = useMemo(() => {
    const child = resolvePlantAsset(assets, selected ?? null, plantId);
    const result = buildPowerLinks(
      child?.parentId ? [...assets, child] : assets,
      plantId,
    );
    // A focused table substitutes its region's DC trace. Drawing both traces
    // over the same cable produces duplicate moving dots and conflicting cues.
    return plantId === "binh-nguyen" && child?.parentId
      ? result.filter((l) => !(l.kind === "DC" && l.from === child.parentId))
      : result;
  }, [assets, plantId, selected]);
  const selectedAsset = resolvePlantAsset(assets, selected ?? null, plantId);
  const selectedInverter =
    plantId === "binh-nguyen"
      ? selectedAsset?.type === "inverter"
        ? selectedAsset
        : assets.find(
            (a) =>
              a.type === "inverter" && selectedAsset?.related.includes(a.id),
          )
      : undefined;
  const terminals = selectedInverter ? binhTerminals(selectedInverter) : null;
  const dots = useRef<InstancedMesh>(null);
  const elapsed = useRef(0);
  const animate = useRef(false);
  const lastFrameTime = useRef(0);
  // Hong Liem's overview spans roughly four times Sava's scene distance.
  // This is a visual cue only; it does not model electrical propagation speed.
  const flowSpeed = plantId !== "sava" ? 12 : 3;
  const geometry = useMemo(() => new SphereGeometry(0.11, 8, 6), []);
  const dummy = useMemo(() => new Object3D(), []);
  const markers = useMemo(
    () =>
      links
        .filter((link) => link.running)
        .flatMap((link) => {
          const points = link.points.map((point) => new Vector3(...point));
          const lengths = points
            .slice(1)
            .map((point, i) => point.distanceTo(points[i]));
          const length = lengths.reduce((sum, part) => sum + part, 0);
          if (length < 1e-6) return [];
          const count = Math.max(2, Math.min(10, Math.ceil(length / 5)));
          return Array.from({ length: count }, (_, index) => ({
            points,
            lengths,
            length,
            offset: index / count,
            color: new Color(link.state === "degraded" ? "#ffda55" : "#35e8ae"),
          }));
        }),
    [links],
  );

  useLayoutEffect(() => {
    markers.forEach((marker, i) => dots.current?.setColorAt(i, marker.color));
    if (dots.current?.instanceColor)
      dots.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [markers, invalidate]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      lastFrameTime.current = performance.now();
      animate.current =
        !preference.matches && !document.hidden && markers.length > 0;
      gl.domElement.dataset.powerFlowMotion = preference.matches
        ? "reduced"
        : document.hidden
          ? "hidden"
          : markers.length
            ? "animated"
            : "stopped";
      if (animate.current) timer = setInterval(invalidate, 1000 / 24);
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
  }, [gl, invalidate, markers.length, plantId]);

  useFrame(() => {
    const now = performance.now();
    if (animate.current)
      elapsed.current += (now - lastFrameTime.current) / 1000;
    lastFrameTime.current = now;
    markers.forEach((marker, i) => {
      let distance =
        (marker.offset * marker.length + elapsed.current * flowSpeed) %
        marker.length;
      let segment = 0;
      while (
        segment < marker.lengths.length - 1 &&
        distance > marker.lengths[segment]
      )
        distance -= marker.lengths[segment++];
      const start = marker.points[segment],
        end = marker.points[segment + 1];
      dummy.position.copy(start).lerp(end, distance / marker.lengths[segment]);
      dummy.updateMatrix();
      dots.current?.setMatrixAt(i, dummy.matrix);
    });
    if (dots.current) {
      dots.current.instanceMatrix.needsUpdate = true;
      // Observe actual instance transforms, not just the intended animation state.
      gl.domElement.dataset.powerFlowMarker = "dot";
      gl.domElement.dataset.powerFlowTimestamp = String(now);
      gl.domElement.dataset.powerFlowDotRadius = String(
        geometry.parameters.radius,
      );
      gl.domElement.dataset.powerFlowFirstDot = markers.length
        ? JSON.stringify(
            Array.from(dots.current.instanceMatrix.array.slice(12, 15)),
          )
        : "null";
    }
  });
  return (
    <group name="power-network">
      {links.map((link) => (
        <Line
          key={link.id}
          name="power-cable"
          points={link.points}
          color={powerColors[link.state]}
          lineWidth={
            link.role === "trunk"
              ? 5.5
              : plantId === "binh-nguyen" && link.kind === "AC"
                ? 3.5
                : 2.5
          }
          dashed={plantId === "binh-nguyen" && link.kind === "DC"}
          dashSize={0.22}
          gapSize={0.12}
          raycast={ignoreRaycast}
          userData={{ powerLink: link }}
        />
      ))}
      {plantId === "binh-nguyen" &&
        links.map((link) => {
          const pair =
            link.kind === "DC"
              ? link.points.slice(-2)
              : link.points.slice(0, 2);
          const a = new Vector3(...pair[0]),
            b = new Vector3(...pair[1]);
          const direction = b.clone().sub(a).normalize();
          const tip =
            link.kind === "DC"
              ? b.clone().addScaledVector(direction, -0.18)
              : a
                  .clone()
                  .addScaledVector(
                    direction,
                    Math.min(0.6, a.distanceTo(b) * 0.7),
                  );
          const back = tip.clone().addScaledVector(direction, -0.28);
          const wing = new Vector3(-direction.z, 0, direction.x).multiplyScalar(
            0.17,
          );
          return (
            <Line
              key={`direction-${link.id}`}
              points={[back.clone().add(wing), tip, back.clone().sub(wing)]}
              color={powerColors[link.state]}
              lineWidth={2.5}
              raycast={ignoreRaycast}
            />
          );
        })}
      {terminals && selectedInverter && (
        <>
          <Html
            center
            position={[terminals.dc[0], 0.65, terminals.dc[1] + 1.2]}
            style={{ pointerEvents: "none" }}
          >
            <span
              className="power-terminal-label"
              data-power-terminal="DC"
              style={{
                whiteSpace: "nowrap",
                fontSize: 11,
                padding: "4px 7px",
                background: "#ffffffee",
                border: "1px dashed #77958b",
                borderRadius: 5,
                color: "#274e43",
              }}
            >
              DC vào · Pin → {selectedInverter.id}
            </span>
          </Html>
          <Html
            center
            position={[terminals.ac[0], 0.65, terminals.ac[1] + 1.2]}
            style={{ pointerEvents: "none" }}
          >
            <span
              className="power-terminal-label"
              data-power-terminal="AC"
              style={{
                whiteSpace: "nowrap",
                fontSize: 11,
                padding: "4px 7px",
                background: "#ffffffee",
                border: "1px solid #77958b",
                borderRadius: 5,
                color: "#274e43",
              }}
            >
              AC ra · {selectedInverter.id} → TR-01
            </span>
          </Html>
        </>
      )}
      <instancedMesh
        ref={dots}
        args={[geometry, undefined, Math.max(markers.length, 1)]}
        count={markers.length}
        frustumCulled={false}
        raycast={ignoreRaycast}
      >
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
