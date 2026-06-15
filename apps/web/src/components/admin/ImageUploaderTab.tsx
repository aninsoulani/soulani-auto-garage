'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Swal from 'sweetalert2';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ImageUploaderTab({ vehicleId, initialImages = [] }: { vehicleId: string, initialImages: any[] }) {
  const [images, setImages] = useState(
    [...initialImages].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  );
  const [uploading, setUploading] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const { accessToken } = useAuthStore();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/vehicles/${vehicleId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });
      
      if(!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }
      
      const responseJson = await res.json();
      const newImages = Array.isArray(responseJson.data) ? responseJson.data : [responseJson.data];

      setImages([...images, ...newImages]);
      Swal.fire({ title: 'Success', text: `${newImages.length} image(s) uploaded successfully!`, icon: 'success', timer: 1500, showConfirmButton: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const getBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    return apiUrl.replace('/api/v1', '');
  };

  const removeImage = async (imageId: number) => {
    const result = await Swal.fire({
      title: 'Delete this image?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/vehicles/${vehicleId}/images/${imageId}`, {
        method: 'DELETE',
        token: accessToken || undefined
      });
      setImages(images.filter(img => img.id !== imageId));
      Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch(err: any) { Swal.fire('Error', err.message, 'error'); }
  }

  const handleDragStart = (e: React.DragEvent, imageId: number) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetImageId: number) => {
    e.preventDefault();
    if (draggedImageId === null || draggedImageId === targetImageId) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImageId);
    const targetIndex = images.findIndex(img => img.id === targetImageId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    // Update sortOrder locally
    const updatedImages = newImages.map((img, index) => ({ ...img, sortOrder: index }));
    setImages(updatedImages);
    setDraggedImageId(null);

    // Persist order
    try {
      await apiFetch(`/vehicles/${vehicleId}/images/reorder`, {
        method: 'PATCH',
        token: accessToken || undefined,
        body: JSON.stringify({ imageIds: updatedImages.map(img => img.id) })
      });
    } catch (err: any) {
      Swal.fire('Error', 'Failed to save new image order: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col justify-center items-center gap-2">
        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          {uploading ? 'Uploading...' : 'Upload Image (Max 5MB)'}
          <input type="file" multiple accept="image/png, image/jpeg, image/webp, image/jfif" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <span className="text-xs text-gray-500">JPG, PNG, WebP, and JFIF are supported.</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div 
            key={img.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, img.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, img.id)}
            className={`border rounded relative group overflow-hidden bg-gray-100 flex flex-col cursor-move transition ${draggedImageId === img.id ? 'opacity-50 border-blue-500 border-2' : ''}`}
          >
            <div className="relative">
              <img src={`${getBaseUrl()}${img.fileUrl}`} className="w-full h-32 object-cover pointer-events-none" alt="Vehicle" />
              {index === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Primary</span>}
            </div>
            <div className="bg-white p-2 flex justify-end items-center border-t gap-2">
              <button type="button" onClick={() => removeImage(img.id)} className="text-red-600 font-medium text-xs hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
