package com.CricLively.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Who may score this match - and what the CURRENT person may do. */
@Data
@Builder
public class MatchAccessResponse {
    private boolean canScore;            // may this person score?
    private boolean canManage;           // may this person give / remove scoring access?
    private String ownerId;              // the main organizer (profile id), null for old matches nobody started yet
    private String ownerName;
    private List<Person> scorers;        // organizers the main organizer gave scoring access to
    private List<Person> tournamentOrganizers; // organizers of the tournament (always allowed)

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Person {
        private String profileId;
        private String name;
        private String email;
    }
}
