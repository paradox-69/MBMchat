// lib/services/permissions.ts
export type PermissionStateStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

export const permissionsGateway = {
  async requestCamera(): Promise<{ stream: MediaStream | null; error?: string }> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return { stream: null, error: "Your browser doesn't support camera hardware." };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      });
      return { stream };
    } catch (err: any) {
      return { 
        stream: null, 
        error: "Camera access is off. No camera, no dramatic snap. You can enable it from browser settings." 
      };
    }
  },

  async requestMicrophone(): Promise<{ stream: MediaStream | null; error?: string }> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return { stream: null, error: "Audio hardware unsupported on this client." };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return { stream };
    } catch (err: any) {
      return { 
        stream: null, 
        error: "Microphone blocked. Because telepathy is still in beta, you need to unblock it in settings." 
      };
    }
  },

  async requestLocation(durationMinutes: number): Promise<{ coords: GeolocationCoordinates | null; error?: string }> {
    if (!navigator.geolocation) {
      return { coords: null, error: "Geolocation is not supported by your client browser." };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ coords: pos.coords }),
        () => resolve({ coords: null, error: "Looks like your browser said no to location." }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
};