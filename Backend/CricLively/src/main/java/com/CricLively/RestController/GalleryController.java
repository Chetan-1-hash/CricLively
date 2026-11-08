package com.CricLively.RestController;

import com.CricLively.Entities.Gallery;
import com.CricLively.Repository.GalleryRepository;
import com.CricLively.Service.GalleryService;
import com.CricLively.Service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/gallery")
public class GalleryController {

    private final GalleryService galleryService;
    private final GalleryRepository galleryRepository;
    private final ImageStorageService imageStorageService;

    @PostMapping("/addImages")
    public ResponseEntity<?> addGallery(@RequestParam MultipartFile file, @RequestParam Integer year){
        if(!file.isEmpty()){
            Gallery g = this.galleryService.addImages(file,year);
            return ResponseEntity.ok().body(g);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/addImagesWithId/")
    public ResponseEntity<?> addGallery1(@RequestParam String imageId,@RequestParam Integer year) throws IOException {
        Gallery g = new Gallery();
        g.setImageId(imageId);
        g.setFileName(imageId);
        g.setYear(year);
        this.galleryRepository.save(g);
        return ResponseEntity.ok().body(g);
    }

    @GetMapping("/")
    public ResponseEntity<?> getGallery(){
        List<Gallery> g = this.galleryService.getGallery();
        if(!g.isEmpty()){
            return ResponseEntity.ok().body(g);
        }
        return ResponseEntity.ok().body(this.galleryService.getGallery());
    }

}
