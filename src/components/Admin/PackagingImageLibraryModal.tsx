import React, { useState, useEffect } from 'react';
import {
  Package,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Layers,
  Wind,
  ShieldCheck,
  Search
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { PackagingAssetRecord, PackagingImageItem, PackagingViewType } from '../../types/packagingAsset';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated?: () => void;
}

export const PackagingImageLibraryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAssetUpdated
}) => {
  const [assets, setAssets] = useState<PackagingAssetRecord[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('MAT-001');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload State
  const [viewType, setViewType] = useState<PackagingViewType>('product');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Packaging Record Form Toggle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newPackageType, setNewPackageType] = useState('');
  const [newComposition, setNewComposition] = useState('');
  const [newCrops, setNewCrops] = useState('');
  const [newVentilation, setNewVentilation] = useState('');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/packaging/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        if (data.assets && data.assets.length > 0 && !selectedAssetId) {
          setSelectedAssetId(data.assets[0].materialId);
        }
      }
    } catch (err) {
      console.error('Failed to load packaging assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAsset = assets.find((a) => a.materialId === selectedAssetId) || assets[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'File exceeds 5MB size limit. Please choose a smaller image.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setStatusMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setStatusMessage({ type: 'error', text: 'Please select an image file to upload.' });
      return;
    }
    if (!currentAsset) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const res = await apiFetch(`/api/packaging/assets/${currentAsset.materialId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewType,
          imageUrl: imagePreview,
          caption: imageCaption || `${viewType} view of ${currentAsset.materialName}`,
          isPrimary
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save image');
      }

      setStatusMessage({ type: 'success', text: `Successfully saved ${viewType} image to ${currentAsset.materialId}!` });
      setImagePreview(null);
      setImageCaption('');
      await loadAssets();
      onAssetUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Image upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName || !newPackageType) {
      setStatusMessage({ type: 'error', text: 'Material name and package type are required.' });
      return;
    }

    setUploading(true);
    try {
      const res = await apiFetch('/api/packaging/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: newMaterialId.trim() || undefined,
          materialName: newMaterialName.trim(),
          packageType: newPackageType.trim(),
          materialComposition: newComposition.trim() || 'Food-grade packaging material',
          realProductImage: imagePreview || '',
          additionalImages: imagePreview ? [{
            id: `img-${Date.now()}`,
            viewType: 'product',
            imageUrl: imagePreview,
            caption: 'Primary product view',
            isPrimary: true
          }] : [],
          dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20, description: 'Standard container' },
          capacity: { maxWeightKg: 15, volumeLiters: 25, description: '15 kg produce payload' },
          ventilationCharacteristics: newVentilation.trim() || 'Continuous convective airflow slots',
          reusableRecyclableProperties: '100% Recyclable',
          costInformation: { unitCostEstimate: '₹40 - ₹60 per unit', tier: 'Balanced', currency: 'INR' },
          scientificProperties: { otr: 'Convective flux', wvtr: 'Vapor venting' },
          compatibleCrops: newCrops ? newCrops.split(',').map(s => s.trim()) : ['General Fresh Produce'],
          foodCategories: ['Fresh Produce'],
          source: 'User Uploaded Packaging Record',
          validationStatus: 'Pending Review'
        })
      });

      if (!res.ok) throw new Error('Failed to create packaging record');
      const data = await res.json();
      
      setStatusMessage({ type: 'success', text: `Created new packaging record ${data.asset.materialId}!` });
      setShowCreateForm(false);
      setNewMaterialId('');
      setNewMaterialName('');
      setNewPackageType('');
      setNewComposition('');
      setNewCrops('');
      setNewVentilation('');
      setImagePreview(null);
      await loadAssets();
      setSelectedAssetId(data.asset.materialId);
      onAssetUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Creation failed' });
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.materialId.toLowerCase().includes(q) ||
      a.materialName.toLowerCase().includes(q) ||
      a.packageType.toLowerCase().includes(q) ||
      a.compatibleCrops.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Packaging Asset Library & Image Management
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload real package photos, manage views (front, inside, side, product), and assign authoritative IDs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Top Actions: Search + Create New Record Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID (MAT-001), material, package type, or compatible crop..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? 'Cancel New Record' : 'Create New Package Record'}</span>
            </button>
          </div>

          {/* Optional Form: Create New Packaging Record */}
          {showCreateForm && (
            <form onSubmit={handleCreateNewRecord} className="p-5 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-mono uppercase text-xs">
                  Create New Authoritative Packaging Record
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Will be assigned MAT-xxx</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Custom ID (optional, e.g. MAT-008):</label>
                  <input
                    type="text"
                    value={newMaterialId}
                    onChange={(e) => setNewMaterialId(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Material Name *:</label>
                  <input
                    type="text"
                    required
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    placeholder="e.g. Rigid Recycled Polypropylene Collapsible Bin"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Package Type *:</label>
                  <input
                    type="text"
                    required
                    value={newPackageType}
                    onChange={(e) => setNewPackageType(e.target.value)}
                    placeholder="e.g. Collapsible Harvest Box"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Material Composition:</label>
                  <input
                    type="text"
                    value={newComposition}
                    onChange={(e) => setNewComposition(e.target.value)}
                    placeholder="e.g. 100% Recycled Food-Grade PP with anti-UV"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Compatible Crops (comma-separated):</label>
                  <input
                    type="text"
                    value={newCrops}
                    onChange={(e) => setNewCrops(e.target.value)}
                    placeholder="e.g. Tomato, Bell Pepper, Grapes"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Ventilation Features:</label>
                  <input
                    type="text"
                    value={newVentilation}
                    onChange={(e) => setNewVentilation(e.target.value)}
                    placeholder="e.g. 28% sidewall airflow aperture with corner chimneys"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          )}

          {/* Record Selection Grid (Horizontal Chips) */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              1. Select Packaging Record:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filteredAssets.map((a) => (
                <button
                  key={a.materialId}
                  type="button"
                  onClick={() => {
                    setSelectedAssetId(a.materialId);
                    setImagePreview(null);
                    setStatusMessage(null);
                  }}
                  className={`p-3 rounded-2xl border text-left shrink-0 w-60 transition cursor-pointer flex items-start gap-3 ${
                    selectedAssetId === a.materialId
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center p-1">
                    <img
                      src={a.realProductImage}
                      alt={a.materialName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 block">
                      {a.materialId}
                    </span>
                    <h5 className="font-bold text-xs truncate text-white">{a.packageType}</h5>
                    <p className="text-[10px] text-slate-400 truncate">{a.materialName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Record Detail & Image Management Stage */}
          {currentAsset && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Left Column (5 cols): Record Details & Existing Images List */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold font-mono text-emerald-400 text-xs">
                      {currentAsset.materialId} Specifications
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentAsset.additionalImages?.length || 1} Images Attached
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p><strong>Package Type:</strong> {currentAsset.packageType}</p>
                    <p><strong>Material:</strong> {currentAsset.materialName}</p>
                    <p><strong>Composition:</strong> {currentAsset.materialComposition}</p>
                    <p><strong>Dimensions:</strong> {currentAsset.dimensions.description}</p>
                    <p><strong>Capacity:</strong> {currentAsset.capacity.description}</p>
                    <p><strong>Ventilation:</strong> {currentAsset.ventilationCharacteristics}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Compatible Crops:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentAsset.compatibleCrops.slice(0, 6).map((c, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                          {c}
                        </span>
                      ))}
                      {currentAsset.compatibleCrops.length > 6 && (
                        <span className="text-[9px] px-1.5 py-0.5 text-slate-500">
                          +{currentAsset.compatibleCrops.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attached Views List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Current Attached Images:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Primary Product Shot */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase">
                        Product View (Primary)
                      </span>
                      <div className="h-24 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                        <img
                          src={currentAsset.realProductImage}
                          alt="Product view"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Inside View if available */}
                    {currentAsset.insidePackageImage && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[9px] font-mono text-cyan-400 font-bold block uppercase">
                          Inside Cavity View
                        </span>
                        <div className="h-24 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                          <img
                            src={currentAsset.insidePackageImage}
                            alt="Inside view"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional image items */}
                    {currentAsset.additionalImages
                      ?.filter((img) => img.viewType !== 'product' && img.imageUrl !== currentAsset.insidePackageImage)
                      .map((img) => (
                        <div key={img.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase">
                            {img.viewType} View
                          </span>
                          <div className="h-24 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                            <img
                              src={img.imageUrl}
                              alt={img.caption || img.viewType}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Upload & Assign Image Form */}
              <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-white uppercase tracking-wide text-xs">
                      2. Upload Image for {currentAsset.materialId}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    PNG, JPG, WebP, SVG (Max 5MB)
                  </span>
                </div>

                <form onSubmit={handleSaveImage} className="space-y-4">
                  {/* Select View Type */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase font-bold">
                      View Type to Assign:
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { type: 'product', label: 'Product View' },
                        { type: 'inside', label: 'Inside View' },
                        { type: 'side', label: 'Side Elevation' },
                        { type: 'front', label: 'Front View' }
                      ].map((v) => (
                        <button
                          key={v.type}
                          type="button"
                          onClick={() => setViewType(v.type as PackagingViewType)}
                          className={`p-2 rounded-xl border font-bold transition cursor-pointer text-[11px] ${
                            viewType === v.type
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* File Selector & Drag-and-Drop Area */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase font-bold">
                      Choose Packaging Image:
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition">
                      <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs text-slate-200 font-bold">
                        Click to select or drag real packaging photo
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Clean studio or field shot on neutral background
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Live Image Preview */}
                  {imagePreview && (
                    <div className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                          Preview for {viewType.toUpperCase()} view:
                        </span>
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="h-44 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                        <img
                          src={imagePreview}
                          alt="Upload preview"
                          className="max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Caption & Primary Checkbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Caption / Description (optional):
                      </label>
                      <input
                        type="text"
                        value={imageCaption}
                        onChange={(e) => setImageCaption(e.target.value)}
                        placeholder={`e.g. Standard ${viewType} view showing vents`}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="isPrimaryCheckbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="isPrimaryCheckbox" className="text-xs text-slate-300 cursor-pointer">
                        Set as primary real product image
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!imagePreview || uploading}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                        !imagePreview || uploading
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving to Library...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Assign Image to {currentAsset.materialId}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authoritative Packaging Library • All images mapped to MAT records</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
