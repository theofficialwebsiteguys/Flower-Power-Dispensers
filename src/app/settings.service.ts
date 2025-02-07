import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { CapacitorHttp } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  DARK_MODE_ENABLED = 'darkModeEnabled';

  isLoggedIn: boolean = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.authService.isLoggedIn().subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
      this.isDarkModeEnabled.next(this.getDarkModeEnabled());
      this.updateTheme();
    });
  }

  getDarkModeEnabled = (): boolean =>
    localStorage.getItem(this.DARK_MODE_ENABLED) === 'true' && this.isLoggedIn;

  setDarkModeEnabled = (value: boolean): void => {
    localStorage.setItem(this.DARK_MODE_ENABLED, JSON.stringify(value));
    this.isDarkModeEnabled.next(value);
    this.updateTheme();
  };

  updateTheme(): void {
    this.getDarkModeEnabled()
      ? this.document.body.classList.add('dark-mode')
      : this.document.body.classList.remove('dark-mode');
  }

  async getUserNotifications(): Promise<any> {
    try {
      const userId = this.authService.getCurrentUser().id;
      const url = `${environment.apiUrl}/notifications/all?userId=${userId}`;
  
      const response = await CapacitorHttp.get({ url });
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', JSON.stringify(error));
      return null;
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/mark-read/${notificationId}`;
  
      const response = await CapacitorHttp.put({
        url,
        headers: { 'Content-Type': 'application/json' },
        data: {},
      });
  
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', JSON.stringify(error));
      return null;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/mark-all-read`;
  
      const response = await CapacitorHttp.put({
        url,
        headers: { 'Content-Type': 'application/json' },
        data: { userId },
      });
  
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', JSON.stringify(error));
      return null;
    }
  }
  
  async deleteNotification(notificationId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/delete/${notificationId}`;
  
      const response = await CapacitorHttp.delete({ url });
  
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', JSON.stringify(error));
      return null;
    }
  }
  
  async deleteAllNotifications(userId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/delete-all`;
  
      const response = await CapacitorHttp.delete({
        url,
        headers: { 'Content-Type': 'application/json' },
        data: { userId },
      });
  
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', JSON.stringify(error));
      return null;
    }
  }

  private isDarkModeEnabled = new BehaviorSubject<boolean>(
    this.getDarkModeEnabled()
  );
  isDarkModeEnabled$ = this.isDarkModeEnabled.asObservable();
}
