package com.CricLively.RestController;

import com.CricLively.Service.ImageStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageStorageService imageStorageService;

    public ImageController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable String imageId) throws IOException {
        byte[] image = imageStorageService.load(imageId);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // or PNG if you want to detect
                .body(image);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(
            @RequestParam("file") MultipartFile file
    ) {
        String imageId = imageStorageService.store(file);
        return ResponseEntity.ok(imageId); // return GridFS id
    }


}