import { MethodInterceptor } from './method-interceptor';
import { createMultiAction } from './multi-action-utils';

interface ActionManager {
  add(action: any): void;
}

export class TransactionManager {
  private _interceptor: MethodInterceptor<ActionManager, 'add'>;
  private _actionsInTransaction: any[] = [];
  private _hasActiveTransaction = false;

  constructor(actionManager: ActionManager) {
    this._interceptor = new MethodInterceptor(
      actionManager,
      'add',
      (triggerOriginal, action) => {
        if (!this.isTransactionOpen)
          return triggerOriginal(action);

        this._actionsInTransaction.push(action);
        return null;
      },
    );
    this._interceptor.enable();
  }

  private closeTransaction() {
    this._hasActiveTransaction = false;
    return this.getTransactionActions();
  }

  private openTransaction() {
    this._actionsInTransaction = [];
    this._hasActiveTransaction = true;
  }

  private get isTransactionOpen() {
    return this._hasActiveTransaction;
  }

  beginTransaction() {
    this.openTransaction();
  }

  private getTransactionActions() {
    return this._actionsInTransaction;
  }

  commitTransaction(description?: string) {
    const actions = this.closeTransaction();
    const multiAction = createMultiAction(actions);
    if (!multiAction) {
      actions.forEach((action) => this._interceptor.invokeOriginal(action));
      return;
    }

    if (description)
      (multiAction as any)._description = description;

    this._interceptor.invokeOriginal(multiAction);
  }
}
