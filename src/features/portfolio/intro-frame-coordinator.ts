export interface IntroFrameRequest {
  frameIndex: number;
  generation: number;
}

/**
 * Owns the desired-frame generation only. Cache population deliberately lives
 * outside this coordinator so preloads can never change what the user sees.
 */
export function createIntroFrameCoordinator() {
  let desiredFrameIndex = -1;
  let generation = 0;
  let renderedFrameIndex = -1;

  return {
    requestDesiredFrame(frameIndex: number): IntroFrameRequest {
      desiredFrameIndex = frameIndex;
      generation += 1;

      return { frameIndex, generation };
    },
    isCurrent(request: IntroFrameRequest) {
      return request.frameIndex === desiredFrameIndex && request.generation === generation;
    },
    getCurrentRequest(): IntroFrameRequest | null {
      if (desiredFrameIndex < 0) {
        return null;
      }

      return { frameIndex: desiredFrameIndex, generation };
    },
    markRendered(request: IntroFrameRequest, frameIndex = request.frameIndex) {
      if (request.frameIndex !== desiredFrameIndex || request.generation !== generation) {
        return false;
      }

      // A nearby decoded frame may cover a pending exact frame, but only for the
      // latest intentional request.
      renderedFrameIndex = frameIndex;
      return true;
    },
    getRenderedFrame() {
      return renderedFrameIndex;
    },
  };
}
