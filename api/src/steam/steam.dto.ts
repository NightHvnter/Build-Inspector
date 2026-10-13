import { Expose, Type } from 'class-transformer';

export class Requirements {
  @Expose() minimum?: string;
  @Expose() recommended?: string;
}

export class PriceOverview {
  @Expose() currency: string;
  @Expose() initial: number;
  @Expose() final: number;
  @Expose() discount_percent: number;
  @Expose() initial_formatted: string;
  @Expose() final_formatted: string;
}

export class PackageSub {
  @Expose() packageid: number;
  @Expose() percent_savings_text: string;
  @Expose() percent_savings: number;
  @Expose() option_text: string;
  @Expose() option_description: string;
  @Expose() can_get_free_license: string;
  @Expose() is_free_license: boolean;
  @Expose() price_in_cents_with_discount: number;
}

export class PackageGroup {
  @Expose() name: string;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() selection_text: string;
  @Expose() save_text: string;
  @Expose() display_type: number;
  @Expose() is_recurring_subscription: string;
  @Expose() @Type(() => PackageSub) subs: PackageSub[];
}

export class Platforms {
  @Expose() windows: boolean;
  @Expose() mac: boolean;
  @Expose() linux: boolean;
}

export class Metacritic {
  @Expose() score: number;
  @Expose() url: string;
}

export class Category {
  @Expose() id: number;
  @Expose() description: string;
}

export class Genre {
  @Expose() id: string;
  @Expose() description: string;
}

export class Screenshot {
  @Expose() id: number;
  @Expose() path_thumbnail: string;
  @Expose() path_full: string;
}

export class Movie {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() thumbnail: string;
  @Expose() dash_av1: string;
  @Expose() dash_h264: string;
  @Expose() hls_h264: string;
  @Expose() highlight: boolean;
}

export class Recommendations {
  @Expose() total: number;
}

export class Achievement {
  @Expose() name: string;
  @Expose() path: string;
}

export class Achievements {
  @Expose() total: number;
  @Expose() @Type(() => Achievement) highlighted: Achievement[];
}

export class ReleaseDate {
  @Expose() coming_soon: boolean;
  @Expose() date: string;
}

export class SupportInfo {
  @Expose() url: string;
  @Expose() email: string;
}

export class ContentDescriptors {
  @Expose() ids: number[];
  @Expose() notes: string | null;
}

export class SteamApp {
  @Expose() type: string;
  @Expose() name: string;
  @Expose() steam_appid: number;
  @Expose() required_age: number;
  is_free: boolean;
  @Expose() dlc?: number[];
  @Expose() detailed_description: string;
  @Expose() about_the_game: string;
  @Expose() short_description: string;
  @Expose() supported_languages: string;
  @Expose() header_image: string;
  @Expose() capsule_image: string;
  @Expose() capsule_imagev5: string;
  @Expose() website: string | null;
  @Expose() pc_requirements: Requirements | [];
  @Expose() mac_requirements: Requirements | [];
  @Expose() linux_requirements: Requirements | [];
  @Expose() legal_notice?: string;
  @Expose() ext_user_account_notice?: string;
  @Expose() developers: string[];
  @Expose() publishers: string[];
  @Expose() @Type(() => PriceOverview) price_overview?: PriceOverview;
  @Expose() packages: number[];
  @Expose() @Type(() => PackageGroup) package_groups: PackageGroup[];
  @Expose() @Type(() => Platforms) platforms: Platforms;
  @Expose() @Type(() => Metacritic) metacritic?: Metacritic;
  @Expose() @Type(() => Category) categories: Category[];
  @Expose() @Type(() => Genre) genres: Genre[];
  @Expose() @Type(() => Screenshot) screenshots: Screenshot[];
  @Expose() @Type(() => Movie) movies?: Movie[];
  @Expose() @Type(() => Recommendations) recommendations?: Recommendations;
  @Expose() @Type(() => Achievements) achievements?: Achievements;
  @Expose() @Type(() => ReleaseDate) release_date: ReleaseDate;
  @Expose() @Type(() => SupportInfo) support_info: SupportInfo;
  @Expose() background: string;
  @Expose() background_raw: string;
  @Expose() @Type(() => ContentDescriptors) content_descriptors: ContentDescriptors;
  @Expose() ratings?: Record<string, any>;
}