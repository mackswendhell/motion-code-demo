import React from 'react';
import {interpolate} from 'remotion';

const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export {FORMATOS_CARD, enquadrarRosto, type ZonaRosto} from './enquadramento';

export type SynchronizedSplitConfig = {
  canvasWidth?: number;
  canvasHeight?: number;
  splitCameraLeft?: number;
  splitCameraTop?: number;
  splitCameraWidth?: number;
  splitCameraHeight?: number;
  splitCameraRadius?: number;
  splitVideoX?: number;
  splitVideoY?: number;
  splitVideoScale?: number;
  panelGap?: number;
  panelTravel?: number;
};

export type SynchronizedSplitState = {
  progress: number;
  canvasWidth: number;
  canvasHeight: number;
  camera: {
    left: number;
    top: number;
    width: number;
    height: number;
    radius: number;
  };
  video: {
    x: number;
    y: number;
    scale: number;
  };
  panel: {
    visibleWidth: number;
    translateX: number;
    gap: number;
  };
};

export const getSynchronizedSplitState = (
  rawProgress: number,
  config: SynchronizedSplitConfig = {},
): SynchronizedSplitState => {
  const progress = Math.max(0, Math.min(1, rawProgress));
  const canvasWidth = config.canvasWidth ?? 1920;
  const canvasHeight = config.canvasHeight ?? 1080;
  const splitCameraLeft = config.splitCameraLeft ?? 1210;
  const panelGap = config.panelGap ?? 32;
  const cameraLeft = interpolate(progress, [0, 1], [0, splitCameraLeft], clamp);

  return {
    progress,
    canvasWidth,
    canvasHeight,
    camera: {
      left: cameraLeft,
      top: interpolate(progress, [0, 1], [0, config.splitCameraTop ?? 70], clamp),
      width: interpolate(progress, [0, 1], [canvasWidth, config.splitCameraWidth ?? 650], clamp),
      height: interpolate(progress, [0, 1], [canvasHeight, config.splitCameraHeight ?? 940], clamp),
      radius: interpolate(progress, [0, 1], [0, config.splitCameraRadius ?? 30], clamp),
    },
    video: {
      x: interpolate(progress, [0, 1], [0, config.splitVideoX ?? -635], clamp),
      y: interpolate(progress, [0, 1], [0, config.splitVideoY ?? -70], clamp),
      scale: interpolate(progress, [0, 1], [1, config.splitVideoScale ?? 1], clamp),
    },
    panel: {
      visibleWidth: Math.max(0, cameraLeft - panelGap),
      translateX: (1 - progress) * -(config.panelTravel ?? 90),
      gap: panelGap,
    },
  };
};

export const SynchronizedCameraFrame: React.FC<{
  state: SynchronizedSplitState;
  children: React.ReactNode;
  boxShadow?: string;
}> = ({state, children, boxShadow = '0 30px 90px rgba(0,0,0,.5)'}) => (
  <div
    style={{
      position: 'absolute',
      left: state.camera.left,
      top: state.camera.top,
      width: state.camera.width,
      height: state.camera.height,
      overflow: 'hidden',
      borderRadius: state.camera.radius,
      boxShadow: state.progress > 0.01 ? boxShadow : 'none',
    }}
  >
    {children}
  </div>
);

export const SynchronizedSplitPanel: React.FC<{
  state: SynchronizedSplitState;
  children: React.ReactNode;
}> = ({state, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: state.panel.visibleWidth,
      height: state.canvasHeight,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: state.canvasWidth,
        height: state.canvasHeight,
        transform: `translateX(${state.panel.translateX}px)`,
      }}
    >
      {children}
    </div>
  </div>
);

