/* eslint-disable @typescript-eslint/ban-types */

type FunctionFromObject<O extends object, FK extends keyof O> = O[FK] extends (
  ...args: any
) => any
  ? O[FK]
  : never;
type InterceptionFn<O extends object, P extends any[], R> = (
  this: O,
  ...args: P
) => R;
type InterceptionFnOfInterceptor<I extends MethodInterceptor<any, any, any>> =
  I extends MethodInterceptor<any, any, infer IFN> ? IFN : never;

export abstract class MethodInterceptor<
  O extends object,
  FK extends keyof O,
  IFN extends (this: O, ...args: any) => any,
> {
  private readonly _object: O;
  private readonly _fnPropName: FK;
  private _interceptionFn: IFN;
  private _isEnabled: boolean;
  private _originalFn: FunctionFromObject<O, FK>;

  constructor(object: O, fnPropName: FK, interceptionFn: IFN) {
    this._object = object;
    this._fnPropName = fnPropName;
    this._interceptionFn = interceptionFn;
    this._isEnabled = false;
    this._originalFn = this.getRefreshedOriginalFn();
  }

  private getRefreshedOriginalFn(): FunctionFromObject<O, FK> {
    if (this._isEnabled) return this._originalFn;

    const propValue = this._object[this._fnPropName];
    if (typeof propValue !== 'function') {
      throw new Error(
        'Unable to refresh the original function, type of property is incompatible (' +
          typeof propValue +
          ')',
      );
    }

    return propValue as FunctionFromObject<O, FK>;
  }

  private restoreOriginalFn() {
    if (!this._isEnabled) return;

    const propValue = this._object[this._fnPropName];
    if (typeof propValue !== 'function') {
      throw new Error(
        'Unable to restore original function, type of property is incompatible (' +
          typeof propValue +
          ')',
      );
    }

    this._object[this._fnPropName] = this._originalFn;
  }

  enable() {
    if (this._isEnabled) return;
    this._originalFn = this.getRefreshedOriginalFn();
    this._object[this._fnPropName] = this._interceptCb.bind(this);
    this._isEnabled = true;
  }
  disable() {
    if (!this._isEnabled) return;
    this.restoreOriginalFn();
    this._isEnabled = false;
  }
  get isEnabled() {
    return this._isEnabled;
  }

  protected _executeOriginalFn(
    ...args: Parameters<FunctionFromObject<O, FK>>
  ): ReturnType<FunctionFromObject<O, FK>> {
    return this._originalFn.apply(this._object, args);
  }

  protected _executeInterceptionFn(...args: Parameters<IFN>): ReturnType<IFN> {
    return this._interceptionFn.apply(this._object, args);
  }

  protected abstract _interceptCb(
    ...args: Parameters<FunctionFromObject<O, FK>>
  ): ReturnType<FunctionFromObject<O, FK>>;
}

export class BeforeMethodInvocationInterceptor<
  O extends object = any,
  FK extends keyof O = any,
> extends MethodInterceptor<
  O,
  FK,
  InterceptionFn<
    O,
    Parameters<FunctionFromObject<O, FK>>,
    | ReturnType<FunctionFromObject<O, FK>>
    | typeof BeforeMethodInvocationInterceptor.CONTINUE_EXECUTION
  >
> {
  static readonly CONTINUE_EXECUTION = Symbol(
    '__CONTINUE_EXECUTION__',
  ) as unknown as Symbol & { __lock: '__INTERCEPTOR_CONTINUE_EXECUTION__' }; // ensures that only this specific symbol can be used to continue method execution, preventing misuse of other symbols

  constructor(
    object: O,
    fnPropName: FK,
    interceptionFn: InterceptionFnOfInterceptor<
      BeforeMethodInvocationInterceptor<O, FK>
    >,
  ) {
    super(object, fnPropName, interceptionFn);
  }

  private static _isContinueExecutionSymbol(
    symbol: any,
  ): symbol is typeof BeforeMethodInvocationInterceptor.CONTINUE_EXECUTION {
    return symbol === BeforeMethodInvocationInterceptor.CONTINUE_EXECUTION;
  }

  protected _interceptCb(
    ...args: Parameters<FunctionFromObject<O, FK>>
  ): ReturnType<FunctionFromObject<O, FK>> {
    const returnValue = this._executeInterceptionFn(...args);
    if (
      !BeforeMethodInvocationInterceptor._isContinueExecutionSymbol(returnValue)
    ) {
      return returnValue;
    }

    return this._executeOriginalFn(...args);
  }
}

export class AfterMethodInvocationInterceptor<
  O extends object = any,
  FK extends keyof O = any,
> extends MethodInterceptor<
  O,
  FK,
  InterceptionFn<
    O,
    [
      originalValue: ReturnType<FunctionFromObject<O, FK>>,
      ...Parameters<FunctionFromObject<O, FK>>,
    ],
    ReturnType<FunctionFromObject<O, FK>>
  >
> {
  constructor(
    object: O,
    fnPropName: FK,
    interceptionFn: InterceptionFnOfInterceptor<
      AfterMethodInvocationInterceptor<O, FK>
    >,
  ) {
    super(object, fnPropName, interceptionFn);
  }

  protected _interceptCb(
    ...args: Parameters<FunctionFromObject<O, FK>>
  ): ReturnType<FunctionFromObject<O, FK>> {
    const originalReturnValue = this._executeOriginalFn(...args);
    return this._executeInterceptionFn(originalReturnValue, ...args);
  }
}

export class ManualMethodInvocationInterceptor<
  O extends object = any,
  FK extends keyof O = any,
> extends MethodInterceptor<
  O,
  FK,
  InterceptionFn<
    O,
    [
      invokeOriginal: (
        ...args: Parameters<FunctionFromObject<O, FK>>
      ) => ReturnType<FunctionFromObject<O, FK>>,
      ...Parameters<FunctionFromObject<O, FK>>,
    ],
    ReturnType<FunctionFromObject<O, FK>>
  >
> {
  constructor(
    object: O,
    fnPropName: FK,
    interceptionFn: InterceptionFnOfInterceptor<
      ManualMethodInvocationInterceptor<O, FK>
    >,
  ) {
    super(object, fnPropName, interceptionFn);
  }

  protected _interceptCb(
    ...args: Parameters<FunctionFromObject<O, FK>>
  ): ReturnType<FunctionFromObject<O, FK>> {
    return this._executeInterceptionFn(
      this._executeOriginalFn.bind(this),
      ...args,
    );
  }
}
