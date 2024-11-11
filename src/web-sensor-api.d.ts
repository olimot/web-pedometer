interface SensorErrorEvent extends Event {
  readonly error: DOMException;
}

interface SensorEventMap {
  actiavte: Event;
  reading: Event;
  error: SensorErrorEvent;
}

interface Sensor extends EventTarget {
  start(): void;
  stop(): void;

  addEventListener<K extends keyof SensorEventMap>(
    type: K,
    listener: (this: Accelerometer, ev: SensorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removEventListener<K extends keyof SensorEventMap>(
    type: K,
    listener: (this: Accelerometer, ev: SensorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

declare class Accelerometer extends EventTarget implements Sensor {
  constructor(options?: unknown);
  get x(): number;
  get y(): number;
  get z(): number;
  start(): void;
  stop(): void;

  addEventListener<K extends keyof SensorEventMap>(
    type: K,
    listener: (this: Accelerometer, ev: SensorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removEventListener<K extends keyof SensorEventMap>(
    type: K,
    listener: (this: Accelerometer, ev: SensorEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}
