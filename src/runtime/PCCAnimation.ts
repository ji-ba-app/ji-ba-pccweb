import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

/**
 * Describe a Generic binded animation
 */
export interface PCCAnimation<T = any> {
  /**
   * Target of the animation
   */
  readonly target: T;

  /**
   * Name of the animation
   */
  readonly name: string;

  /**
   * Animate the target
   * @param time Time in seconds
   */
  animate(time: number): void;

  /**
   * Clone the animation
   * @param target If provided, the target of the cloned animation
   */
  clone(target?: T): PCCAnimation<T>;
}

/**
 * Finite animation which has a duration
 */
export interface PCCFiniteAnimation<T> extends PCCAnimation<T> {
  /**
   * Duration of the animation in seconds
   */
  readonly duration: number;
}

/**
 * Describe a procedural animation
 */
export abstract class PCCProceduralAnimation<T> implements PCCAnimation<T> {
  public readonly target: T;
  public readonly name: string;

  private _lastTime = 0;

  /**
   * Create a new procedural animation
   * @param target target of the animation
   * @param name name of the animation
   */
  public constructor(target: T, name: string) {
    this.target = target;
    this.name = name;
  }

  public animate(time: number): void {
    const deltaTime = time - this._lastTime;
    this._lastTime = time;
    this.deltaAnimate(deltaTime);
  }

  protected abstract deltaAnimate(deltaTime: number): void;

  public abstract clone(target?: T): PCCAnimation<T>;
}

/**
 * Rotate animation for fan or wheel
 */
export class PCCRotateAnimation extends PCCProceduralAnimation<TransformNode> {
  /**
   * Speed of the rotation in radian per second
   */
  public speed: number;

  /**
   * Axis of the rotation (default is forward)
   */
  public readonly axis: Vector3;

  private readonly _initialRotation: Quaternion;
  private readonly _accumulatedRotation: Quaternion;

  /**
   * Create a new rotate animation
   * @param target Bind target
   * @param name Name of the animation
   * @param speed Speed of the rotation in radian per second
   * @param axis Axis of the rotation (default is forward)
   */
  public constructor(
    target: TransformNode,
    name: string,
    speed: number,
    axis: Vector3 = Vector3.Up(),
  ) {
    super(target, name);
    this.speed = speed;
    this.axis = axis;
    this._initialRotation =
      target.rotationQuaternion?.clone() ??
      Quaternion.FromEulerVector(target.rotation);
    this._accumulatedRotation = Quaternion.Identity();
  }

  private static _tempQuaternion = Quaternion.Identity();

  protected override deltaAnimate(deltaTime: number): void {
    const rotation = Quaternion.RotationAxisToRef(
      this.axis,
      this.speed * deltaTime,
      PCCRotateAnimation._tempQuaternion,
    );
    this._accumulatedRotation.multiplyToRef(
      rotation,
      this._accumulatedRotation,
    );

    this.target.rotationQuaternion = this._initialRotation.multiplyToRef(
      this._accumulatedRotation,
      this.target.rotationQuaternion ?? new Quaternion(),
    );
  }

  public override clone(target?: TransformNode): PCCAnimation<TransformNode> {
    return new PCCRotateAnimation(
      target ?? this.target,
      this.name,
      this.speed,
      this.axis.clone(),
    );
  }
}
