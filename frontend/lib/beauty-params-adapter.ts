export interface BeautyParams {
  smoothing: number;
  brightening: number;
  sharpening: number;
  blemish_removal: number;
  detail_enhance: number;
  unsharp_mask: number;
  inpaint_spot: number;
}

export interface FrontendBeautyParams {
  smoothing: number;
  brightening: number;
  sharpening: number;
  blemishRemoval: number;
  detailEnhance: number;
  unsharpMask: number;
  inpaintSpot: number;
}

export function toBackendParams(params: FrontendBeautyParams): BeautyParams {
  return {
    smoothing: params.smoothing,
    brightening: params.brightening,
    sharpening: params.sharpening,
    blemish_removal: params.blemishRemoval,
    detail_enhance: params.detailEnhance,
    unsharp_mask: params.unsharpMask,
    inpaint_spot: params.inpaintSpot,
  };
}

export function fromBackendParams(params: BeautyParams): FrontendBeautyParams {
  return {
    smoothing: params.smoothing,
    brightening: params.brightening,
    sharpening: params.sharpening,
    blemishRemoval: params.blemish_removal,
    detailEnhance: params.detail_enhance,
    unsharpMask: params.unsharp_mask,
    inpaintSpot: params.inpaint_spot,
  };
}

export function defaultParams(): BeautyParams {
  return {
    smoothing: 50,
    brightening: 30,
    sharpening: 20,
    blemish_removal: 0,
    detail_enhance: 0,
    unsharp_mask: 0,
    inpaint_spot: 0,
  };
}

export function defaultFrontendParams(): FrontendBeautyParams {
  return fromBackendParams(defaultParams());
}
