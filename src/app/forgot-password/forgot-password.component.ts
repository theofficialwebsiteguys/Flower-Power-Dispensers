import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  emailSent = false; // Flag to toggle between form and success message
  errorMessage = ''; // Store error message to display
  darkModeEnabled: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.settingsService.isDarkModeEnabled$.subscribe((isDarkModeEnabled) => {
      this.darkModeEnabled = isDarkModeEnabled;
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    const email = this.forgotPasswordForm.value.email;
    this.errorMessage = ''; // Clear previous errors

    // Call the AuthService to reset the password
    this.authService.sendPasswordReset(email).subscribe({
      next: () => {
        this.emailSent = true; // Show confirmation message
        this.errorMessage = ''; // Clear any previous error message
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err);
      },
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 404) {
      return 'The email is not associated with a registered account.';
    } else if (err.status === 400) {
      return 'The email address provided is invalid.';
    } else if (err.status === 500) {
      return 'An error occurred on the server. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
