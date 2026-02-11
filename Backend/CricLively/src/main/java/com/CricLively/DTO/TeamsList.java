package com.CricLively.DTO;

import lombok.Data;
import org.springframework.data.annotation.Id;

@Data
public class TeamsList {
    @Id
    private String id;
    private String name;
}
