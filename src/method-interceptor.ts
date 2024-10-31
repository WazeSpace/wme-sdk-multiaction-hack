type NonNeverProperties<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
}

type FunctionsInObject<T> = NonNeverProperties<{
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
}>;

export class MethodInterceptor<
  O extends object,
  FN extends keyof FO,
  FO extends FunctionsInObject<O> = FunctionsInObject<O>,
> {
  private _originalMethod: FO[FN];
  private _isEnabled = false;

  constructor(
    private readonly _target: O,
    private readonly _methodName: FN,
    private readonly _interceptor: (
      this: typeof this._target, 
      callOriginal: FO[FN],
      ...args: Parameters<FO[FN]>
    ) => ReturnType<FO[FN]>,
  ) {
    this.initialize();
  }

  initialize() {
    this._originalMethod = this._target[this._methodName as any];
    this._target[this._methodName as any] = this.managedInterceptor;
  }

  invokeOriginal(...args: Parameters<FO[FN]>): ReturnType<FO[FN]> {
    return this._originalMethod.apply(this._target, args);
  }

  managedInterceptor = (...args: Parameters<FO[FN]>) => {
    if (!this._isEnabled)
      return this.invokeOriginal(...args);

    return (this as any)._interceptor(
      (...args: Parameters<FO[FN]>) => this.invokeOriginal(...args),
      ...args,
    );
  }

  enable() {
    this._isEnabled = true;
  }

  disable() {
    this._isEnabled = false;
  }
}
