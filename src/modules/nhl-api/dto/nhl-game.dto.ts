import { NhlTeamDto } from "./nhl-team.dto";

export class NhlGameDto {
  startTime: string;
  
  status: {
    state: string;
  };
  
  teams: {
    away: NhlTeamDto;
    home: NhlTeamDto;
  };
  
  scores: {
    [teamAbbr: string]: number;
  };

  meta?: {  
    overtime?: boolean;
    shootout?: boolean;
}
  
  goals?: any[];
  preGameStats?: any;
  currentStats?: any;
  gameStats?: any;
  links?: any;
}