/**
 * Lets you turn a non promise callback into a promise.
 *
 * @example
 *   try {
 *     const deferred = new Deferred();
 *
 *     getConfirmation({
 *        onSuccess: deferred.resolve,
 *        onFailure: deferred.reject,
 *      });
 *
 *     await deferred.promise;
 *   } catch {}
 */
export class Deferred<T = void> {
  private _resolve!: (value: T) => void;
  private _reject!: (reason?: any) => void;

  // The underlying promise that can be awaited
  public readonly promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  // Resolves the promise, allowing any awaiting code to continue.
  public resolve(value?: T): void {
    this._resolve(value as T);
  }

  // Optionally, you can reject the promise.
  public reject(reason?: any): void {
    this._reject(reason);
  }

  // These methods allow the instance to be used as a thenable.
  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  public finally(onfinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onfinally);
  }
}
