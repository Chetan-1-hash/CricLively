package com.CricLively.Service;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
public class ImageStorageService {

    private final GridFsTemplate gridFsTemplate;

    public ImageStorageService(GridFsTemplate gridFsTemplate) {
        this.gridFsTemplate = gridFsTemplate;
    }

    public String store(MultipartFile file) {
        try {
            ObjectId id = gridFsTemplate.store(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    file.getContentType()
            );
            return id.toHexString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image", e);
        }
    }

    public byte[] load(String imageId) throws IOException {

        GridFSFile file = gridFsTemplate.findOne(
                new Query(Criteria.where("_id").is(new ObjectId(imageId)))
        );

        if (file == null) {
            throw new RuntimeException("Image not found");
        }

        GridFsResource resource = gridFsTemplate.getResource(file);

        try (InputStream is = resource.getInputStream()) {
            return is.readAllBytes();
        }
    }
}
