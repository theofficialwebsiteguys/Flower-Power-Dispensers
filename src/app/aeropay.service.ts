import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { from, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AeropayService {
  private merchantToken: string | null = null;
  private usedForMerchantToken: string | null = null;

  constructor() {}

  private async httpPost(url: string, data: any, token?: string): Promise<any> {
    const headers: any = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      ...(token ? { 'authorizationToken': `Bearer ${token}` } : {})
    };
  
    // Add 'X-API-Version': '1.1' if the request is for creating a user
    if (url.includes('/user')) {
      headers['X-API-Version'] = '1.1';
    }
    console.log(headers)
  
    const options: any = {
      url: url,
      headers: headers,
      data: data,
    };
  
    return CapacitorHttp.post(options);
  }

  private async httpGet(url: string, token?: string): Promise<any> {
    const options: any = {
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...(token ? { 'authorizationToken': `Bearer ${token}` } : {})
      }
    };
    return CapacitorHttp.get(options);
  }

  fetchMerchantToken(): Observable<any> {
    const payload = {
      scope: 'merchant',
      api_key: environment.aeropay_api_key,
      api_secret: environment.aeropay_api_secret,
      id: '1689',
    };
    return from(this.httpPost(`https://api.aeropay.com/token`, payload)).pipe(
      tap(response => {
        if (response.data?.token) {
          this.setMerchantToken(response.data.token, response.data.TTL);
        }
      })
    );
  }

  fetchUsedForMerchantToken(userId: any): Observable<any> {
    const payload = {
      scope: 'userForMerchant',
      api_key: environment.aeropay_api_key,
      api_secret: environment.aeropay_api_secret,
      id: '1689',
      userId: userId
    };
    return from(this.httpPost(`https://api.aeropay.com/token`, payload)).pipe(
      tap(response => {
        if (response.data?.token) {
          this.setUsedForMerchantToken(response.data.token, response.data.TTL);
        }
      })
    );
  }

  createUser(userData: any): Observable<any> {
    return from(this.httpPost('https://api.aeropay.com/user', userData, this.getMerchantToken() || '')).pipe(
      tap(response => console.log(response))
    );
  }

  verifyUser(userId: string, code: string): Observable<any> {
    return from(this.httpPost('https://api.aeropay.com/confirmUser', { userId, code }, this.getMerchantToken() || '')).pipe(
      tap(response => console.log(response))
    );
  }

  getAerosyncCredentials(): Observable<any> {
    return from(this.httpGet('https://api.aeropay.com/aggregatorCredentials?aggregator=aerosync', this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log(response))
    );
  }

  linkBankAccount(userId: string, userPassword: string): Observable<any> {
    const payload = {
      user_id: userId,
      user_password: userPassword,
      aggregator: 'aerosync'
    };
    return from(this.httpPost('https://api.aeropay.com/linkAccountFromAggregator', payload, this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log(response))
    );
  }

  createTransaction(amount: string, bankAccountId: string | null): Observable<any> {
    const transactionUUID = uuidv4();
    const payload = {
      amount: amount,
      merchantId: '1689',
      uuid: transactionUUID,
      bankAccountId: bankAccountId
    };
    return from(this.httpPost('https://api.aeropay.com/transaction', payload, this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log(response))
    );
  }

  setMerchantToken(token: string, ttl: number): void {
    this.merchantToken = token;
  }

  getMerchantToken(): string | null {
    return this.merchantToken;
  }

  isMerchantTokenValid(): boolean {
    return this.getMerchantToken() !== null;
  }

  setUsedForMerchantToken(token: string, ttl: number): void {
    this.usedForMerchantToken = token;
  }

  getUsedForMerchantToken(): string | null {
    return this.usedForMerchantToken;
  }

  isUsedForMerchantTokenValid(): boolean {
    return this.getUsedForMerchantToken() !== null;
  }
  
}
