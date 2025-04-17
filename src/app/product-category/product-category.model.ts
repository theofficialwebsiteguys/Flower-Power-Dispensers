export type ProductCategory =
  | 'FLOWER'
  | 'PREROLL'
  | 'VAPORIZERS'
  | 'CONCENTRATES'
  | 'BEVERAGE'
  | 'TINCTURES'
  | 'EDIBLE'
  | 'TOPICAL'
  | 'ACCESSORIES';

  export interface CategoryWithImage {
    category: ProductCategory;
    imageUrl: string;
  }