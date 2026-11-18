import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

// One game's place in Steam's daily most-played chart (ISteamChartsService/GetMostPlayedGames).
// Steam only publishes the latest day, so the API saves each day to rank games over a week.
@Entity('SteamChartDay')
@Unique(['Day', 'AppId'])
export class SteamChartDayEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // The chart's day, as YYYY-MM-DD (UTC).
  @Column({ length: 10 })
  Day: string;

  @Column()
  AppId: number;

  // 1 = most played that day.
  @Column({ type: 'smallint' })
  Rank: number;

  // The most players in game at the same time that day.
  @Column()
  PeakPlayers: number;

  @CreateDateColumn()
  created_at: Date;
}
