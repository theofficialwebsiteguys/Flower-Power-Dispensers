import { Component, Input, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  @Input() user: any;

  allowNotifications: boolean = false; // Tracks the current notification setting
  darkModeEnabled: boolean = false;
  userId: string = ''; // Store the current user's ID

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    // Retrieve the user and their notification settings on component load
    const user = this.authService.getCurrentUser();

    if (user) {
      this.userId = user.id;
      this.allowNotifications = user.allow_notifications; // Set toggle state based on user data
    } else {
      // Handle cases where the user is not logged in
      this.authService.validateSession();
      this.authService.getUserInfo().subscribe((userInfo: any) => {
        if (userInfo) {
          this.userId = userInfo.id;
          this.allowNotifications = userInfo.allow_notifications;
        }
      });
    }

    this.darkModeEnabled = this.settingsService.getDarkModeEnabled();
  }

  onToggleNotifications(event: any): void {
    this.authService.toggleUserNotifications(this.userId).subscribe({
      next: () => {
        console.log('Notification setting updated successfully');
        this.allowNotifications = event.detail.checked;
      },
      error: (err) => {
        console.error('Failed to update notification setting:', err);
      },
    });
  }

  onToggleDarkMode(event: any) {
    this.darkModeEnabled = event.detail.checked;
    this.settingsService.setDarkModeEnabled(this.darkModeEnabled);
  }
}
