import { getWazeMapEditorWindow } from './get-wme-window'
import { TransactionManager } from './transaction-manager'

const window = getWazeMapEditorWindow();
const transactionManager = new TransactionManager(window.W.model.actionManager);

export default {
  beginTransaction: () => transactionManager.beginTransaction(),
  commitTransaction: (description?: string) => transactionManager.commitTransaction(description),
  groupActions(cb: () => void, description?: string) {
    transactionManager.beginTransaction();
    cb();
    transactionManager.commitTransaction(description);
  },
}