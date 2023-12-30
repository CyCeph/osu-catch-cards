import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as htmlToImage from 'html-to-image';
import * as sc from 'modern-screenshot';
import { SheetFetchService, User } from 'src/app/service/sheet-fetch.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass'],
})
export class MainComponent {
  constructor(private fetch: SheetFetchService, private http: HttpClient) {
    this.loadImages();
  }

  @ViewChild('usersearch', { read: ElementRef, static: true })
  userSearch: ElementRef;

  @ViewChild('screen') screen: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('downloadLink') downloadLink: ElementRef;

  public Users = this.fetch.Users;

  public activeUser: User;
  public userCountry: string;
  public loading: boolean;

  public profileImageLoaded = false;
  public backgroundLoaded = false;
  public countryLoaded = false;

  private images = [
    'Jester.png',
    'Legend.png',
    'Secret.png',
    'Advanced.png',
    'Amateur.png',
    'Beginner.png',
    'Expert.png',
    'Grandmaster Candidate.png',
    'Grandmaster.png',
    'Master.png',
    'Untitled.png',
  ];

  public loadImages() {
    for (let i = 0; i < this.images.length; i++) {
      console.log(i);
      let img = new Image();
      img.onload = () => {};
      img.src = 'assets/' + this.images[i];
    }
  }
  public downloadImage() {
    sc.domToPng(this.screen.nativeElement, {}).then((dataUrl) => {
      this.downloadLink.nativeElement.href = dataUrl;
      this.downloadLink.nativeElement.download = `${this.activeUser.username}.png`;
      this.downloadLink.nativeElement.click();
    });
  }

  public search() {
    this.loading = true;

    this.profileImageLoaded = false;
    this.backgroundLoaded = false;
    this.countryLoaded = false;

    const inputValue = this.userSearch.nativeElement.value;

    let user = this.Users.find(
      (x) => x.username.toLocaleLowerCase() == inputValue.toLocaleLowerCase()
    );

    this.activeUser = user;
    this.fetch.getCountryCode(this.activeUser.uId).subscribe((data: any) => {
      let letters: string = data.country_acronym;

      this.userCountry = letters
        .toUpperCase()
        .split('')
        .map((char) => (127397 + char.charCodeAt(0)).toString(16))
        .join('-');
      this.loading = false;
    });
  }
}
