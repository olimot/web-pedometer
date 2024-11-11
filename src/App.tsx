import { useEffect, useState } from "react";

const ACCEL_RING_SIZE = 50;
const VEL_RING_SIZE = 10;
const STEP_THRESHOLD = 4;
const STEP_DELAY_MS = 250;

const sum = (numbers: Iterable<number>) => {
  let value = 0;
  for (const number of numbers) value += number;
  return value;
};

const norm = (numbers: Iterable<number>) => {
  let value = 0;
  for (const number of numbers) value += number * number;
  return Math.sqrt(value);
};

export default function App() {
  const [isActive, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Press a button to activate it.");

  useEffect(() => {
    if (!isActive) return;
    try {
      const accelerometer = new Accelerometer({ referenceFrame: "device" });
      accelerometer.addEventListener("error", (event) => {
        // Handle runtime errors.
        if (event.error.name === "NotAllowedError") {
          // Branch to code for requesting permission.
        } else if (event.error.name === "NotReadableError") {
          setStatus("Cannot connect to the sensor.");
        }
      });

      accelerometer.addEventListener("activate", () => {
        setStatus("A pedometer is activated.");
      });

      let accelRingCounter = 0;
      const accelRingX = new Float64Array(ACCEL_RING_SIZE);
      const accelRingY = new Float64Array(ACCEL_RING_SIZE);
      const accelRingZ = new Float64Array(ACCEL_RING_SIZE);
      let velRingCounter = 0;
      const velRing = new Float64Array(VEL_RING_SIZE);
      let lastStepTimeMs = 0;
      let oldVelocityEstimate = 0;

      accelerometer.addEventListener("reading", (event) => {
        const currentAccel = new Float64Array(3);
        currentAccel[0] = accelerometer.x;
        currentAccel[1] = accelerometer.y;
        currentAccel[2] = accelerometer.z;

        // First step is to update our guess of where the global z vector is.
        accelRingCounter++;
        accelRingX[accelRingCounter % ACCEL_RING_SIZE] = currentAccel[0];
        accelRingY[accelRingCounter % ACCEL_RING_SIZE] = currentAccel[1];
        accelRingZ[accelRingCounter % ACCEL_RING_SIZE] = currentAccel[2];

        const size = Math.min(accelRingCounter, ACCEL_RING_SIZE);
        const worldZ = new Float64Array(3);
        worldZ[0] = sum(accelRingX) / size;
        worldZ[1] = sum(accelRingY) / size;
        worldZ[2] = sum(accelRingZ) / size;

        const normalization_factor = norm(worldZ);

        worldZ[0] = worldZ[0] / normalization_factor;
        worldZ[1] = worldZ[1] / normalization_factor;
        worldZ[2] = worldZ[2] / normalization_factor;

        // Next step is to figure out the component of the current acceleration
        // in the direction of world_z and subtract gravity's contribution
        const dot =
          worldZ[0] * currentAccel[0] +
          worldZ[1] * currentAccel[1] +
          worldZ[2] * currentAccel[2];
        const currentZ = dot - normalization_factor;
        velRingCounter++;
        velRing[velRingCounter % VEL_RING_SIZE] = currentZ;

        const velocityEstimate = sum(velRing);

        if (
          velocityEstimate > STEP_THRESHOLD &&
          oldVelocityEstimate <= STEP_THRESHOLD &&
          event.timeStamp - lastStepTimeMs > STEP_DELAY_MS
        ) {
          setCount((prev) => prev + 1);
          lastStepTimeMs = event.timeStamp;
        }
        oldVelocityEstimate = velocityEstimate;
      });

      accelerometer.start();
      return () => {
        accelerometer.stop();
        setStatus("A Pedometer is stopped.");
      };
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.name === "SecurityError") {
        setStatus("Sensor construction was blocked by a permissions policy.");
      } else if (error.name === "ReferenceError") {
        setStatus("Sensor is not supported by the User Agent.");
      } else {
        throw error;
      }
    }
  }, [isActive]);
  return (
    <>
      <h1>Web Pedometer</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <div className="switch-button">
          <button type="button" onClick={() => setActive(!isActive)}>
            <div className="label">Active</div>
            <div className={isActive ? "indicator on" : "indicator"} />
          </button>
        </div>
        <div className="counter" style={{ fontSize: 48, width: 140 }}>
          {count.toString().padStart(5, "0")}
        </div>
      </div>
      <div className="status-bar">{status || <>&nbsp;</>}</div>
    </>
  );
}
