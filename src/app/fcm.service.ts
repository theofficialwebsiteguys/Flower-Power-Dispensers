import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

export const FCM_TOKEN = 'push_notification_token';

@Injectable({
  providedIn: 'root',
})
export class FcmService {
  constructor(private http: HttpClient) { }

  async initPushNotifications(email: any) {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('Push notifications are not supported on the web platform.');
      return;
    }

    try {
      // Register and get the FCM token
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }

      await PushNotifications.register();

      // Set up listeners for push notifications
      this.addNotificationListeners(email);

    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }

  addNotificationListeners(email: string) {
    // Listener for registration (token generation)
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Device registered successfully. Token:', token.value);
      const fcm_token = token?.value;

      if (fcm_token) {
        try {
          const saved_token = await this.getTokenFromBackend(email);

          if (!saved_token || saved_token !== fcm_token) {
            console.log(
              !saved_token
                ? 'No token found in backend. Saving new token.'
                : 'Token has changed. Updating backend token.'
            );
            await this.updateTokenInBackend(email, fcm_token);
          } else {
            console.log('Token is already up-to-date.');
          }
        } catch (error) {
          console.error('Error processing FCM token:', error);
        }
      }
    });

    // Listener for when a push notification is received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
    });

    // Listener for when a push notification action is performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
    });
  }

  private async getTokenFromBackend(email: string) {
    try {
      const sessionData = localStorage.getItem('sessionData');
      const headers = new HttpHeaders({
        Authorization: sessionData ? JSON.parse(sessionData).token : null, // Set Authorization header
      });
      const response = await lastValueFrom(
        this.http.post(`${environment.apiUrl}/users/push-token`, { email }, { headers })
      );
      console.log('Token from backend:', response);
      return response || null; // Assuming the response contains { pushToken }
    } catch (error) {
      console.error('Error retrieving token from backend:', error);
      return null;
    }
  }

  private async updateTokenInBackend(email: string, token: string) {
    try {
      const sessionData = localStorage.getItem('sessionData');
      const headers = new HttpHeaders({
        Authorization: sessionData ? JSON.parse(sessionData).token : null, // Set Authorization header
      });
      const response = await lastValueFrom(
        this.http.post(`${environment.apiUrl}/users/update-push-token`, { email, token }, { headers })
      );
      console.log('Token updated in backend:', response);
    } catch (error) {
      console.error('Error updating token in backend:', error);
    }
  }

  async disablePushNotifications(email: string) {
    try {
      // Remove the push token from the backend
      await this.removeNotificationsFromBackend(email);

      // Unregister push notifications on the device
      await PushNotifications.removeAllListeners();
      console.log('Push notifications disabled successfully.');
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    }
  }

  private async removeNotificationsFromBackend(email: string) {
    try {
      const sessionData = localStorage.getItem('sessionData');
      const headers = new HttpHeaders({
        Authorization: sessionData ? JSON.parse(sessionData).token : null, // Set Authorization header
      });
      const response = await lastValueFrom(
        this.http.post(`${environment.apiUrl}/users/toggle-notifications`, { email }, { headers })
      );
      console.log('Push token removed from backend:', response);
    } catch (error) {
      console.error('Error removing token from backend:', error);
    }
  }
}
