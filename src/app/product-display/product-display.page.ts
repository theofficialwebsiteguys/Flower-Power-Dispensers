import { Component, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { DEFAULT_PRODUCT_FILTERS } from '../product-filters/product-filters.model';

@Component({
  selector: 'app-product-display',
  templateUrl: './product-display.page.html',
  styleUrls: ['./product-display.page.scss'],
})
export class ProductDisplayPage implements OnInit {
  constructor(private productService: ProductsService) {}

  ngOnInit() {
    this.productService.updateProductFilters({
      ...DEFAULT_PRODUCT_FILTERS,
      sortMethod: { criterion: 'RECENT', direction: 'DESC' },
    });
  }
}
