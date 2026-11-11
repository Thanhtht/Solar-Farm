import { branchRating } from "../data/plant-profiles";
import { baseline, type Run } from "./simulation";

export function integrateHistory(values: (number | null)[]) {
  const result: (number | null)[] = [0];
  for (let index = 1; index < values.length; index++) {
    const previous = result[index - 1],
      power = values[index - 1];
    result.push(
      previous === null || power === null ? null : previous + power / 60,
    );
  }
  return result;
}
export function monitoringMetrics(snapshot: Run) {
  const inverters = snapshot.assets.filter(
    (asset) => asset.type === "inverter",
  );
  const irradiance = snapshot.assets
    .find((asset) => asset.id === "MET-01")!
    .signals.find((signal) => signal.id.endsWith(".irr"))!;
  const reference = irradiance.history.map((value) =>
    value === null
      ? null
      : Math.min(
          baseline.acLimitMW,
          inverters.reduce((sum, inverter) => {
            const rating = branchRating(inverter.id, snapshot.plantId);
            return (
              sum +
              Math.min(
                rating.acMW,
                ((rating.dcMWp * value) / baseline.referenceIrradiance) *
                  baseline.dcDerating *
                  baseline.efficiency,
              )
            );
          }, 0),
        ),
  );
  const reduction = snapshot.powerHistory.map((power, index) =>
    power === null || reference[index] === null
      ? null
      : Math.max(0, reference[index]! - power),
  );
  const availability = snapshot.times.map((_, index) => {
    const faults = inverters.map(
      (asset) =>
        asset.signals.find((signal) => signal.id.endsWith(".fault"))!.history[
          index
        ],
    );
    return faults.some((value) => value == null)
      ? null
      : (faults.filter((value) => value === 0).length / inverters.length) * 100;
  });
  return {
    reference,
    reduction,
    availability,
    energy: integrateHistory(snapshot.powerHistory),
    referenceEnergy: integrateHistory(reference),
    loss: integrateHistory(reduction),
    inverters,
  };
}
