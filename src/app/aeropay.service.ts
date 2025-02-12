import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { from, Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AeropayService {
  private merchantToken: string | null = null;
  private usedForMerchantToken: string | null = null;

  constructor() {}

  private async httpPost(url: string, data: any, token?: string): Promise<any> {
    const options: any = {
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...(token ? { 'authorizationToken': `Bearer ${token}` } : {})
      },
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
      api_key: '016c0534-ff89-4626-b8a4-fdbe7fbe1f08',
      api_secret: '13322af3-39fb-462d-865c-9f238b248abd',
      id: '1760',
    };
    return from(this.httpPost(`https://staging-api.aeropay.com/token`, payload)).pipe(
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
      api_key: '016c0534-ff89-4626-b8a4-fdbe7fbe1f08',
      api_secret: '13322af3-39fb-462d-865c-9f238b248abd',
      id: '1760',
      userId: userId
    };
    return from(this.httpPost(`https://staging-api.aeropay.com/token`, payload)).pipe(
      tap(response => {
        if (response.data?.token) {
          this.setUsedForMerchantToken(response.data.token, response.data.TTL);
        }
      })
    );
  }

  createUser(userData: any): Observable<any> {
    return from(this.httpPost('https://staging-api.aeropay.com/user', userData, this.getMerchantToken() || '')).pipe(
      tap(response => console.log('✅ User Created:', response))
    );
  }

  verifyUser(userId: string, code: string): Observable<any> {
    return from(this.httpPost('https://staging-api.aeropay.com/confirmUser', { userId, code }, this.getMerchantToken() || '')).pipe(
      tap(response => console.log('✅ AeroPay User Verified:', response))
    );
  }

  getAerosyncCredentials(): Observable<any> {
    return from(this.httpGet('https://staging-api.aeropay.com/aggregatorCredentials?aggregator=aerosync', this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log('✅ Aerosync Credentials Retrieved:', response))
    );
  }

  linkBankAccount(userId: string, userPassword: string): Observable<any> {
    const payload = {
      user_id: userId,
      user_password: userPassword,
      aggregator: 'aerosync'
    };
    return from(this.httpPost('https://staging-api.aeropay.com/linkAccountFromAggregator', payload, this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log('✅ Bank Account Linked:', response))
    );
  }

  createTransaction(amount: string, bankAccountId: string | null): Observable<any> {
    const transactionUUID = uuidv4();
    const payload = {
      amount: amount,
      merchantId: '1760',
      uuid: transactionUUID,
      bankAccountId: bankAccountId
    };
    return from(this.httpPost('https://staging-api.aeropay.com/transaction', payload, this.getUsedForMerchantToken() || '')).pipe(
      tap(response => console.log('✅ AeroPay Transaction Created:', response))
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
