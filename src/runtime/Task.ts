import { PowerEase } from '@babylonjs/core/Animations/easing';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export interface ReadonlyTask<T = any> {
  readonly target: T;
  readonly isSynchoronous: boolean;
  readonly isFinished: boolean;
}

export abstract class Task<T = any> implements ReadonlyTask<T> {
  public readonly target: T;
  public readonly isSynchoronous: boolean;

  public readonly runAfter: ReadonlyTask[];
  private _isRunning: boolean;

  public abstract isFinished: boolean;
  public abstract forceFinish(): void;

  public constructor(
    target: T,
    runAfter: ReadonlyTask[],
    isSynchoronous: boolean,
  ) {
    this.target = target;
    this.runAfter = [...new Set(runAfter)];
    this.isSynchoronous = isSynchoronous;
    this._isRunning = false;
  }

  public update(_deltaTime: number): void {
    this._isRunning = true;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get isReady(): boolean {
    const runAfter = this.runAfter;
    for (let i = 0; i < runAfter.length; ++i) {
      if (runAfter[i].isFinished) {
        runAfter.splice(i, 1);
        i -= 1;
      } else {
        return false;
      }
    }
    return true;
  }
}

export class SynchoronousTask extends Task<any> {
  private _callback: () => void;

  public constructor(
    target: any,
    runAfter: ReadonlyTask[],
    callback: () => void,
  ) {
    super(target, runAfter, true);
    this._callback = callback;
  }

  public override update(deltaTime: number): void {
    if (!this.isRunning) {
      this._callback();
    }
    super.update(deltaTime);
  }

  public override get isFinished(): boolean {
    return this.isRunning;
  }

  public override forceFinish(): void {
    this.update(0);
  }
}

export class TransitionTask extends Task<TransformNode> {
  private _onStart: () => void;
  private _onEnd: () => void;

  private _duration: number;
  private _initialPosition: Vector3;
  private _finalPosition: Vector3;
  private _elapsedTime: number;

  private static _powerEase: PowerEase;

  static {
    TransitionTask._powerEase = new PowerEase();
    TransitionTask._powerEase.setEasingMode(PowerEase.EASINGMODE_EASEIN);
  }

  public constructor(
    target: TransformNode,
    runAfter: ReadonlyTask[],
    onStart: () => void,
    onEnd: () => void,
    duration: number,
    initialPosition: Vector3,
    finalPosition?: Vector3,
  ) {
    super(target, runAfter, false);
    this._onStart = onStart;
    this._onEnd = onEnd;
    this._duration = duration;
    this._initialPosition = initialPosition.clone();
    this._finalPosition = finalPosition
      ? finalPosition.clone()
      : target.position.clone();
    this._elapsedTime = 0;
  }

  private static _waitAfterFinish: number = 0.5;

  public override update(deltaTime: number): void {
    if (!this.isRunning) {
      this._onStart();
    }
    super.update(deltaTime);

    let isFinished = this.isFinished;

    this._elapsedTime += deltaTime;

    const normalizedTime = Math.min(this._elapsedTime / this._duration, 1);

    const weight = TransitionTask._powerEase.ease(normalizedTime);

    Vector3.LerpToRef(
      this._initialPosition,
      this._finalPosition,
      weight,
      this.target.position,
    );

    if (!isFinished && this.isFinished) {
      this._onEnd();
    }
  }

  public get isFinished(): boolean {
    return (
      this._elapsedTime >= this._duration + TransitionTask._waitAfterFinish
    );
  }

  public forceFinish(): void {
    if (this.isFinished) {
      return;
    }
    this._elapsedTime = 0;
    this.update(this._duration + TransitionTask._waitAfterFinish + 1);
  }
}
