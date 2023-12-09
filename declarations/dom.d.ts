
interface PensionInfo {
  summary: number;
  bubbles: boolean;
  cancelable: boolean;
}

interface GlobalEventHandlersEventMap {
  'pension.added': CustomEvent<PensionInfo>;
}
