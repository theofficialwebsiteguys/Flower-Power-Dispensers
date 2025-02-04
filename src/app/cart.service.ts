import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  posProductId: string;
  image: string;
  brand: string;
  desc: string;
  price: string;
  quantity: number;
  title: string;
  strainType: string;
  thc: string;
  weight: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartKey = 'cart'; 
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getCart());
  cart$ = this.cartSubject.asObservable(); 
  private inactivityTime = 0;
  private inactivityLimit = 24 * 60 * 60; // 24 hours
  private userId: number | null = null; // Store user ID
  private lastNotificationKey = 'lastCartAbandonmentNotification';

  private inactivityTimer: any;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!sessionStorage.getItem(this.cartKey)) {
      sessionStorage.setItem(this.cartKey, JSON.stringify([]));
    }

    this.authService.isLoggedIn().subscribe((status) => {
      if (status) {
        this.authService.getUserInfo().subscribe((user: any) => {
          if (user) {
            this.userId = user.id;
            sessionStorage.removeItem(this.lastNotificationKey);
            this.setupTracking();
          }
        });
      }
    });
    
  }

  private setupTracking() {
    document.addEventListener('mousemove', () => this.resetInactivity());
    document.addEventListener('keypress', () => this.resetInactivity());
  
    const trackInactivity = () => {
      this.inactivityTime += 1; // Increase by half-second steps
  
      if (this.inactivityTime > this.inactivityLimit && this.getCart().length > 0) {
        this.handleAbandonedCart();
      }
  
      this.inactivityTimer = setTimeout(trackInactivity, 1000); // Schedule next check
    };
  
    trackInactivity();
  }
  
  ngOnDestroy() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
  

  private resetInactivity() {
    if (this.getCart().length === 0) {
      sessionStorage.removeItem(this.lastNotificationKey);
    }
    if (this.inactivityTime > 0) {
      this.inactivityTime = 0; // Reset inactivity timer
    }
  }

  private handleAbandonedCart() {
    const cartItems = this.getCart();
    const lastNotification = sessionStorage.getItem(this.lastNotificationKey);

    if (cartItems.length > 0 && this.userId && !lastNotification) {
      this.sendCartAbandonmentNotification(this.userId);
      sessionStorage.setItem(this.lastNotificationKey, 'sent'); // Mark as sent
    }
  }
  

  private sendCartAbandonmentNotification(userId: number) {
    const payload = { userId, title: 'Forget To Checkout?', body: 'Come back to checkout and feel the power of the flower!' };

    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;

    const headers = new HttpHeaders({
      Authorization: token,
    });

    
    this.http.post(`${environment.apiUrl}/notifications/send-push`, payload, { headers }).subscribe({
      next: response => console.log('Cart abandonment notification sent', response),
      error: error => console.error('Error sending notification', error),
    });
  }

  getCart(): CartItem[] {
    const cart = sessionStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }

  addToCart(item: CartItem) {
    const cart = this.getCart();
    const existingItemIndex = cart.findIndex(
      (cartItem: CartItem) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
  }

  updateQuantity(itemId: string, quantity: number) {
    const cart = this.getCart();
    const itemIndex = cart.findIndex((cartItem: CartItem) => cartItem.id === itemId);

    if (itemIndex !== -1) {
      cart[itemIndex].quantity = quantity;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      this.saveCart(cart);
    }
  }

  removeFromCart(itemId: string) {
    const cart = this.getCart();
    const updatedCart = cart.filter((cartItem: CartItem) => cartItem.id !== itemId);
    this.saveCart(updatedCart);
  }

  clearCart() {
    this.saveCart([]);
  }

  checkout(points_redeem: number, delivery_address: any): Observable<any> {
    const cartItems = this.getCart();
    const unmatchedItems = [...cartItems]; 
    const matchedCart: any[] = [];
    let skip = 0;
    const take = 100;
  
    let id_order = 0;
    let tax_amount = 0;
    let subtotal = 0;
    let user_info: any;
    let id_customer: any;
    let checkoutItems: any[] = [];
  
  const fetchAndMatch = (): Observable<any[]> => {
    return this.fetchInventory(skip, take).pipe(
      switchMap((inventoryResponse) => {
        // Match items
        inventoryResponse.forEach((inventoryItem: any) => {
          const matchIndex = unmatchedItems.findIndex(
            (cartItem) => +cartItem.posProductId === inventoryItem.id_item
          );

          if (matchIndex !== -1) {
            matchedCart.push({
              ...unmatchedItems[matchIndex],
              id_batch: inventoryItem.id_batch,
            });
            unmatchedItems.splice(matchIndex, 1);
          }
        });

        // If there are unmatched items, fetch the next batch
        if (unmatchedItems.length > 0 && inventoryResponse.length > 0) {
          skip += take;
          return fetchAndMatch();
        }

        // Return the matched cart when all batches are processed
        return of(matchedCart);
      }),
      catchError((error) => {
        console.error('Error during inventory matching:', error);
        return throwError(() => error);
      })
    );
  };


  const getUserInfo = (): Observable<any> => {
    return this.authService.getUserInfo().pipe(
      map((info) => {
        user_info = info;
      }),
      catchError((error) => {
        console.error('Error fetching user info or creating customer:', error);
        return throwError(() => error);
      })
    );
  };

  // Step 2: Create Order
  const createOrder = (): Observable<any> => {
    const orderDetails = {
      id_customer: user_info.alleaves_customer_id, // Replace with actual customer ID
      id_external: null,
      id_location: 1000,
      id_status: 1,
      type: delivery_address ? 'delivery' : 'pickup',
      use_type: 'adult',
      auto_apply_discount_exclusions: [],
      delivery_address: delivery_address,
      pickup_date: null,
      pickup_time: null,
      apply_delivery_fee: null,
      delivery_fee: 0,
      complete: false,
      void: false,
      void_reason: null,
      void_reason_other: null,
      verified: false,
      verified_by: null,
      packed: false,
      packed_by: null,
      scheduled: false,
      scheduled_by: null,
      id_user_working: null,
    };

    return this.createOrder(orderDetails).pipe(
      tap((response) => {
        id_order = response.id_order;
        // console.log('Order Created:', response);
      }),
      catchError((error) => {
        console.error('Error creating order:', error);
        return throwError(() => error);
      })
    );
  };

  // Step 3: Add Checkout Items to Order
  const addItemsToOrder = (orderId: number): Observable<any[]> => {
    return this.addCheckoutItemsToOrder(orderId, checkoutItems).pipe(
      tap((responses) => {
        // console.log("Add Items to order responses", responses)
        // Calculate the total subtotal
        const totalSubtotal = responses.reduce(
          (acc: number, item: any) => {
            if (item) {
              acc += item.price || 0;
            }
            return acc;
          },
          0 // Initial value for subtotal
        );

        // Set the external subtotal variable
        subtotal = totalSubtotal;
      }),
      catchError((error) => {
        console.error('Error adding items to order:', error);
        return throwError(() => error);
      })
    );
  };

  const updateOrderItemPrices = (orderId: number, items: any[]): Observable<any> => {
    let remainingDiscount = points_redeem / 20;
    const sortedItems = [...items].sort((a, b) => b.price - a.price);

    const updateRequests = sortedItems.map((item) => {
      if (remainingDiscount <= 0) {
        return of(null);
      }
      const discountAmount = Math.min(item.price, remainingDiscount);
      remainingDiscount -= discountAmount;
      const priceOverride = item.price - discountAmount;

      const body = {
        price_override: priceOverride,
        price_override_reason: 'Points redemption applied'
      };

      const url = `https://app.alleaves.com/api/order/${orderId}/item/${item.id_item}`;

      const headers = new HttpHeaders({
        Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
        'Content-Type': 'application/json; charset=utf-8',
        accept: 'application/json; charset=utf-8',
      });

      return this.http.put(url, body, { headers }).pipe(
        // tap(() => console.log(`Updated item ${item.id_item} price to ${priceOverride}`)),
        catchError((error) => {
          console.error(`Error updating item ${item.id_item} price:`, error);
          return throwError(() => error);
        })
      );
    });

    return forkJoin(updateRequests);
  };


  return getUserInfo().pipe(
    switchMap(() => fetchAndMatch()),
    switchMap((matched) => {
      checkoutItems = matched;
      return createOrder();
    }),
    switchMap((orderResponse) => 
      addItemsToOrder(orderResponse.id_order)
    ),
    switchMap((addedItemsWithIds) => {
      checkoutItems = addedItemsWithIds; // Store items with id_item
      return updateOrderItemPrices(id_order, checkoutItems);
    }),
    map(() => ({
      user_info,
      id_order,
      checkoutItems,
      subtotal,
    })),
    catchError((error) => {
      console.error('Checkout process failed:', error);
      return throwError(() => error);
    })
  );
  }
  

  // Save the cart back to sessionStorage and notify subscribers
  private saveCart(cart: CartItem[]) {
    sessionStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.cartSubject.next(cart); // Emit the updated cart
  }



    // Fetch Inventory in batches
    fetchInventory(skip: number, take: number) {
      
      const headers = new HttpHeaders({
        Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
        'Content-Type': 'application/json; charset=utf-8',
        accept: 'application/json; charset=utf-8',
      });
  
      const body = { skip, take };
  
      return this.http.post<any>('https://app.alleaves.com/api/inventory/search', body, { headers }).pipe(
        // tap((response) => console.log('Inventory Batch:', response)),
        catchError((error) => {
          console.error('Error fetching inventory:', error);
          return throwError(() => error);
        })
      );
    }

  createCustomer(userDetails: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
      'Content-Type': 'application/json; charset=utf-8',
      accept: 'application/json; charset=utf-8',
    });

    // API URL for creating an order
    const apiUrl = 'https://app.alleaves.com/api/customer';

    return this.http.post<any>(apiUrl, userDetails, { headers }).pipe(
      // tap((response) => console.log('User Created Successfully:', response)),
      catchError((error) => {
        console.error('Error creating User:', error);
        return throwError(() => error);
      })
    );
  }

    // Function to create an order
  createOrder(orderDetails: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
      'Content-Type': 'application/json; charset=utf-8',
      accept: 'application/json; charset=utf-8',
    });

    // API URL for creating an order
    const apiUrl = 'https://app.alleaves.com/api/order';

    return this.http.post<any>(apiUrl, orderDetails, { headers }).pipe(
      // tap((response) => console.log('Order Created Successfully:', response)),
      catchError((error) => {
        console.error('Error creating order:', error);
        return throwError(() => error);
      })
    );
  }

  addCheckoutItemsToOrder(idOrder: number, checkoutItems: any[]) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
      'Content-Type': 'application/json; charset=utf-8',
      accept: 'application/json; charset=utf-8',
    });
  
    const apiUrl = `https://app.alleaves.com/api/order/${idOrder}/item`;
  
    const addItemRequests = checkoutItems.map((item) => {
      const body = {
        id_batch: item.id_batch,
        id_area: 1000,
        qty: item.quantity,
      };
  
      return this.http.post<any>(apiUrl, body, { headers }).pipe(
        map((response) => {
          // Capture generated id_items for each quantity
          const generatedItems = response.items.map((resItem: any) => ({
            ...item,
            id_item: resItem.id_item,  // Captured id_item
          }));
  
          // console.log(`Captured id_items for item ${item.id_batch}:`, generatedItems);
          return generatedItems;
        }),
        catchError((error) => {
          console.error(`Error adding item (id_batch: ${item.id_batch}):`, error);
          return throwError(() => error);
        })
      );
    });
  
    return forkJoin(addItemRequests).pipe(
      map((responses) => {
        // Flatten the nested arrays into a single array of items with id_item
        const flattenedItems = responses.reduce((acc: any[], val: any[]) => acc.concat(val), []);
        // console.log('All items with id_items:', flattenedItems);
        return flattenedItems;
      }),
      catchError((error) => {
        console.error('Error processing items:', error);
        return throwError(() => error);
      })
    );
  }
  

  placeOrder(user_id: number, pos_order_id: number, points_add: number, points_redeem: number) {
    const payload = { user_id, pos_order_id, points_add, points_redeem };

    console.log(payload);

    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;

    if (!token) {
      return throwError(() => "No user logged in");
    }

    const headers = new HttpHeaders({
      Authorization: token,
    });

    return this.http.post(`${environment.apiUrl}/orders/create`, payload, { headers }).pipe(
      // tap((response) => {
      //   console.log('Order Response:', response);
      // }),
      catchError((error) => {
        console.error('Error in placeOrder:', error);
        return throwError(() => error);
      })
    );
  }


  updateOrder(id_order: number, pickup_date: any, pickup_time: any, subtotal: number, id_customer: number) {
    const payload = { id_order, pickup_date, pickup_time, id_customer, id_location: 1000 };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('authTokensAlleaves') || '{}')}`,
      'Content-Type': 'application/json; charset=utf-8',
      accept: 'application/json; charset=utf-8',
    });

    return this.http.put(`https://app.alleaves.com/api/order/${id_order}`, payload, { headers }).pipe(
      // tap((response) => { 
      //   console.log('Order Response:', response);
      // }),
      catchError((error) => {
        console.error('Error in placeOrder:', error);
        return throwError(() => error);
      })
    );
  }

}
