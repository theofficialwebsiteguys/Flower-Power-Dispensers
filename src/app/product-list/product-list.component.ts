import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ProductsService } from '../products.service';

import { Product } from '../product/product.model';
import { ProductCategory } from '../product-category/product-category.model';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {

  @Input() showSimilarItems: boolean = false;

  constructor(private productService: ProductsService, private accessibilityService: AccessibilityService) {}

  currentCategory: ProductCategory = 'PREROLL';
  products$: Observable<Product[]> = of([]);

  ngOnInit() {
    this.updateProducts();

    this.productService.currentCategory$.subscribe((category) => {
      this.currentCategory = category; 
      this.updateProducts();
      this.accessibilityService.announce(`Category updated to ${category}.`, 'polite');
    });

    this.productService.currentProductFilters$.subscribe(() => {
      this.updateProducts();
      this.accessibilityService.announce('Product filters updated.', 'polite');
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showSimilarItems']) {
      this.updateProducts();
      const message = this.showSimilarItems ? 'Displaying similar items.' : 'Displaying filtered products.';
      this.accessibilityService.announce(message, 'polite');
    }
  }

  private updateProducts() {
    if (this.showSimilarItems) {
      this.products$ = this.productService.getSimilarItems();
    } else {
      this.products$ = this.productService.getFilteredProducts();
    }
  }
}
