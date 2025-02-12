import { Component, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { CategoryWithImage, ProductCategory } from '../product-category/product-category.model';
import { Product } from '../product/product.model';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-card-slider',
  templateUrl: './card-slider.component.html',
  styleUrls: ['./card-slider.component.scss'],
})
export class CardSliderComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryWithImage[] = [];
  loading: boolean = true; // Add loading state

  constructor(private readonly productService: ProductsService, private accessibilityService: AccessibilityService) {}

  ngOnInit() {
    this.categories = this.productService.getCategories();

    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      this.loading = false; // Set loading to false when data is retrieved
    });
  }

  updateCategory(category?: ProductCategory) {
    if (category) {
      this.productService.updateCategory(category);
      this.accessibilityService.announce(`Category changed to ${category}`, 'polite');
    }
  }

  updateProductDisplay(product: Product) {
    this.productService.updateCurrentProduct(product);
    this.accessibilityService.announce(`Viewing product ${product.title}`, 'polite');
  }

  getProductImage(product: any): string {
    if (product.image) {
      return product.image;
    }
    if (product.brand) {
      return `assets/brand_images/${product.brand.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    }
    return 'assets/default.jpg';
  }
}
