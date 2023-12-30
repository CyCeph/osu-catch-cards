import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';

export interface User {
  username: string;
  uId: string;
  pp: number;
  accPercentage: string;
  starRating: number;
  cs: number;
  ar: number;
  length: string;
  rating: number;
  country: string;
  sr: number;
  rfx: number;
  ten: number;
  sta: number;
  acc: number;
  rea: number;
  pre: number;
  wrm: number;
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class SheetFetchService {
  private SkillRatingLink: string =
    'https://docs.google.com/spreadsheets/d/1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc/export?format=csv&id=1s-ItBZwDzWb_taDPD2L2jrUbNzl4pxjSgXcE5dza4tc&gid=64960459';

  public Users: User[] = [];
  constructor(private httpClient: HttpClient, private papa: Papa) {
    this.getData();
  }

  private getData(): void {
    const data = this.httpClient.get(this.SkillRatingLink, {
      responseType: 'text',
    });

    data.subscribe((data) => {
      this.papa.parse(data, {
        complete: (result) => {
          const output = result.data;
          console.log(output);

          output.map((user: any) => {
            if (true) {
              let average =
                (parseFloat(user[10]) +
                  parseFloat(user[11]) +
                  parseFloat(user[12]) +
                  parseFloat(user[13]) +
                  parseFloat(user[14]) +
                  parseFloat(user[15])) /
                6;

              if (user[0] == 'CyCeph') {
                console.log(average);
              }

              let sr = Math.pow(parseFloat(user[9]) / 5000, 0.5);

              let score = (100 * sr + average) / 2;

              this.Users.push({
                username: user[0],
                uId: user[1],
                pp: user[2],
                accPercentage: user[3],
                starRating: user[4],
                cs: user[5],
                ar: user[6],
                length: user[7],
                rating: Math.round(score),
                country: user[8],
                sr: user[9],
                rfx: Math.round(user[10]),
                ten: Math.round(user[11]),
                sta: Math.round(user[12]),
                acc: Math.round(user[13]),
                rea: Math.round(user[14]),
                pre: Math.round(user[15]),
                wrm: Math.round(user[16] * 10) / 10,
                title: user[17],
              });
            }
          });
        },
      });
    });
  }

  public getCountryCode(id: string) {
    return this.httpClient.get(
      `https://osupepe.com/api/users/userstats?userId=${id}`
    );
  }
}
