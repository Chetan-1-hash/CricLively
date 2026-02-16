package com.CricLively.Entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class Gallery {
    @Id
    private String imageId;
    private String fileName;
    private Integer year;
}
