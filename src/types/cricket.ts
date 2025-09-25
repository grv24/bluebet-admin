export interface CricketMarket {
  name: string;
  type: "market";
  expanded: boolean;
  status: "OPEN" | "CLOSED" | "SUSPENDED";
  gmid: number;
  etid: number;
}

export interface CricketMatch {
  name: string;
  type: "match";
  expanded: boolean;
  gmid: number;
  status: "OPEN" | "CLOSED" | "SUSPENDED";
  formattedTime: string;
  children: CricketMarket[];
}

export interface CricketDate {
  name: string;
  type: "date";
  expanded: boolean;
  children: CricketMatch[];
}

export interface CricketCompetition {
  name: string;
  type: "competition";
  expanded: boolean;
  children: CricketDate[];
}

export interface CricketSport {
  name: string;
  type: "sport";
  expanded: boolean;
  children: CricketCompetition[];
}

export interface SportsRoot {
  name: string;
  type: "root";
  expanded: boolean;
  children: CricketSport[];
}

export interface CricketTreeMetadata {
  totalMatches: number;
  totalCompetitions: number;
  structure: string;
}

export interface CricketTreeResponse {
  success: boolean;
  message: string;
  data: SportsRoot;
  metadata: CricketTreeMetadata;
}