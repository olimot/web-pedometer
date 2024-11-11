export interface SimpleStepDetectorEventMap {
  error: ErrorEvent;
  step: CustomEvent<{ timeNs: number }>;
}

export default class SimpleStepDetector extends EventTarget {
  private static ACCEL_RING_SIZE = 50;
  private static VEL_RING_SIZE = 10;
  private static STEP_THRESHOLD = 4;
  private static STEP_DELAY_MS = 250;

  private accelRingCounter = 0;
  private accelRingX = new Float64Array(SimpleStepDetector.ACCEL_RING_SIZE);
  private accelRingY = new Float64Array(SimpleStepDetector.ACCEL_RING_SIZE);
  private accelRingZ = new Float64Array(SimpleStepDetector.ACCEL_RING_SIZE);
  private velRingCounter = 0;
  private velRing = new Float64Array(SimpleStepDetector.VEL_RING_SIZE);
  private lastStepTimeMs = 0;
  private oldVelocityEstimate = 0;

  constructor(accelerometer: Accelerometer) {
    super();
    accelerometer.addEventListener("error", (event) => {
      this.dispatchEvent(new ErrorEvent("error", { error: event.error }));
    });
    accelerometer.addEventListener("reading", (e) => {
      this.updateAccel(
        e.timeStamp,
        accelerometer.x,
        accelerometer.y,
        accelerometer.z,
      );
    });
    accelerometer.start();
  }

  addEventListener<K extends keyof SimpleStepDetectorEventMap>(
    type: K,
    listener: (
      this: SimpleStepDetector,
      ev: SimpleStepDetectorEventMap[K],
    ) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }

  /**
   * Accepts updates from the accelerometer.
   */
  updateAccel(timeMs: number, x: number, y: number, z: number) {
    const currentAccel = new Float64Array(3);
    currentAccel[0] = x;
    currentAccel[1] = y;
    currentAccel[2] = z;

    // First step is to update our guess of where the global z vector is.
    this.accelRingCounter++;
    this.accelRingX[
      this.accelRingCounter % SimpleStepDetector.ACCEL_RING_SIZE
    ] = currentAccel[0];
    this.accelRingY[
      this.accelRingCounter % SimpleStepDetector.ACCEL_RING_SIZE
    ] = currentAccel[1];
    this.accelRingZ[
      this.accelRingCounter % SimpleStepDetector.ACCEL_RING_SIZE
    ] = currentAccel[2];

    const worldZ = new Float64Array(3);
    worldZ[0] =
      this.accelRingX.reduce((a, b) => a + b) /
      Math.min(this.accelRingCounter, SimpleStepDetector.ACCEL_RING_SIZE);
    worldZ[1] =
      this.accelRingY.reduce((a, b) => a + b) /
      Math.min(this.accelRingCounter, SimpleStepDetector.ACCEL_RING_SIZE);
    worldZ[2] =
      this.accelRingZ.reduce((a, b) => a + b) /
      Math.min(this.accelRingCounter, SimpleStepDetector.ACCEL_RING_SIZE);

    const normalization_factor = Math.sqrt(
      worldZ.map((a) => a * a).reduce((a, b) => a + b),
    );

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
    this.velRingCounter++;
    this.velRing[this.velRingCounter % SimpleStepDetector.VEL_RING_SIZE] =
      currentZ;

    const velocityEstimate = this.velRing.reduce((a, b) => a + b);

    if (
      velocityEstimate > SimpleStepDetector.STEP_THRESHOLD &&
      this.oldVelocityEstimate <= SimpleStepDetector.STEP_THRESHOLD &&
      timeMs - this.lastStepTimeMs > SimpleStepDetector.STEP_DELAY_MS
    ) {
      this.dispatchEvent(
        new CustomEvent("step", { detail: { timeNs: timeMs } }),
      );
      this.lastStepTimeMs = timeMs;
    }
    this.oldVelocityEstimate = velocityEstimate;
  }
}
