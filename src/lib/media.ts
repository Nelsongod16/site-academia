export async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Nao foi possivel preparar a imagem.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.84);
}
