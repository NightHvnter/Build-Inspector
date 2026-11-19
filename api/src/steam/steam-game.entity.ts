import { Column, Entity, PrimaryColumn } from 'typeorm';

// What the app keeps about a Steam app, so Steam is asked about it rarely: the card data
// (from IStoreBrowseService/GetItems, many apps per request) and, once someone opens the
// game, its system requirements (from appdetails, one app per request).
@Entity('SteamGame')
export class SteamGameEntity {
  @PrimaryColumn()
  AppId: number;

  // False when Steam doesn't know the id (removed from the store, or never existed).
  @Column({ default: false })
  Found: boolean;

  // Steam's item type: 0 game, 4 DLC, 6 software, …
  @Column({ type: 'smallint', default: -1 })
  Type: number;

  @Column({ length: 255, default: '' })
  Name: string;

  @Column({ length: 400, default: '' })
  Description: string;

  // Steam's community tag ids, the most voted first (names from IStoreService/GetTagList).
  @Column({ type: 'simple-json', nullable: true })
  TagIds: number[] | null;

  // The cover on Steam's CDN: the app loads it from there, nothing is downloaded here.
  @Column({ type: 'varchar', length: 500, default: '' })
  ImageUrl: string;

  // When the card data was last asked for; null when only the requirements are known.
  @Column({ type: 'datetime', nullable: true })
  UpdatedAt: Date | null;

  // appdetails' fields the app reads (name, requirements, platforms), as JSON.
  @Column({ type: 'mediumtext', nullable: true })
  Requirements: string | null;

  @Column({ type: 'datetime', nullable: true })
  RequirementsAt: Date | null;
}
