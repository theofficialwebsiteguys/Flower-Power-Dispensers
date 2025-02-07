import { Location } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CartService } from '../cart.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AccessibilityService } from '../accessibility.service';
import { Router } from '@angular/router';
import { catchError, Subject, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../auth.service';
import { AeropayService } from '../aeropay.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  @Input() checkoutInfo: any;

  deliveryAddress = {
    street: '',
    apt: '',
    city: '',
    zip: '',
    state: 'NY' // Default to New York and cannot be changed
  };
  
  isDatePickerOpen = false;
  selectedDate: string | null = null;
  pointsToRedeem: number = 0;

  showTooltip = false;
  applyPoints: boolean = false;

  finalSubtotal: number = 0;
  finalTotal: number = 0;
  finalTax: number = 0;

  pointValue: number = 0.05;

  selectedTime: string = '';

  isLoading: boolean = false;

  timeOptions: { value: string; display: string }[] = [];

  selectedPaymentMethod: string = '';

  selectedOrderType: string = 'pickup';

  aeropayButtonInstance: any;

  enableDelivery: boolean = false;

  aeropayAuthToken: string | null = null;

  private destroy$ = new Subject<void>();

  @Output() back: EventEmitter<void> = new EventEmitter<void>();
  @Output() orderPlaced = new EventEmitter<void>();

  constructor(
    private readonly location: Location,
    private cartService: CartService,
    private loadingController: LoadingController,
    private accessibilityService: AccessibilityService,
    private toastController: ToastController,
    private router: Router,
    private authService: AuthService,
    private aeropayService: AeropayService
  ) {}

  ngOnInit() {
    this.calculateDefaultTotals();
    this.generateTimeOptions();
    // this.initializeAeroPay();
    window.AeroPay.init({
      env: 'production',
    });
    
    const ap = window.AeroPay.button({
      forceIframe: false, // Ensures it opens in an iframe
      location: 'ff46fe702a',
      type: 'checkout',
      onSuccess: (uuid: string) => {
        console.log('Transaction successful:', uuid);
        this.placeOrder();
      },
      onEvent: (event: any) => {
        console.error('Event:', event);
      },
      onError: (event: any) => {
        console.error('Transaction error:', event);
      },
    });
    
    ap.render('aeropay-button-container');    

    const aeroPayButton = document.getElementById('aeropay-button-container');
    if (aeroPayButton) {
      aeroPayButton.addEventListener('click', () => {
        ap.launch(this.finalTotal.toFixed(2));
      });
    }
  }


  // initializeAeroPay() {
  //   if (window.AeroPay) {
  //     window.AeroPay.init({ env: 'production' });

  //     this.aeropayButtonInstance = window.AeroPay.button({
  //       forceIframe: false,
  //       location: 'ff46fe702a',
  //       type: 'checkout',
  //       onSuccess: (uuid: string) => {
  //         console.log('✅ AeroPay Transaction Successful:', uuid);
  //         this.placeOrder();
  //       },
  //       onError: (error: any) => {
  //         console.error('❌ AeroPay Transaction Error:', error);
  //         this.presentToast('Payment failed. Please try again.', 'danger');
  //       },
  //     });

  //     this.aeropayButtonInstance.render('aeropay-button-container');

  //     // Add click event listener to start authentication
  //     const aeroPayButton = document.getElementById('aeropay-button-container');
  //     if (aeroPayButton) {
  //       aeroPayButton.addEventListener('click', () => {
  //         this.startAeroPayProcess();
  //       });
  //     }
  //   } else {
  //     console.error('❌ AeroPay SDK not loaded');
  //   }
  // }

  // async startAeroPayProcess() {
  //   console.log('🔄 Checking if AeroPay Token is valid...');
  
  //   const existingToken = this.aeropayService.getAuthToken();
  
  //   if (existingToken) {
  //     console.log('✅ Existing AeroPay Token is valid. Proceeding to payment...');
  //     this.createAeroPayUser();
  //   } else {
  //     console.log('🔄 No valid token found. Authenticating with AeroPay...');
  
  //     this.aeropayService.authenticate().subscribe({
  //       next: (response: any) => {
  //         console.log('✅ AeroPay Authentication Response:', response);
  
  //         // 🔴 **Check for API errors inside the response**
  //         if (response.success === false || !response.token) {
  //           console.error('❌ AeroPay Authentication Failed:', response.error);
  //           this.presentToast(`Authentication Error: ${response.error.message}`, 'danger');
  //           return; // **Exit function to prevent further execution**
  //         }
  
  //         // ✅ If authentication is successful, store the token and proceed
  //         this.aeropayService.setAuthToken(response.token, response.ttl);
  //         console.log('✅ AeroPay Token:', response.token);
  //         this.createAeroPayUser();
  //       },
  //       error: (error: any) => {
  //         console.error('❌ AeroPay Authentication Request Failed:', error);
  //         this.presentToast('Authentication request failed. Please try again.', 'danger');
  //       }
  //     });
  //   }
  // }
  

  // async createAeroPayUser() {
  //   console.log('🔄 Creating AeroPay User...');
  
  //   const userData = {
  //     first_name: this.checkoutInfo.user_info.fname,
  //     last_name: this.checkoutInfo.user_info.lname,
  //     phone: this.checkoutInfo.user_info.phone,
  //     email: this.checkoutInfo.user_info.email
  //   };
  
  //   this.aeropayService.createUser(userData).subscribe({
  //     next: (response: any) => {
  //       console.log('✅ AeroPay User Created Successfully:', response);
  //       // this.presentToast('AeroPay User Created!', 'success');
  //     },
  //     error: (error: any) => {
  //       console.error('❌ Error Creating AeroPay User:', error);
  //       this.presentToast('Error creating user. Please try again.', 'danger');
  //     }
  //   });
  // }

  generateTimeOptions() {
    for (let hour = 8; hour <= 23; hour++) {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const amPm = hour < 12 ? 'AM' : 'PM';
      const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
      this.timeOptions.push({
        value: `${formattedHour}:00`,
        display: `${displayHour}:00 ${amPm}`,
      });
    }
  }

  calculateDefaultTotals() {
    this.finalSubtotal = this.checkoutInfo.cart.reduce(
      (total: number, item: any) => total + (item.price * item.quantity),
      0
    );
    this.finalTax = this.finalSubtotal * 0.13;
    this.finalTotal = this.finalSubtotal + this.finalTax;
    this.updateTotals();
  }

  updateTotals() {
    const pointsValue = this.pointsToRedeem * this.pointValue;
    const originalSubtotal = this.checkoutInfo.cart.reduce(
      (total: number, item: any) => total + (item.price * item.quantity),
      0
    );
    this.finalSubtotal = originalSubtotal - pointsValue;
    if (this.finalSubtotal < 0) this.finalSubtotal = 0;
    this.finalTax = this.finalSubtotal * 0.13;
    this.finalTotal = this.finalSubtotal + this.finalTax;
    if(this.finalTotal >= 90){
      this.enableDelivery = true;
    }

    this.accessibilityService.announce(
      `Subtotal updated to ${this.finalSubtotal.toFixed(2)} dollars.`,
      'polite'
    );
  }

  goBack() {
    this.back.emit();
    this.accessibilityService.announce(
      'Returned to the previous page.',
      'polite'
    );
  }

  toggleDatePicker() {
    this.isDatePickerOpen = !this.isDatePickerOpen;
    const message = this.isDatePickerOpen
      ? 'Date picker opened.'
      : 'Date picker closed.';
    this.accessibilityService.announce(message, 'polite');
  }

  toggleTooltip() {
    this.showTooltip = !this.showTooltip;
  }

  onDateSelected(event: any) {
    const date = new Date(event.detail.value);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    this.selectedDate = date.toLocaleDateString(undefined, options);
    this.showTooltip = false;
    this.accessibilityService.announce(
      `Selected date is ${this.selectedDate}.`,
      'polite'
    );
  }

  async placeOrder() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Please wait while we process your order...',
      cssClass: 'custom-loading',
    });
    await loading.present();
  
    try {
      const user_id = this.checkoutInfo.user_info.id;
      const points_redeem = this.pointsToRedeem;
      let pos_order_id = 0;
      let points_add = 0;
  
      const deliveryAddress =
        this.selectedOrderType === 'delivery'
          ? {
              address1: this.deliveryAddress.street.trim(),
              address2: this.deliveryAddress.apt ? this.deliveryAddress.apt.trim() : null,
              city: this.deliveryAddress.city.trim(),
              state: this.deliveryAddress.state.trim(),
              zip: this.deliveryAddress.zip.trim(),
              delivery_date: new Date().toISOString().split('T')[0],
            }
          : null;
  
      console.log('✅ Starting checkout process...');
      const response = await this.cartService.checkout(points_redeem, this.selectedOrderType, deliveryAddress);
      console.log('✅ Checkout successful:', response);
  
      pos_order_id = response.id_order;
      points_add = response.subtotal;
  
      console.log('✅ Placing order...');
      await this.cartService.placeOrder(user_id, pos_order_id, points_redeem ? 0 : points_add, points_redeem, this.finalSubtotal);
      console.log('✅ Order placed successfully');
  
      this.orderPlaced.emit();

      console.log('✅ Fetching user orders...');
      const userOrders = await this.authService.getUserOrders(); // ✅ Ensure this is awaited
      console.log('✅ User orders fetched successfully:', userOrders);
      
      this.accessibilityService.announce('Your order has been placed successfully.', 'polite');
      console.log('🎉 Order and user data updated successfully!');
    } catch (error:any) {
      console.error('❌ Error placing order:', error);
      await this.presentToast('Error placing order: ' + JSON.stringify(error.message));
      this.accessibilityService.announce('There was an error placing your order. Please try again.', 'polite');
    } finally {
      this.isLoading = false;
      console.log('✅ Cleanup complete: Destroying subscription');
      await loading.dismiss();
    }
  }
  

  // 🛑 Cleanup Function: Call this when destroying component
  ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
  }


  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }

  onOrderTypeChange(event: any) {
    this.selectedOrderType = event.detail.value;
    if(this.selectedOrderType === 'delivery'){
      this.selectedPaymentMethod = 'aeropay'
    }
  }

}
