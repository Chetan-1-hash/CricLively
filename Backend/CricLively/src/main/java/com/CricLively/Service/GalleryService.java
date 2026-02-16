package com.CricLively.Service;

import com.CricLively.Entities.Gallery;
import com.CricLively.Repository.GalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final ImageStorageService imageStorageService;

    public Gallery addImages(MultipartFile file, Integer year) {
        Gallery gallery = new Gallery();

        String imageId = this.imageStorageService.store(file);

        gallery.setImageId(imageId);
        gallery.setFileName(file.getOriginalFilename());
        gallery.setYear(year);
        galleryRepository.save(gallery);
        return gallery;
    }

    public List<Gallery> getGallery() {
        return galleryRepository.findAll();
    }

}
