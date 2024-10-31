import { Action } from './action';
import { getWazeMapEditorWindow } from './get-wme-window';
import { MultiAction } from './multi-action';

function getMultiActionClass(): typeof MultiAction {
  try {
    const window = getWazeMapEditorWindow();
    return window.require('Waze/Action/MultiAction');
  } catch {
    return null;
  }
}

export function createMultiAction(subActions?: Action[]) {
  const MultiAction = getMultiActionClass();
  if (!MultiAction) throw new Error('Unable to retrieve MultiAction');
  return new MultiAction(subActions);
}
