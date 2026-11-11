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
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Choose a photo to upload"));
        }
        String type = file.getContentType();
        if (type == null || !type.startsWith("image/")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Only image files can be uploaded"));
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "The photo is too big (5 MB at most)"));
        }
        int thisYear = java.time.Year.now().getValue();
        if (year == null || year < 2000 || year > thisYear + 1) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Choose a valid year"));
        }
        Gallery g = this.galleryService.addImages(file, year);
        return ResponseEntity.ok().body(g);
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
