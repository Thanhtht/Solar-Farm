"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, ConeGeometry, InstancedMesh, Object3D, Vector3 } from "three";
import type { Asset } from "@/data/plant";
import { buildPowerLinks, powerColors } from "@/lib/power-network";

const ignoreRaycast = () => {};
const up = new Vector3(0, 1, 0);

export function PowerNetwork({ assets }: { assets: Asset[] }) {
  const { invalidate, gl } = useThree();
  const links = useMemo(() => buildPowerLinks(assets), [assets]);
  const arrows = useRef<InstancedMesh>(null);
  const elapsed = useRef(0);
  const animate = useRef(false);
  const geometry = useMemo(() => new ConeGeometry(0.24, 0.75, 4), []);
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
          const count = Math.max(2, Math.min(10, Math.ceil(length / 5)));
          return Array.from({ length: count }, (_, index) => ({
            points,
            lengths,
            length,
            offset: index / count,
            color: new Color(link.state === "affected" ? "#ff6555" : "#35e8ae"),
          }));
        }),
    [links],
  );

  useLayoutEffect(() => {
    markers.forEach((marker, i) => arrows.current?.setColorAt(i, marker.color));
    if (arrows.current?.instanceColor)
      arrows.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [markers, invalidate]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
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
  }, [gl, invalidate, markers.length]);

  useFrame((_, delta) => {
    if (animate.current) elapsed.current += Math.min(delta, 0.1);
    markers.forEach((marker, i) => {
      let distance =
        (marker.offset * marker.length + elapsed.current * 3) % marker.length;
      let segment = 0;
      while (
        segment < marker.lengths.length - 1 &&
        distance > marker.lengths[segment]
      )
        distance -= marker.lengths[segment++];
      const start = marker.points[segment],
        end = marker.points[segment + 1];
      dummy.position.copy(start).lerp(end, distance / marker.lengths[segment]);
      dummy.quaternion.setFromUnitVectors(
        up,
        new Vector3().subVectors(end, start).normalize(),
      );
      dummy.updateMatrix();
      arrows.current?.setMatrixAt(i, dummy.matrix);
    });
    if (arrows.current) {
      arrows.current.instanceMatrix.needsUpdate = true;
      // Observe actual instance transforms, not just the intended animation state.
      gl.domElement.dataset.powerFlowFirstArrow = markers.length
        ? JSON.stringify(
            Array.from(arrows.current.instanceMatrix.array.slice(12, 15)),
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
          lineWidth={2.5}
          raycast={ignoreRaycast}
          userData={{ powerLink: link }}
        />
      ))}
      <instancedMesh
        ref={arrows}
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
