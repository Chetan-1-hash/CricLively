import { Gallery } from "../components/data/DTO";

export async function addgalleryApi(file: File, year: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", year.toString());

  const response = await fetch(
    "http://localhost:8080/gallery/addImages",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Upload failed!");
  }

  return response.json();
}

export async function getgalleryApi(){
    const response = await fetch(`http://localhost:8080/gallery/`,{
        method:"GET",
        credentials: "include",
        headers: {
      "Accept": "application/json",
    },
    });
    if(!response.ok){
        const text = await response.text();
        throw new Error(text || "Failed to fetch!");
    }

    const images : Gallery[] = JSON.parse(await response.text());
    const imagesUrl = images.map(i => ({
        ...i,
        fileName: `http://localhost:8080/images/${i.imageId}`
    }));
    return imagesUrl;
}