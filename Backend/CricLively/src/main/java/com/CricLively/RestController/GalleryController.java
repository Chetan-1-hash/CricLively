package com.CricLively.RestController;

import com.CricLively.Entities.Gallery;
import com.CricLively.Service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/gallery")
public class GalleryController {

    private final GalleryService galleryService;

    @PostMapping("/addImages")
    public ResponseEntity<?> addGallery(MultipartFile file, Integer year){
        if(file.isEmpty()){
            Gallery g = this.galleryService.addImages(file,year);
            return ResponseEntity.ok().body(g);
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/")
    public ResponseEntity<?> getGallery(){
        List<Gallery> g = this.galleryService.getGallery();
        if(!g.isEmpty()){
            return ResponseEntity.ok().body(g);
        }
        return ResponseEntity.badRequest().build();
    }

}
