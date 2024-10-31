export function getWazeMapEditorWindow(): any {
  if ('unsafeWindow' in window)
    return window.unsafeWindow;
  return window;
}
