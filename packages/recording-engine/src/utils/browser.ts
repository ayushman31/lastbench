export type BrowserEngine = 'blink' | 'webkit' | 'gecko' | 'unknown';

export type BrowserName =
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'brave'
  | 'unknown';

export interface BrowserInfo {
  name: BrowserName;
  engine: BrowserEngine;
  majorVersion: number;
  isMobile: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

interface NavigatorUAData {
    brands: { brand: string; version: string }[];
    mobile: boolean;
    platform: string;
    getHighEntropyValues(hints: string[]): Promise<Record<string, string>>;
  }
  

export function detectBrowser(): BrowserInfo {
  const ua = (navigator as Navigator).userAgent;
  
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;

  let name: BrowserName = 'unknown';
  let engine: BrowserEngine = 'unknown';
  let majorVersion = 0;
  let isMobile = false;
  let platform: BrowserInfo['platform'] = 'unknown';

  if (uaData) {
    isMobile = uaData.mobile;

    const brands = uaData.brands.map((b: NavigatorUAData['brands'][number]) => b.brand);

    if (brands.includes('Chromium')) {
      engine = 'blink';
    }

    if (brands.includes('Google Chrome')) {
      name = 'chrome';
    } else if (brands.includes('Microsoft Edge')) {
      name = 'edge';
    } else if (brands.includes('Opera')) {
      name = 'opera';
    }

    const versionEntry = uaData.brands.find((b: NavigatorUAData['brands'][number]) =>
      ['Google Chrome', 'Microsoft Edge', 'Opera'].includes(b.brand)
    );

    if (versionEntry) {
      majorVersion = parseInt(versionEntry.version, 10);
    }
  }

  //  engine and platform inference
  if (/iPhone|iPad|iPod/.test(ua)) {
    platform = 'ios';
    engine = 'webkit';
    isMobile = true;
  } else if (/Android/.test(ua)) {
    platform = 'android';
    isMobile = true;
  } else if (/Mac|Windows|Linux/.test(ua)) {
    platform = 'desktop';
  }

  //  ua fallback
  if (name === 'unknown') {
    if (/Edg\//.test(ua)) {
      name = 'edge';
      engine = 'blink';
      majorVersion = extractMajorVersion(ua, 'Edg/');
    } else if (/Firefox\//.test(ua)) {
      name = 'firefox';
      engine = 'gecko';
      majorVersion = extractMajorVersion(ua, 'Firefox/');
    } else if (/Chrome\//.test(ua)) {
      name = 'chrome';
      engine = 'blink';
      majorVersion = extractMajorVersion(ua, 'Chrome/');
    } else if (/Safari\//.test(ua)) {
      name = 'safari';
      engine = 'webkit';
      majorVersion = extractMajorVersion(ua, 'Version/');
    }
  }

  // 4. iOS browser correction
  if (platform === 'ios') {
    engine = 'webkit';
    name = 'safari'; // brand is irrelevant on iOS
  }

  return {
    name,
    engine,
    majorVersion,
    isMobile,
    platform,
  };
}

function extractMajorVersion(ua: string, token: string): number {
  const match = ua.match(new RegExp(`${token}(\\d+)`));
  return match ? parseInt(match[1], 10) : 0;
}

type MediaRecorderSupportResult =
  | {
      supported: true;
      mimeType: string;
    }
  | {
      supported: false;
      reason: string;
    };

const AUDIO_MIME_CANDIDATES: readonly string[] = [
  // Most reliable first
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus', // firefox-preferred
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2', // safari
  'audio/mp4',
  'audio/aac',
];

const VIDEO_MIME_CANDIDATES: readonly string[] = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4;codecs=h264,aac',
  'video/mp4',
];


function findWorkingMimeType(
  stream: MediaStream,
  hasVideo: boolean
): string | null {
  const candidates = hasVideo ? VIDEO_MIME_CANDIDATES : AUDIO_MIME_CANDIDATES;

  for (const mimeType of candidates) {
    if (!MediaRecorder.isTypeSupported(mimeType)) continue;

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.stop(); // do not start recording
      return mimeType;
    } catch {
      console.error('mediarecorder isTypeSupported lied or implementation is broken');
      continue;
    }
  }
  return null;
}


// guarantees that "supported: true" means recording will actually work
export async function checkMediaRecorderSupport(
  includeVideo: boolean = false
): Promise<MediaRecorderSupportResult> {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'No browser environment' };
  }

  if (!window.isSecureContext) {
    return { supported: false, reason: 'Insecure context (HTTPS required)' };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { supported: false, reason: 'getUserMedia not supported' };
  }

  if (!window.MediaRecorder) {
    return { supported: false, reason: 'MediaRecorder not supported' };
  }

  // check permission state first (avoids unnecessary prompts)
  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });

    if (permissionStatus.state === 'denied') {
      return {
        supported: false,
        reason: 'Microphone permission previously denied',
      };
    }
  } catch {
    // permissions API not supported, continue with getUserMedia
    return {
      supported: false,
      reason: 'Permissions API not supported',
    };
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: includeVideo,
    });
  } catch (err) {
    return {
      supported: false,
      reason: 'Microphone access denied or unavailable',
    };
  }

  try {
    const mimeType = findWorkingMimeType(stream, includeVideo);
    if (!mimeType) {
      return {
        supported: false,
        reason: 'No functional MIME type available',
      };
    }

    return { supported: true, mimeType };
  } finally {
    // clean up hardware access
    stream.getTracks().forEach((t) => t.stop());
  }
}

// get supported mime type without requesting permissions
export function getSupportedMimeType(includeVideo: boolean = false): string {
  const candidates = includeVideo ? VIDEO_MIME_CANDIDATES : AUDIO_MIME_CANDIDATES;

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return '';
}
