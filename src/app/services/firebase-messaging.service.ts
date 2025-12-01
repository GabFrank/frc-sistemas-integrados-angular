import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FirebaseMessagingService {
    public notificationReceived = new Subject<any>();
    private messaging: any = null;
    private isSupported = false;

    constructor() {
        this.checkSupport();
    }

    private async checkSupport() {
        if (typeof window !== 'undefined' && !this.isElectron()) {
            try {
                const { initializeApp } = await import('firebase/app');
                const { getMessaging, isSupported } = await import('firebase/messaging');

                this.isSupported = await isSupported();

                if (this.isSupported && environment.firebaseConfig) {
                    const app = initializeApp(environment.firebaseConfig);
                    this.messaging = getMessaging(app);
                }
            } catch (error) {
                console.error('[Firebase] ❌ Error al inicializar Firebase Messaging:', error);
            }
        }
    }

    private isElectron(): boolean {
        return !!(window && (window as any).process && (window as any).process.type);
    }

    async requestPermission(): Promise<string | null> {
        if (!this.isSupported || !this.messaging) {
            return null;
        }

        try {
            const { getToken } = await import('firebase/messaging');

            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const token = await getToken(this.messaging, {
                    vapidKey: environment.firebaseConfig?.vapidKey
                });

                if (token) {
                    return token;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } catch (error) {
            console.error('[Firebase] ❌ Error al solicitar permiso:', error);
            return null;
        }
    }

    async listenForMessages(): Promise<void> {
        if (!this.isSupported || !this.messaging) {
            return;
        }

        try {
            const { onMessage } = await import('firebase/messaging');

            onMessage(this.messaging, (payload) => {
                this.notificationReceived.next(payload);

                const title = payload.notification?.title || payload.data?.title || 'FRC Sistemas Integrados';
                const body = payload.notification?.body || payload.data?.message || payload.data?.body || '';
                const data = payload.data;

                if (Notification.permission === 'granted') {
                    const notification = new Notification(title, {
                        body,
                        icon: '/assets/logo.png',
                        badge: '/assets/logo.png',
                        data
                    });

                    notification.onclick = () => {
                        if (data?.path) {
                            window.focus();
                            window.dispatchEvent(new CustomEvent('push-path', { detail: data.path }));
                        }
                        notification.close();
                    };
                }
            });
        } catch (error) {
            console.error('[Firebase] ❌ Error al configurar listener de mensajes:', error);
        }
    }
}
