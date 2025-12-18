
export enum AppState {
  CLOSED = 'CLOSED',
  SCATTERED = 'SCATTERED',
  ZOOMED = 'ZOOMED'
}

export interface HandGesture {
  isFist: boolean;
  isOpen: boolean;
  isGrabbing: boolean;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number };
  rawLandmarks?: any;
}

export interface PhotoData {
  id: string;
  url: string;
}
