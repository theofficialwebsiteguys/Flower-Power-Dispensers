import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject = new BehaviorSubject<any>(null); // Store user info

  private authStatus = new BehaviorSubject<boolean>(this.hasToken()); // Observable for auth status

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('user_info');
    if (user) {
      this.userSubject.next(JSON.parse(user));
    }
  }

  // API URLs (replace with your API endpoints)
  //private apiUrl = 'http://localhost:3333/api/users'; 
  private apiUrl = 'https://dispensary-api-ac9613fa4c11.herokuapp.com/api/users'; 


   // Observable for user info
  getUserInfo(): any {
    return this.userSubject.asObservable();
  }

  // Get the currently stored user info
  getCurrentUser() {
    return this.userSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  register(userData: any): Observable<any> {
    const defaultValues = { points: 0, business_id: 1 }; // Add default values if needed
    const payload = { ...userData, ...defaultValues };
    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      tap(() => {
        // Automatically login the user after registration
        this.login({ email: userData.email, password: userData.password }).subscribe();
      })
    );
  }
  
  // Log in a user
  login(credentials: { email: string; password: string }): Observable<any> {
    // Add business info to the payload
    const payload = {
      ...credentials,
      businessId: '1', // Replace with your business ID logic
      businessName: 'Flower Power Dispensers', // Replace with your business name logic
    };
  
    return this.http.post<{sessionId: string, user: any, expiresAt: Date}>(`${this.apiUrl}/login`, payload).pipe(
      tap((response: {sessionId: string, user: any, expiresAt: Date}) => {
        if (response) {
          // Save the session details or token
          this.router.navigateByUrl('/rewards');
          this.storeSessionData(response.sessionId, response.expiresAt);
          this.authStatus.next(true); // Notify subscribers of auth status
        }
        if (response.user) {
          this.storeUserInfo(response.user); // Save user information locally
        }
      })
    );
  }
  
  logout(): void {
    const sessionData = localStorage.getItem('sessionData');
    const headers = new HttpHeaders({
      Authorization: sessionData ? JSON.parse(sessionData).token : null, // Set Authorization header
    });

  
    this.http
      .post<{ sessionId: string; user: any; expiresAt: Date }>(
        `${this.apiUrl}/logout`,
        {}, // No body required
        { headers } // Pass headers in options
      )
      .pipe(
        tap((response: { sessionId: string; user: any; expiresAt: Date }) => {
          if (response) {
            // Handle logout logic
            this.removeToken();
            this.authStatus.next(false);
            this.router.navigateByUrl('/rewards'); // Redirect to rewards page
            this.userSubject.next(null);
            this.removeUser();
          }
        })
      )
      .subscribe(); // Ensure the request is sent
  }

  private storeSessionData(sessionId: string, expiresAt: Date): void {
    const sessionData = {
      token: sessionId,
      expiry: expiresAt,
    };
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
  }

  private storeUserInfo(user: any) {
    localStorage.setItem('user_info', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getSessionData(): { token: string; expiry: Date } | null {
    const sessionData = localStorage.getItem('sessionData');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  // Remove the token
  private removeToken(): void {
    localStorage.removeItem('sessionData');
  }

  
  // Remove the token
  private removeUser(): void {
    localStorage.removeItem('user_info');
  }


  // Check if token exists
  private hasToken(): boolean {
    return !!this.getSessionData();
  }


  isTokenExpired(expiry: Date): boolean {
    const currentTime = new Date().getTime(); // Get the current time in milliseconds
    const expiryTime = new Date(expiry).getTime(); // Convert the expiry date to milliseconds
  
    // Return true if the current time is greater than or equal to the expiry time
    return currentTime >= expiryTime;
  }
  
  sendPasswordReset(email: string): Observable<void> {
    const business_id = 1;
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email, business_id });
  }

  resetPassword(password: string, token: string | null): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { password, token });
  }


  validateSession(): void {
    const sessionData = this.getSessionData();
  
    if (!sessionData || this.isTokenExpired(sessionData.expiry)) {
      // No session or expired session
      this.authStatus.next(false); // Notify subscribers that the user is logged out
      this.removeToken();
      this.removeUser();
      return;
    }
  

    // If token exists, validate it against the backend
    const headers = new HttpHeaders({
      Authorization: sessionData?.token, // Use the stored token
    });
  
    console.log(sessionData)
    this.http
    .get<{ valid: boolean }>(`${this.apiUrl}/validate-session`, { headers })
    .pipe(
      map((response) => response.valid), // Transform the response to just the boolean
      tap((isValid) => {
        if (isValid) {
          this.authStatus.next(true); // Session is valid
        } else {
          this.authStatus.next(false); // Session is invalid
          this.removeToken(); // Clear invalid session data
          this.removeUser();
        }
      })
    ).subscribe();
  }

  toggleUserNotifications(userId: string): Observable<any> {
    const sessionData = localStorage.getItem('sessionData'); // Retrieve the session data
    const token = sessionData ? JSON.parse(sessionData).token : null; // Extract the token

    if (!token) {
      this.logout();
      return of();
    }

    const headers = new HttpHeaders({
      Authorization: token, // Add Authorization header
    });

    const payload = { userId }; // Pass the userId in the request body

    return this.http
    .put(`${this.apiUrl}/toggle-notifications`, payload, { headers })
    .pipe(
      tap((response: any) => {
        // Call another function here
        this.storeUserInfo(response.user);
      }),
      catchError((error) => {
        console.error('Error toggling notifications:', error);
        return throwError(() => error);
      })
    );
  }
  
  validateResetToken(token: string) {
    return this.http
      .get<{ valid: boolean; user?: any }>(`${this.apiUrl}/validate-reset-token`, {
        params: { token }, // Pass token as a query parameter
      })
      .pipe(
        tap((response) => {
          if (response.valid && response.user) {
            this.storeUserInfo(response.user); // Optional: Save user info if needed
          }
        }),
        catchError((error) => {
          console.error('Error validating reset token:', error);
          return throwError(() => error);
        })
      );
  }
  
}
