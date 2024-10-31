import { getWazeMapEditorWindow } from './get-wme-window';

function tryGetMultiAction() {
  try {
    const window = getWazeMapEditorWindow();
    return window.require('Waze/Action/MultiAction');
  } catch {
    return null;
  }
}

export const MultiAction = tryGetMultiAction();
