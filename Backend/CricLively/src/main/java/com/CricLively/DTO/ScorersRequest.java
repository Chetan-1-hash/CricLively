package com.CricLively.DTO;

import lombok.Data;

import java.util.List;

/** The full list of organizers (profile ids) who may score, besides the main organizer. */
@Data
public class ScorersRequest {
    private List<String> profileIds;
}
