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
        // Solo inicializar en navegador web (no en Electron)
        if (typeof window !== 'undefined' && !this.isElectron()) {
            try {
                // Importación dinámica de Firebase Messaging
                const { initializeApp } = await import('firebase/app');
                const { getMessaging, isSupported } = await import('firebase/messaging');

                this.isSupported = await isSupported();

                if (this.isSupported && environment.firebaseConfig) {
                    const app = initializeApp(environment.firebaseConfig);
                    this.messaging = getMessaging(app);
                    console.log('[Firebase] ✅ Firebase Messaging inicializado correctamente');
                } else {
                    console.warn('[Firebase] ⚠️ Firebase Messaging no soportado en este navegador');
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
            console.warn('[Firebase] No se puede solicitar permiso: servicio no disponible');
            return null;
        }

        try {
            const { getToken } = await import('firebase/messaging');

            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('[Firebase] ✅ Permiso de notificaciones concedido');

                const token = await getToken(this.messaging, {
                    vapidKey: environment.firebaseConfig?.vapidKey
                });

                if (token) {
                    console.log('[Firebase] 📱 Token FCM obtenido:', token);
                    return token;
                } else {
                    console.warn('[Firebase] ⚠️ No se pudo obtener el token FCM');
                    return null;
                }
            } else {
                console.warn('[Firebase] ⚠️ Permiso de notificaciones denegado');
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
                console.log('[Firebase] 📬 Mensaje recibido en foreground:', payload);

                this.notificationReceived.next(payload);

                // Mostrar notificación nativa
                const title = payload.notification?.title || payload.data?.title || 'FRC Sistemas Integrados';
                const body = payload.notification?.body || payload.data?.message || payload.data?.body || '';
                const data = payload.data;

                console.log('[Firebase] 📝 Mostrando notificación:', { title, body, data });

                if (Notification.permission === 'granted') {
                    const notification = new Notification(title, {
                        body,
                        icon: '/assets/logo.png',
                        badge: '/assets/logo.png',
                        data
                    });

                    notification.onclick = () => {
                        console.log('[Firebase] 🖱️ Click en notificación');
                        if (data?.path) {
                            window.focus();
                            // Aquí puedes agregar navegación si es necesario
                            window.dispatchEvent(new CustomEvent('push-path', { detail: data.path }));
                        }
                        notification.close();
                    };
                }
            });

            console.log('[Firebase] 👂 Escuchando mensajes en foreground');
        } catch (error) {
            console.error('[Firebase] ❌ Error al configurar listener de mensajes:', error);
        }
    }
}
