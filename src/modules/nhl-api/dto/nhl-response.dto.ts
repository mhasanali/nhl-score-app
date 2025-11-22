import { NhlGameDto } from "./nhl-game.dto";

export class NhlResponseDto {
  date: {
    raw: string;      // "2025-11-19"
    pretty: string;   // "Wed Nov 19"
  };
  
  games: NhlGameDto[];
}