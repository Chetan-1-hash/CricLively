import { API_URL } from "./client";
import { Gallery } from "../components/data/DTO";

export async function addgalleryApi(file: File, year: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", year.toString());

  const response = await fetch(
    `${API_URL}/gallery/addImages`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try { message = JSON.parse(text).message ?? text; } catch { /* plain text */ }
    throw new Error(message || "Upload failed!");
  }

  return response.json();
}

export async function getgalleryApi(){
    const response = await fetch(`${API_URL}/gallery/`,{
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
        fileName: `${API_URL}/images/${i.imageId}`
    }));
    return imagesUrl;
}