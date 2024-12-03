import { Component, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { ProductCategory } from '../product-category/product-category.model';
import { Product } from '../product/product.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-card-slider',
  templateUrl: './card-slider.component.html',
  styleUrls: ['./card-slider.component.scss'],
})
export class CardSliderComponent {
  categories: { title: string; category?: ProductCategory }[] = [
    {
      title: 'Flower',
      category: 'FLOWER',
    },
    {
      title: 'Pre-Rolls',
      category: 'PRE_ROLLS',
    },
    {
      title: 'Edibles',
      category: 'EDIBLES',
    },
    {
      title: 'Vaporizers',
      category: 'VAPORIZERS',
    },
    {
      title: 'Accessories',
      category: 'ACCESSORIES',
    },

    // Add more categories as needed
  ];

  products: Product[] = [];

  constructor(private productService: ProductsService) {}

  ngOnInit() {
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      console.log(this.products);
    });
  }

  updateCategory(category?: ProductCategory) {
    if (!category) {
      return;
    }
    this.productService.updateCategory(category);
  }

  updateProductDisplay(product: Product) {
    // Navigate to the desired route, e.g., /product-details/:id
    this.productService.updateCurrentProduct(product);
  }
}
