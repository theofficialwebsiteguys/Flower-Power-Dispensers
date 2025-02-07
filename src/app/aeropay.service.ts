import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AeropayService {
  private authToken: string | null = null;
  private ttl: number | null = null; // Time-to-live for token expiration

  constructor(private http: HttpClient) {}

  authenticate(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': 'application/json'
    });

    const payload = {
      scope: 'merchant',
      api_key: '016c0534-ff89-4626-b8a4-fdbe7fbe1f08', // Replace with actual API Key
      api_secret: '13322af3-39fb-462d-865c-9f238b248abd', // Replace with actual API Secret
      id: '1689'
    };

    return this.http.post<any>(`https://api.aeropay.com/token`, payload, { headers }).pipe(
      tap(response => {
        if (response.token) {
          this.setAuthToken(response.token, response.TTL);
        }
      })
    );
  }

  /**
   * Stores the authentication token and TTL (Time-to-Live).
   */
  setAuthToken(token: string, ttl: number): void {
    this.authToken = token;
    this.ttl = Date.now() + ttl * 1000; // Convert TTL (seconds) to expiration timestamp (milliseconds)
  }

  /**
   * Retrieves the stored authentication token if it’s still valid.
   */
  getAuthToken(): string | null {
    if (this.authToken && this.ttl && Date.now() < this.ttl) {
      return this.authToken;
    } else {
      this.authToken = null; // Token expired, clear it
      this.ttl = null;
      return null;
    }
  }

  /**
   * Checks if the token is still valid.
   */
  isTokenValid(): boolean {
    return this.getAuthToken() !== null;
  }

  createUser(userData: { first_name: string; last_name: string; phone: string; email: string; }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    });
  
    const payload = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      email: userData.email
    };
  
    return this.http.post<any>('https://api.aeropay.com/users', payload, { headers }).pipe(
      tap(response => console.log('✅ User Created:', response))
    );
  }
  
}
