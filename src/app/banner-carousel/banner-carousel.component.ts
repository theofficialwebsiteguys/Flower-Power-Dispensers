import { Component, OnInit, OnDestroy } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  // banners = [
  //   {
  //     image: 'assets/banner-cover.jpg',
  //     title: 'Where Passion Meets Potency',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/fp-2.jpg',
  //     title: 'Flower Power Counter Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel1.jpg',
  //     title: 'Flower Power Sign',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel3.jpg',
  //     title: 'Dank Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel4.jpg',
  //     title: 'Bodega Boyz Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel5.jpg',
  //     title: 'Toke Folks Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel6.jpg',
  //     title: 'Bodega Boyz Display 2',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel7.jpg',
  //     title: 'Hurley Grown Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel8.jpg',
  //     title: 'MFNY Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel9.jpg',
  //     title: 'Flower Display',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel10.jpg',
  //     title: 'Display Case',
  //     description: 'Flower Power Dispensary',
  //   },
  //   {
  //     image: 'assets/carousel2.jpg',
  //     title: 'Flower Power Neon Sign',
  //     description: 'Flower Power Dispensary',
  //   }
  // ];
  banners: { image: string; title: string; description: string }[] = [];
  currentIndex = 0;
  interval: any;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadCarouselImages();
    this.startCarousel();
  }

  loadCarouselImages() {
    this.settingsService.getCarouselImages().subscribe(
      response => {
        console.log(response)
        this.banners = response.images.map((imgUrl, index) => ({
          image: `${imgUrl}?v=${new Date().getTime()}`,
          title: `Carousel Image ${index + 1}`,
          description: 'Flower Power Dispensary',
        }));
        console.log(this.banners)
      },
      error => {
        console.error('Error fetching carousel images:', error);
      }
    );
  }

  startCarousel() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
