import { Action } from './action';
import { MethodInterceptor } from './method-interceptor';
import { createMultiAction } from './multi-action-utils';

interface ActionManager {
  dataModel: any;
  add(action: Action): boolean;
}

export class TransactionManager {
  private _interceptor: MethodInterceptor<ActionManager, 'add'>;
  private _actionsInTransaction: Action[] = [];
  private _undoableActionsInTransaction: Action[] = [];
  private _hasActiveTransaction = false;

  constructor(private readonly _actionManager: ActionManager) {
    this._interceptor = new MethodInterceptor(
      _actionManager,
      'add',
      (triggerOriginal, action) => {
        if (!this.isTransactionOpen)
          return triggerOriginal(action);

        if (action.undoSupported()) {
          let isActionPerformed = false;
          let actionResult = undefined;
          new MethodInterceptor(
            action,
            'doAction',
            (callOrig, ...args) => {
              if (isActionPerformed) return actionResult;
              isActionPerformed = true;
              return (actionResult = callOrig(...args));
            },
          ).enable();
          new MethodInterceptor(
            action,
            'undoAction',
            (callOrig, ...args) => {
              const result = callOrig(...args);
              isActionPerformed = false;
              actionResult = undefined;
              return result;
            },
          ).enable();
          action.doAction(_actionManager.dataModel);
          this._undoableActionsInTransaction.push(action);
        }
        this._actionsInTransaction.push(action);
        return true;
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
    this._undoableActionsInTransaction = [];
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

  cancelTransaction() {
    this._undoableActionsInTransaction.forEach(
      (action) => action.undoAction(this._actionManager.dataModel)
    );
    this.closeTransaction();
  }
}
