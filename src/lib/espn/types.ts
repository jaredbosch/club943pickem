export type EspnStatusName =
  | "STATUS_SCHEDULED"
  | "STATUS_IN_PROGRESS"
  | "STATUS_HALFTIME"
  | "STATUS_END_PERIOD"
  | "STATUS_FINAL"
  | "STATUS_FINAL_OVERTIME"
  | string;

export type EspnCompetitor = {
  homeAway: "home" | "away";
  score?: string;
  team: {
    abbreviation: string;
  };
};

export type EspnEvent = {
  id: string;
  competitions: Array<{
    status: {
      type: {
        name: EspnStatusName;
        state: "pre" | "in" | "post";
        completed: boolean;
      };
    };
    competitors: EspnCompetitor[];
  }>;
};

export type EspnScoreboard = {
  events?: EspnEvent[];
};
