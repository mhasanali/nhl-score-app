/**

 * Mandatory requirements
 * gameId
 * startTime
 * homeTeam (id, name, score)
 * awayTeam (id, name, score)
 * status (scheduled, live, final, etc.)
 * Team records (for Team screen)
 */

export interface Game {
  
  gameId: string;           // startTime_homeId_awayId
  startTime: string;        
  status: GameStatus;
  
  homeTeam: Team;
  
  
  awayTeam: Team;
  
  // Helper field
  participatingTeamIds: number[];  // [awayId, homeId]
  
  // For Team screen requirement:
  preGameStats?: {
    records: {
      [teamAbbr: string]: TeamRecord;
    };
  };
  
  
  _lastUpdated: string;   
  _apiVersion: string;      
  _rawData?: any;   // All the data from the API for debugging etc        
}

export enum GameStatus {
  PREVIEW = 'PREVIEW',
  LIVE = 'LIVE',
  FINAL = 'FINAL',
  POSTPONED = 'POSTPONED',
  CANCELED = 'CANCELED',
  OTHER = 'OTHER'
}

/**
 * Team Record (Wins-Losses-OT)
 */
export interface TeamRecord {
  wins: number;             
  losses: number;          
  ot: number;               
}

export interface Team {
  id: number;
  name: string;
  abbreviation: string; //TOR, DXB etc or Abbreviation -> shortname as per the API
  score: number;
  logo: string | null;
}


