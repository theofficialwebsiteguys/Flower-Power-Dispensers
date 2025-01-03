import { Injectable } from '@angular/core';
import { Product } from './product/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

import { ProductCategory, CategoryWithImage } from './product-category/product-category.model';
import {
  DEFAULT_PRODUCT_FILTERS,
  PotencyRange,
  ProductFilterOptions,
  ProductFilters,
} from './product-filters/product-filters.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private products = new BehaviorSubject<Product[]>([]);
  products$ = this.products.asObservable();

  private currentCategory = new BehaviorSubject<ProductCategory>('FLOWER');
  currentCategory$ = this.currentCategory.asObservable();

  private currentProduct = new BehaviorSubject<Product | null>(null); // Start with null or a default Product
  currentProduct$ = this.currentProduct.asObservable();

  private currentProductFilters = new BehaviorSubject<ProductFilters>(
    DEFAULT_PRODUCT_FILTERS
  );
  currentProductFilters$ = this.currentProductFilters.asObservable();

  constructor(private http: HttpClient, private route: Router) {
    this.loadProductsFromSessionStorage();
  }

  private loadProductsFromSessionStorage(): void {
    const storedProducts = sessionStorage.getItem('products');
    if (storedProducts) {
      const parsedProducts: Product[] = JSON.parse(storedProducts);
      this.products.next(parsedProducts); // Load products into BehaviorSubject
    }
  }

  private saveProductsToSessionStorage(products: Product[]): void {
    sessionStorage.setItem('products', JSON.stringify(products));
  }

  fetchProducts(): void {
    if (this.products.value.length > 0) {
      console.log('Products already loaded from session storage.');
      return;
    }

    this.http
      .get<Product[]>(`${environment.apiUrl}/products/all-products`, {
        params: { venueId: environment.venueId } 
      })
      .subscribe(
        (products) => {
          this.products.next(products); // Update BehaviorSubject
          this.saveProductsToSessionStorage(products); // Save to session storage
          console.log(products); // Verify all products are fetched
        },
        (error) => {
          console.error('Error fetching products from backend:', error);
        }
      );
  }

  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  getFilteredProducts(): Observable<Product[]> {
    return this.products$.pipe(
      map((productArray) => {
        const {
          sortMethod: { criterion, direction },
        } = this.currentProductFilters.getValue();

  
        return productArray
          .filter(({ category, brand, strainType, weight, thc }) => {
            const {
              brands,
              strains,
              weights,
              potency: { thc: thcRange },
            } = this.currentProductFilters.getValue();
  
            const isEmpty = (arr: any) => {
              return arr.length < 1;
            };
  
            const isInRange = (value: number, range: PotencyRange): boolean => {
              const { lower, upper } = range;
              return value >= lower && value <= upper;
            };
  
            // Default THC to 100 if null or undefined
            const defaultThc = thc ?? '100% THC';
  
            return (
              category === this.currentCategory.value &&
              (isEmpty(brands) || brands.includes(brand)) &&
              (!strainType ||
                isEmpty(strains) ||
                strains.some((s) =>
                  strainType.toUpperCase().split(' ').includes(s)
                )) &&
              (!weight || isEmpty(weights) || weights.includes(weight)) &&
              (!defaultThc || isInRange(Number(defaultThc.split('%')[0]), thcRange))
            );
          })
          .sort(
            (
              { price: priceA, thc: thcA, title: titleA },
              { price: priceB, thc: thcB, title: titleB }
            ) => {
              let result = 0;
  
              // Default THC to 100 if null or undefined for sorting
              const defaultThcA = thcA ?? '100';
              const defaultThcB = thcB ?? '100';
  
              switch (criterion) {
                case 'POPULAR': {
                  break;
                }
                case 'PRICE': {
                  if (direction === 'ASC')
                    result = Number(priceA) - Number(priceB);
                  else if (direction === 'DESC')
                    result = Number(priceB) - Number(priceA);
                  break;
                }
                case 'THC': {
                  if (direction === 'ASC')
                    result = Number(defaultThcA) - Number(defaultThcB);
                  else if (direction === 'DESC')
                    result = Number(defaultThcB) - Number(defaultThcA);
                  break;
                }
                case 'ALPHABETICAL': {
                  if (direction === 'ASC')
                    result = titleA.localeCompare(titleB);
                  else if (direction === 'DESC')
                    result = titleB.localeCompare(titleA);
                  break;
                }
                default: {
                  break;
                }
              }
  
              return result;
            }
          );
      })
    );
  }
  

  getProductFilterOptions(): Observable<ProductFilterOptions> {
    return this.products$.pipe(
      map((productArray) => {
        const fields = ['brand', 'weight'];

        let options: { [key: string]: any } = {};
        options = fields.reduce((acc, field) => {
          acc[`${field}s`] = new Set();
          return acc;
        }, options);

        productArray.forEach((product) => {
          if (product.category === this.currentCategory.value) { // Filter by currentCategory
            fields.forEach((field) => {
              if (!!product[field]) {
                options[`${field}s`].add(product[field]);
              }
            });
          }
        });

        let result: ProductFilterOptions = { brands: [], weights: [] };
        result = fields.reduce((acc, field) => {
          acc[`${field}s`] = Array.from(options[`${field}s`]).map((o) => ({
            label: o,
            value: o,
          }));
          return acc;
        }, result);

        return result;
      })
    );
  }

  updateCategory(category: ProductCategory) {
    this.currentCategory.next(category); // Updates the value in the BehaviorSubject
    this.route.navigateByUrl('/products');
  }

  getCurrentCategory(): ProductCategory {
    return this.currentCategory.value;
  }

  getCategories(): CategoryWithImage[] {
    return [
      { category: 'FLOWER', imageUrl: 'assets/icons/flower.png' },
      { category: 'PRE_ROLLS', imageUrl: 'assets/icons/prerolls.png' },
      { category: 'CONCENTRATES', imageUrl: 'assets/icons/concentrates.png' },
      { category: 'VAPORIZERS', imageUrl: 'assets/icons/vaporizers.png' },
      { category: 'BEVERAGES', imageUrl: 'assets/icons/beverages.png' },
      { category: 'TINCTURES', imageUrl: 'assets/icons/tinctures.png' },
      { category: 'EDIBLES', imageUrl: 'assets/icons/edibles.png' },
      { category: 'ACCESSORIES', imageUrl: 'assets/icons/accessories.png' },
    ];
  }

  //combineLatest combines use of 2 observables
  getSimilarItems(): Observable<Product[]> {
    return combineLatest([this.currentProduct$, this.products$]).pipe(
      map(([currentProduct, productArray]) => {
  
        if (!currentProduct || !currentProduct.category || !currentProduct.brand) {
          return []; 
        }
  
        const { category, brand } = currentProduct;

        const filteredProducts = productArray.filter((product) => 
          product.category === category && product.brand === brand && product.id != currentProduct.id
        );
  
        return filteredProducts.slice(0, 5);
      })
    );
  }


  updateCurrentProduct(product: Product) {
    this.currentProduct.next(product);
    this.updateCategory(product.category)
    console.log(product);
    this.route.navigateByUrl('/product-display');
  }

  getCurrentProduct(): Product | null {
    return this.currentProduct.value;
  }


  updateProductFilters(filters: ProductFilters) {
    this.currentProductFilters.next({ ...filters }); // Ensure a new reference
  }

  getProductsByIds(ids: string[]): Observable<Product[]> {
    return this.products$.pipe(
      map((productArray) =>
        productArray.filter((product) => ids.includes(product.id))
      )
    );
  }
  
}
