import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = ''; // Error message to display
  darkModeEnabled: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.settingsService.isDarkModeEnabled$.subscribe((isDarkModeEnabled) => {
      this.darkModeEnabled = isDarkModeEnabled;
    });
  }

  onSubmit() {
    this.submitted = true;

    // Exit early if the form is invalid
    if (this.loginForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = ''; // Clear any existing errors

    // Build the login payload
    const loginPayload = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
    };

    // Call the AuthService's login method
    this.authService.login(loginPayload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/rewards']); // Redirect after successful login
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err); // Set user-friendly error message
      },
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 401) {
      return 'Invalid email or password. Please try again.';
    } else if (err.status === 500) {
      return 'Server error. Please try again later.';
    } else if (err.status === 0) {
      return 'Network error. Please check your internet connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
