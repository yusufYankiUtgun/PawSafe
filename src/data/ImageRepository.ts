export class ImageRepository {
  private images: Map<string, string> = new Map();

  save(markerId: string, imageUrl: string): string {
    this.images.set(markerId, imageUrl);
    return imageUrl;
  }

  getByMarkerId(markerId: string): string | undefined {
    return this.images.get(markerId);
  }
}
