"use client";
import { resolvePlantAsset } from "@/lib/plant-assets";
import { usePlant } from "./plant-context";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, SphereGeometry, InstancedMesh, Object3D, Vector3 } from "three";
import type { Asset } from "@/data/plant";
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
    return buildPowerLinks(
      child?.parentId ? [...assets, child] : assets,
      plantId,
    );
  }, [assets, plantId, selected]);
  const dots = useRef<InstancedMesh>(null);
  const elapsed = useRef(0);
  const animate = useRef(false);
  const lastFrameTime = useRef(0);
  // Hong Liem's overview spans roughly four times Sava's scene distance.
  // This is a visual cue only; it does not model electrical propagation speed.
  const flowSpeed = plantId === "hong-liem-3" ? 12 : 3;
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
          lineWidth={link.role === "trunk" ? 5.5 : 2.5}
          raycast={ignoreRaycast}
          userData={{ powerLink: link }}
        />
      ))}
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
