import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { Observable, of } from 'rxjs';

import { ProductsService } from '../products.service';

import {
  DEFAULT_PRODUCT_FILTERS,
  OPTIONS_CRITERIA,
  OPTIONS_DIRECTIONS,
  OPTIONS_STRAINS,
  ProductFilters,
  ProductFilterField,
  CriteriaOptions,
  DirectionOptions,
  StrainOptions,
  ProductFilterOptions,
} from './product-filters.model';
import { Strain } from '../product/product.model';

@Component({
  selector: 'app-product-filters',
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.scss'],
})
export class ProductFiltersComponent implements OnInit {
  constructor(private productService: ProductsService) {
    addIcons({ close });
  }

  isModalOpen = false;

  filters: ProductFilters = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_FILTERS));
  hasDirtyFilters: boolean = false;

  criteriaOptions: CriteriaOptions = OPTIONS_CRITERIA;
  directionOptions: DirectionOptions = OPTIONS_DIRECTIONS;
  strainOptions: StrainOptions = OPTIONS_STRAINS;

  dynamicFilterOptions$: Observable<ProductFilterOptions> = of({
    brands: [],
    weights: [],
  });

  ngOnInit() {
    this.productService.products$.subscribe(() => {
      this.dynamicFilterOptions$ =
        this.productService.getProductFilterOptions();
    });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  handleFilterUpdate() {
    this.hasDirtyFilters =
      JSON.stringify(this.filters) !== JSON.stringify(DEFAULT_PRODUCT_FILTERS);
    this.productService.updateProductFilters(this.filters);
  }

  clearFilters(): void {
    this.filters = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_FILTERS));
    this.handleFilterUpdate();
  }

  isChecked(array: any, value: string): boolean {
    return array.includes(value);
  }

  isStrain(value: string): value is Strain {
    return ['HYBRID', 'SATIVA', 'INDICA'].includes(value);
  }

  handleCheckField(
    isChecked: boolean,
    value: string | Strain,
    field: ProductFilterField
  ) {
    if (!isChecked) {
      if (field === 'strains')
        this.filters[field] = this.filters[field].filter(
          (v: Strain) => v !== value
        );
      else
        this.filters[field] = this.filters[field].filter(
          (v: string) => v !== value
        );

      this.handleFilterUpdate();
      return;
    }

    if (!this.isChecked(this.filters[field], value)) {
      if (field === 'strains') {
        if (this.isStrain(value)) this.filters[field].push(value);
      } else this.filters[field].push(value);
    }

    this.handleFilterUpdate();
  }
}
