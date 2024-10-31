import { MethodInterceptor } from './method-interceptor';
import { MultiAction } from './multi-action';

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
    if (!MultiAction) {
      actions.forEach((action) => this._interceptor.invokeOriginal(action));
      return;
    }

    const action = new MultiAction(actions);
    if (description)
      (action as any)._description = description;

    this._interceptor.invokeOriginal(action);
  }
}
