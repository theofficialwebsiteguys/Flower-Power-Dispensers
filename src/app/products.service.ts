import { Injectable } from '@angular/core';
import { Product } from './product/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { ProductCategory } from './product-category/product-category.model';
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
    this.loadProductsFromLocalStorage();
  }

  private loadProductsFromLocalStorage(): void {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      const parsedProducts: Product[] = JSON.parse(storedProducts);
      this.products.next(parsedProducts); // Load products into BehaviorSubject
    }
  }

  private saveProductsToLocalStorage(products: Product[]): void {
    localStorage.setItem('products', JSON.stringify(products));
  }

  fetchProducts(): void {
    if (this.products.value.length > 0) {
      console.log('Products already loaded from local storage.');
      return;
    }

    this.http
      .get<Product[]>(`${environment.apiUrl}/products/all-products`)
      .subscribe(
        (products) => {
          this.products.next(products); // Update BehaviorSubject
          this.saveProductsToLocalStorage(products); // Save to local storage
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

            return (
              category === this.currentCategory.value &&
              (isEmpty(brands) || brands.includes(brand)) &&
              (!strainType ||
                isEmpty(strains) ||
                strains.some((s) =>
                  strainType.toUpperCase().split(' ').includes(s)
                )) &&
              (!weight || isEmpty(weights) || weights.includes(weight)) &&
              (!thc || isInRange(Number(thc.split('%')[0]), thcRange))
            );
          })
          .sort(
            (
              { price: priceA, thc: thcA, title: titleA },
              { price: priceB, thc: thcB, title: titleB }
            ) => {
              let result = 0;

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
                  if (direction === 'ASC') result = Number(thcA) - Number(thcB);
                  else if (direction === 'DESC')
                    result = Number(thcB) - Number(thcA);
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
          fields.forEach((field) => {
            if (!!product[field]) {
              options[`${field}s`].add(product[field]);
            }
          });
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

  getCategories(): ProductCategory[] {
    return [
      'FLOWER',
      'PRE_ROLLS',
      'CONCENTRATES',
      'VAPORIZERS',
      'BEVERAGES',
      'TINCTURES',
      'EDIBLES',
      'ACCESSORIES',
    ];
  }

  getProductsList(): Product[] {
    return [
      {
        category: 'FLOWER',
        title: 'Flower 1',
        brand: 'Brand 1',
        desc: 'A very long description about the flower 1 product that sells at flower power dispensary and is very potent. Enjoy this flower at night time or in the morning, or day .A very long description about the flower 1 product that sells at flower power dispensary and is very potent. Enjoy this flower at night time or in the morning, or day',
        strainType: 'SATIVA',
        thc: '20.3',
        weight: '1/8oz',
        price: '40',
        image: 'assets/default.jpg',
      },
      {
        category: 'FLOWER',
        title: 'Flower 2',
        brand: 'Brand 1',
        desc: '',
        strainType: 'INDICA',
        thc: '22.1',
        weight: '1/8oz',
        price: '45',
        image: 'assets/default.jpg',
      },
      {
        category: 'FLOWER',
        title: 'Flower 3',
        brand: 'Brand 2',
        desc: '',
        strainType: 'HYBRID',
        thc: '18.7',
        weight: '1/8oz',
        price: '35',
        image: 'assets/default.jpg',
      },
      {
        category: 'FLOWER',
        title: 'Flower 4',
        brand: 'Brand 3',
        desc: '',
        strainType: 'SATIVA',
        thc: '25.4',
        weight: '1/4oz',
        price: '65',
        image: 'assets/default.jpg',
      },
      {
        category: 'PRE-ROLL',
        title: 'Pre Roll 1',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '25.4',
        weight: '1g',
        price: '15',
        image: 'assets/default.jpg',
      },
      {
        category: 'PRE-ROLL',
        title: 'Pre Roll 2',
        brand: 'Brand 2',
        desc: '',
        strainType: 'SATIVA',
        thc: '19.6',
        weight: '1g',
        price: '10',
        image: 'assets/default.jpg',
      },
      {
        category: 'PRE-ROLL',
        title: 'Pre Roll 3',
        brand: 'Brand 3',
        desc: '',
        strainType: 'SATIVA',
        thc: '20.3',
        weight: '2g',
        price: '15',
        image: 'assets/default.jpg',
      },
      {
        category: 'PRE-ROLL',
        title: 'Pre Roll 4',
        brand: 'Brand 3',
        desc: '',
        strainType: 'SATIVA',
        thc: '20.3',
        weight: '2g',
        price: '15',
        image: 'assets/default.jpg',
      },
      {
        category: 'PRE-ROLL',
        title: 'Pre Roll 5',
        brand: 'Brand 3',
        desc: '',
        strainType: 'SATIVA',
        thc: '20.3',
        weight: '2g',
        price: '15',
        image: 'assets/default.jpg',
      },
      {
        category: 'VAPORIZER',
        title: 'Vaporizer 1',
        brand: 'Brand 1',
        desc: '',
        strainType: 'INDICA',
        thc: '22.1',
        weight: '0.5g',
        price: '45',
        image: 'assets/default.jpg',
      },
      {
        category: 'VAPORIZER',
        title: 'Vaporizer 2',
        brand: 'Brand 1',
        desc: '',
        strainType: 'INDICA',
        thc: '22.1',
        weight: '0.5g',
        price: '45',
        image: 'assets/default.jpg',
      },
      {
        category: 'VAPORIZER',
        title: 'Vaporizer 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'INDICA',
        thc: '22.1',
        weight: '0.5g',
        price: '45',
        image: 'assets/default.jpg',
      },
      {
        category: 'CONCENTRATE',
        title: 'Concentrate 1',
        brand: 'Brand 1',
        desc: '',
        strainType: 'INDICA',
        thc: '88.7',
        weight: '1g',
        price: '90',
        image: 'assets/default.jpg',
      },
      {
        category: 'CONCENTRATE',
        title: 'Concentrate 2',
        brand: 'Brand 2',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'EDIBLE',
        title: 'Edible 1',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'EDIBLE',
        title: 'Edible 2',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'EDIBLE',
        title: 'Edible 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'SPECIAL',
        title: 'Edible 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'SPECIAL',
        title: 'Flower 2',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'SPECIAL',
        title: 'Vaporizer 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'CONCIERGE',
        title: 'Edible 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'CONCIERGE',
        title: 'Flower 2',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
      {
        category: 'CONCIERGE',
        title: 'Vaporizer 3',
        brand: 'Brand 1',
        desc: '',
        strainType: 'HYBRID',
        thc: '85.2',
        weight: '1g',
        price: '85',
        image: 'assets/default.jpg',
      },
    ];
  }

  updateCurrentProduct(product: Product) {
    this.currentProduct.next(product);
    console.log(product);
    this.route.navigateByUrl('/product-display');
  }

  getCurrentProduct(): Product | null {
    return this.currentProduct.value;
  }

  getSimilarProducts() {
    return this.getProductsList();
  }

  updateProductFilters(filters: ProductFilters) {
    this.currentProductFilters.next(filters);
  }
}
