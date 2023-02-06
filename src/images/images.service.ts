import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImagesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async searchImage(query = 'photo', page: number, per_page: number) {
    const response = await this.httpService.axiosRef.get(
      this.configService.get('UNPLASH_URL'),
      {
        params: {
          query,
          page,
          per_page,
          client_id: this.configService.get('UNPLASH_KEY'),
        },
      },
    );
    return await response.data;
  }
}
