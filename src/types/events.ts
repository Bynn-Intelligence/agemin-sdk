export enum MessageType {
  SUCCESS = 'agemin:verification:success',
  FAIL = 'agemin:verification:fail',
  ERROR = 'agemin:verification:error',
  CANCEL = 'agemin:verification:cancel',
  CLOSE = 'agemin:verification:close',
  READY = 'agemin:verification:ready',
  RESIZE = 'agemin:verification:resize'
}

export interface AgeminMessage<T = any> {
  type: MessageType | string;
  data?: T;
  timestamp: number;
}

export interface ResizeData {
  width: number;
  height: number;
}