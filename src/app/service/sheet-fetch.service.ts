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
              // let average =
              //   (parseFloat(user[11]) +
              //     parseFloat(user[12]) +
              //     parseFloat(user[13]) +
              //     parseFloat(user[14]) +
              //     parseFloat(user[15]) +
              //     parseFloat(user[16])) /
              //   6;

              // if (user[0] == 'CyCeph') {
              //   console.log(average);
              // }

              // let sr = Math.pow(parseFloat(user[10]) / 5000, 0.5);

              // let score = (100 * sr + average) / 2;

              let skills = [parseFloat(user[13]), parseFloat(user[14]), parseFloat(user[15]), parseFloat(user[16]), parseFloat(user[17]), parseFloat(user[18])];

              skills.sort((a, b) => b - a);

              const top3 = skills.slice(0, 3);
              const bottom3 = skills.slice(3);

              const top3Avg = top3.reduce((a, b) => a + b, 0) / top3.length;
              const bottom3Avg = bottom3.reduce((a, b) => a + b, 0) / bottom3.length;

              const result = (top3Avg + (bottom3Avg * 0.5)) / 1.5;

              let score = result;

              this.Users.push({
                username: user[2],
                uId: user[3],
                pp: user[4],
                accPercentage: user[5],
                starRating: user[6],
                cs: user[8],
                ar: user[7],
                length: user[10],
                rating: Math.round(score),
                country: user[11],
                sr: user[12],
                rfx: Math.round(user[13]),
                ten: Math.round(user[14]),
                sta: Math.round(user[15]),
                acc: Math.round(user[16]),
                rea: Math.round(user[17]),
                pre: Math.round(user[18]),
                wrm: Math.round(user[19] * 10) / 10,
                title: user[20],
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
