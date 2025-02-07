import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { CartItem, CartService } from '../cart.service';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss'],
})
export class RecentOrdersComponent  implements OnInit {
  pendingOrders: any[] = [];
  pastOrders: any[] = [];

  expandedOrderIndex: { pending: number | null; past: number | null } = {
    pending: null,
    past: null,
  }; 

  constructor(private authService: AuthService, private cartService: CartService, private accessibilityService: AccessibilityService) {}

  ngOnInit() {
    this.authService.orders.subscribe((orders) => {
      // Sort orders by ID in descending order (most recent first)
      orders.sort((a, b) => b.id_order - a.id_order);
  
      // Separate pending and past orders
      this.pendingOrders = orders.filter((order) => !order.complete);
      this.pastOrders = orders.filter((order) => order.complete);
  
      console.log('Pending Orders:', this.pendingOrders);
      console.log('Past Orders:', this.pastOrders);
    });
  }

  toggleExpand(index: number, section: 'pending' | 'past'): void {
    const isExpanded = this.expandedOrderIndex[section] === index;
    this.expandedOrderIndex[section] = isExpanded ? null : index;

    const message = isExpanded
      ? `Order ${section} #${index + 1} collapsed.`
      : `Order ${section} #${index + 1} expanded.`;
    this.accessibilityService.announce(message, 'polite');
  }

  reorder(order: any): void {
    order.items.forEach((item: any) => {
      const cartItem: CartItem = {
        id: item.id,
        posProductId: item.posProductId,
        image: item.image,
        brand: item.brand,
        desc: item.desc,
        price: item.price,
        quantity: item.quantity,
        title: item.title,
        strainType: item.strainType,
        thc: item.thc,
        weight: item.weight,
      };
      this.cartService.addToCart(cartItem);
    });
    const message = `Order #${order.id_order} items have been added to your cart.`;
    this.accessibilityService.announce(message, 'assertive');
    console.log('Order added to cart:', order);
  }
}
