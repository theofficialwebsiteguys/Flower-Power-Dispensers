import { Location } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CartService } from '../cart.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AccessibilityService } from '../accessibility.service';
import { Router } from '@angular/router';

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

  @Output() back: EventEmitter<void> = new EventEmitter<void>();
  @Output() orderPlaced = new EventEmitter<void>();

  constructor(
    private readonly location: Location,
    private cartService: CartService,
    private loadingController: LoadingController,
    private accessibilityService: AccessibilityService,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.calculateDefaultTotals();
    this.generateTimeOptions();

    window.AeroPay.init({
      env: 'production',
    });

    const ap = window.AeroPay.button({
      forceIframe: false,
      location: 'ff46fe702a',
      type: 'checkout',
      onSuccess: (uuid: string) => {
        console.log('Transaction successful:', uuid);
        this.placeOrder();
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
      (total: number, item: any) => total + item.price,
      0
    );
    this.finalTax = this.finalSubtotal * 0.13;
    this.finalTotal = this.finalSubtotal + this.finalTax;
  }

  updateTotals() {
    const pointsValue = this.pointsToRedeem * this.pointValue;
    const originalSubtotal = this.checkoutInfo.cart.reduce(
      (total: number, item: any) => total + item.price,
      0
    );
    this.finalSubtotal = originalSubtotal - pointsValue;
    if (this.finalSubtotal < 0) this.finalSubtotal = 0;
    this.finalTax = this.finalSubtotal * 0.13;
    this.finalTotal = this.finalSubtotal + this.finalTax;

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
      cssClass: 'custom-loading', // Apply the custom CSS
    });
    await loading.present();
    

    const user_id = this.checkoutInfo.user_info.id;
    let pos_order_id = 0;
    let points_add = 0;
    const points_redeem = this.pointsToRedeem;

    // Format the delivery address as a single string if order type is 'delivery'
    let formattedAddress = '';
    if (this.selectedOrderType === 'delivery') {
      formattedAddress = `${this.deliveryAddress.street}, ${this.deliveryAddress.city}, ${this.deliveryAddress.state} ${this.deliveryAddress.zip}`;
    }

    this.cartService.checkout(points_redeem, this.selectedOrderType === 'delivery' ? formattedAddress : null).subscribe(
      (response) => {
        console.log('Final Response: ', response);
        pos_order_id = response.id_order;
        points_add = response.subtotal;

        console.log('Order Placed Successfully', response);

        this.cartService
          .placeOrder(
            user_id,
            pos_order_id,
            points_redeem ? 0 : points_add,
            points_redeem
          )
          .subscribe({
            next: () => {
              console.log('Order placed successfully!');
              loading.dismiss();
              this.isLoading = false;
              this.orderPlaced.emit();
              this.accessibilityService.announce(
                'Your order has been placed successfully.',
                'polite'
              );
            },
            error: async (error) => {
              loading.dismiss();
              this.isLoading = false;
              console.error('Error placing order:', error);
              await this.presentToast('Error placing order: ' + JSON.stringify(error.error.message));
              this.accessibilityService.announce(
                'There was an error placing your order. Please try again.',
                'polite'
              );
            },
          });
      },
      async (error) => {
        loading.dismiss();
        this.isLoading = false;
        console.error('Error during checkout:', error);
        await this.presentToast('Error placing order: ' + JSON.stringify(error.error.message));
        this.accessibilityService.announce(
          'Checkout failed. Please try again.',
          'polite'
        );

      }
    );
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
      this.selectedPaymentMethod = 'aeropay';
    }
  }

}
