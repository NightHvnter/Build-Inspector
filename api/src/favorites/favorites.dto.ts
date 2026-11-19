import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { MAX_FAVORITES } from './favorites.service.js';

// Games to add to the signed-in user's favourites. The user comes from the access token.
export class AddFavoritesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_FAVORITES)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(2147483647, { each: true })
  AppIds: number[];
}
