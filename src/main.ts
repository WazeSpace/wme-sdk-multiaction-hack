import { getWazeMapEditorWindow } from './get-wme-window'
import { TransactionManager } from './transaction-manager'

const window = getWazeMapEditorWindow();

let transactionManager: TransactionManager;

window.SDK_INITIALIZED.then(() => {
  transactionManager = new TransactionManager(window.W.model.actionManager);;
});

export default {
  beginTransaction: () => transactionManager.beginTransaction(),
  commitTransaction: (description?: string) => transactionManager.commitTransaction(description),
  groupActions(cb: () => void, description?: string) {
    transactionManager.beginTransaction();
    cb();
    transactionManager.commitTransaction(description);
  },
}