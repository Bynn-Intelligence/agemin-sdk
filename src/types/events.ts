export enum MessageType {
  SUCCESS = 'agemin:verification:success',
  ERROR = 'agemin:verification:error',
  CANCEL = 'agemin:verification:cancel',
  CLOSE = 'agemin:verification:close',
  READY = 'agemin:verification:ready',
  RESIZE = 'agemin:verification:resize',
  // New message types from app
  APP_READY = 'agemin:app:ready',
  APP_ERROR = 'agemin:app:error',
  PROGRESS = 'agemin:verification:progress',
  STATE_CHANGE = 'agemin:state:change',
  USER_ACTION = 'agemin:user:action',
  CONFIG_RECEIVED = 'agemin:config:received'
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