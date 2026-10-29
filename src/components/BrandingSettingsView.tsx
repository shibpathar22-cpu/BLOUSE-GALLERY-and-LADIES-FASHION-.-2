import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Trash2,
  Check,
  RotateCcw,
  Smartphone,
  Eye,
  ShieldAlert,
  Sliders,
  Scissors,
  Image as ImageIcon,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { AppBranding } from '../types';

export const BrandingSettingsView: React.FC = () => {
  const { branding, updateBranding, shopProfile } = useTransactions();
  const { isOwner, currentUser } = useAuth();

  // Local draft state for "Save Changes" and "Cancel Unsaved Changes"
  const [draftBranding, setDraftBranding] = useState<AppBranding>({ ...branding });
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(branding.bannerUrl || null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Sync draft when store branding changes
  useEffect(() => {
    setDraftBranding({ ...branding });
    setLogoPreview(branding.logoUrl || null);
    setBannerPreview(branding.bannerUrl || null);
    setHasChanges(false);
  }, [branding]);

  if (!isOwner) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-xs text-center max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 font-serif-title">Owner Privileges Required</h2>
        <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto">
          App Branding management is restricted to the boutique owner account (<strong>{shopProfile.ownerName}</strong>).
          Staff accounts cannot modify shop logos, banners, or visual styles.
        </p>
        <div className="mt-4 text-xs text-neutral-400">
          Currently logged in as: <span className="font-semibold">{currentUser.name}</span> ({currentUser.role})
        </div>
      </div>
    );
  }

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Logo file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setHasChanges(true);
      setSaveError('');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setSaveError('Banner file size must be less than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBannerPreview(dataUrl);
      setHasChanges(true);
      setSaveError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setHasChanges(true);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRemoveBanner = () => {
    setBannerPreview(null);
    setHasChanges(true);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleCancelChanges = () => {
    setDraftBranding({ ...branding });
    setLogoPreview(branding.logoUrl || null);
    setBannerPreview(branding.bannerUrl || null);
    setHasChanges(false);
    setSaveError('');
  };

  const handleSaveChanges = async () => {
    try {
      setSaveError('');
      // Determine what changed for IndexedDB image writes
      const logoBlobParam =
        logoPreview !== branding.logoUrl ? (logoPreview ? logoPreview : null) : undefined;
      const bannerBlobParam =
        bannerPreview !== branding.bannerUrl ? (bannerPreview ? bannerPreview : null) : undefined;

      await updateBranding(
        {
          bannerPosition: draftBranding.bannerPosition,
          bannerScale: draftBranding.bannerScale,
          bannerOverlayOpacity: draftBranding.bannerOverlayOpacity,
          brandColor: draftBranding.brandColor,
        },
        logoBlobParam,
        bannerBlobParam
      );

      setHasChanges(false);
      setSaveSuccess('Branding preferences and high-resolution images saved securely to IndexedDB.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save branding.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Title & Save Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Storefront Customization</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 font-serif-title">
            App Branding & Mobile Dashboard Customizer
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure boutique logo, header banner, Android mobile positioning, and readability overlays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleCancelChanges}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            disabled={!hasChanges}
            onClick={handleSaveChanges}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              hasChanges
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Save Branding</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Shop Logo Section */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-neutral-900">Boutique Logo</h3>
              </div>
              <span className="text-[11px] text-neutral-400">Displayed in app header & receipts</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Logo Preview Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Boutique Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-500 via-pink-600 to-amber-600 flex items-center justify-center text-white">
                    <Scissors className="w-8 h-8 rotate-45 transform" />
                  </div>
                )}
              </div>

              {/* Logo Upload / Remove Controls */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFile}
                    className="hidden"
                  />

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Recommended: Square PNG/JPEG (at least 200x200 px). Saved in IndexedDB to avoid storage limits.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Header Banner Section */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-neutral-900">Header Banner Image</h3>
              </div>
              <span className="text-[11px] text-neutral-400">Dashboard header background</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{bannerPreview ? 'Change Banner' : 'Upload Banner Image'}</span>
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBannerFile}
                  className="hidden"
                />

                {bannerPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Banner</span>
                  </button>
                )}
              </div>

              {/* Banner Adjustments (Mobile positioning, Zoom, Scrim Opacity) */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3.5 text-xs">
                
                {/* Vertical Position */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Android Mobile Image Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          setDraftBranding((prev) => ({ ...prev, bannerPosition: pos }));
                          setHasChanges(true);
                        }}
                        className={`py-1.5 rounded-lg font-bold capitalize transition-all ${
                          draftBranding.bannerPosition === pos
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Scale / Zoom */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-neutral-600 mb-1">
                    <span>Mobile Screen Scale / Zoom</span>
                    <span className="font-mono">{draftBranding.bannerScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="150"
                    step="5"
                    value={draftBranding.bannerScale}
                    onChange={(e) => {
                      setDraftBranding((prev) => ({
                        ...prev,
                        bannerScale: parseInt(e.target.value, 10),
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                {/* Text Readability Scrim / Dark Overlay Opacity */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-neutral-600 mb-1">
                    <span>Text Readability Scrim (Dark Overlay)</span>
                    <span className="font-mono">
                      {Math.round(draftBranding.bannerOverlayOpacity * 100)}% Opacity
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={draftBranding.bannerOverlayOpacity}
                    onChange={(e) => {
                      setDraftBranding((prev) => ({
                        ...prev,
                        bannerOverlayOpacity: parseFloat(e.target.value),
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Ensures shop name and financial balances remain 100% readable over bright boutique photos.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Live Android Mobile Screen Simulator Preview */}
        <div className="lg:col-span-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-neutral-900">Android Mobile Screen Preview</h3>
              </div>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono">
                App ID: com.blousegallery.ladiesfashion
              </span>
            </div>

            {/* Simulated Android Device Frame */}
            <div className="mx-auto w-[280px] sm:w-[310px] bg-neutral-950 rounded-[36px] p-2.5 shadow-2xl border-4 border-neutral-800">
              
              {/* Speaker & Camera Notch */}
              <div className="w-24 h-4 bg-neutral-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-950" />
              </div>

              {/* Mobile Screen Surface */}
              <div className="bg-[#faf7f5] rounded-[26px] overflow-hidden min-h-[460px] flex flex-col relative text-xs">
                
                {/* Header with Banner and Logo */}
                <div
                  className="relative p-4 text-white overflow-hidden"
                  style={{
                    backgroundColor: '#1f1e24',
                    minHeight: '130px',
                  }}
                >
                  {/* Banner image if present */}
                  {bannerPreview && (
                    <img
                      src={bannerPreview}
                      alt="Banner"
                      className="absolute inset-0 w-full h-full object-cover transition-all"
                      style={{
                        objectPosition: draftBranding.bannerPosition,
                        transform: `scale(${draftBranding.bannerScale / 100})`,
                      }}
                    />
                  )}

                  {/* Scrim overlay for guaranteed text contrast */}
                  <div
                    className="absolute inset-0 transition-opacity"
                    style={{
                      backgroundColor: '#000000',
                      opacity: draftBranding.bannerOverlayOpacity,
                    }}
                  />

                  {/* Header text content */}
                  <div className="relative z-10 flex items-center gap-2.5">
                    {/* Logo */}
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 overflow-hidden flex items-center justify-center shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Scissors className="w-5 h-5 text-white rotate-45 transform" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate font-serif-title drop-shadow-xs">
                        {shopProfile.shopName}
                      </div>
                      <div className="text-[10px] text-rose-200 truncate drop-shadow-2xs">
                        {shopProfile.tagline}
                      </div>
                    </div>
                  </div>

                  {/* Simulated quick stats in header */}
                  <div className="relative z-10 mt-3 pt-2 border-t border-white/20 flex justify-between text-[10px]">
                    <span>Cash Drawer: <strong>₹8,440</strong></span>
                    <span>Online UPI: <strong>₹16,050</strong></span>
                  </div>
                </div>

                {/* Simulated Content Body */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span>Daily Register</span>
                      <span className="text-emerald-600">+₹11,500</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Designer Blouses & Stitching</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span>Shop Expenses</span>
                      <span className="text-rose-600">-₹3,200</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Tailor wages & materials</div>
                  </div>

                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-purple-900 space-y-0.5">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span>Owner Payouts</span>
                      <span>-₹4,000</span>
                    </div>
                    <div className="text-[10px] text-purple-600">Personal drawings</div>
                  </div>
                </div>

                {/* Android Navigation Bar */}
                <div className="h-6 bg-neutral-900/10 flex items-center justify-center">
                  <div className="w-20 h-1 bg-neutral-400 rounded-full" />
                </div>

              </div>

            </div>

            <p className="text-[11px] text-neutral-400 text-center mt-3">
              Preview updates in real-time as you adjust alignment, zoom, and opacity.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
