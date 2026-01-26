'use client'

import { useState, useEffect, useRef } from 'react'
import { useLogos } from '@/hooks'
import { useCreativeStore } from '@/stores/creative-store'
import { LogoSettingsSection } from './logo-settings-section'
import { LogoLibrarySection } from './logo-library-section'
import { LogoCanvasSection } from './logo-canvas-section'
import { LogoPosition, migrateLogoPosition } from '@/lib/config/constants'
import { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'
import { toast } from 'sonner'
import { Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoPresetSelector } from '../logo-preset-selector'
import { SavePresetDialog } from '../save-preset-dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutGrid, Rows3, Layers } from 'lucide-react'
import { EnhancedStripSettings } from './enhanced-strip-settings'
import { EnhancedStripCanvas } from './enhanced-strip-canvas'

/**
 * BACKUP: Original Logo Step with 3 tabs (Appearance, 4-Row Strip, Placement)
 * This is kept for reference in case we need to restore the old tabs.
 *
 * Created: 2026-01-04
 * Reason: Simplifying to only show 4-Row Strip + Logo Library per user request
 */
export function LogoStepBackup() {
    const { logos, isLoading } = useLogos()
    const {
        formData,
        addLogoPlacement,
        removeLogoPlacement,
        clearLogoPlacements,
        updateLogoPosition,
        updateLogoSize,
        updateLogoBackground,
        updateLogoBackgroundStyle,
        setLogoBackgroundColor,
        setLogoStripMode,
        applyOptimizedPlacements,
        initializeDefaultLogoPlacements
    } = useCreativeStore()

    const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('logo-bar')
    const [openSections, setOpenSections] = useState({
        settings: false,
        library: true
    })

    // Track if we've already initialized brand logos for this session
    const hasInitializedRef = useRef(false)

    // Auto-place brand logos (Yi, CII, Bharat Rising) when logos are loaded
    // Yi Brand Guidelines 2025: These logos are CONSTANT for every poster
    useEffect(() => {
        if (logos.length > 0 && !isLoading && !hasInitializedRef.current) {
            initializeDefaultLogoPlacements(logos)
            hasInitializedRef.current = true
        }
    }, [logos, isLoading, initializeDefaultLogoPlacements])

    const placedPositions = formData.logosPlacements.map((p) => migrateLogoPosition(p.position))
    const placedLogoIds = formData.logosPlacements.map((p) => p.logoId)

    const handleLogoSelect = (logoId: string) => {
        if (placedLogoIds.includes(logoId)) {
            setSelectedLogoId(logoId)
        } else if (placedPositions.length >= 18) {
            return
        } else {
            setSelectedLogoId(selectedLogoId === logoId ? null : logoId)
        }
    }

    const getLogoAtPosition = (position: LogoPosition) => {
        return formData.logosPlacements.find((p) => migrateLogoPosition(p.position) === position)
    }

    const handleCellClick = (position: LogoPosition) => {
        if (!selectedLogoId) return

        const existingAtPosition = getLogoAtPosition(position)

        if (existingAtPosition && existingAtPosition.logoId !== selectedLogoId) {
            return
        }

        const existingPlacement = formData.logosPlacements.find(p => p.logoId === selectedLogoId)

        if (existingPlacement) {
            updateLogoPosition(selectedLogoId, position)
        } else {
            addLogoPlacement(selectedLogoId, position)
        }

        setSelectedLogoId(null)
    }



    if (isLoading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-4">
                <div>
                    <h3 className="text-base font-medium">Logo Settings</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                        Choose how your logos appear. Click on any logo to adjust its look.
                    </p>
                </div>


            </div>

            <SavePresetDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />


            <div className="flex flex-col lg:flex-row gap-6 items-stretch h-[calc(100vh-250px)] min-h-[600px]">

                {/* LEFT PANEL: Library (Only visible in Position tab) */}
                {activeTab === 'position' && (
                    <div className="lg:w-[320px] w-full shrink-0 flex flex-col gap-4 overflow-hidden h-full animate-in slide-in-from-left-5 duration-300">
                        <LogoLibrarySection
                            logos={logos}
                            formData={formData}
                            categoryFilter={categoryFilter}
                            setCategoryFilter={setCategoryFilter}
                            selectedLogoId={selectedLogoId}
                            handleLogoSelect={handleLogoSelect}
                            updateLogoSize={updateLogoSize}
                            removeLogoPlacement={removeLogoPlacement}
                            isOpen={openSections.library}
                            setIsOpen={(val) => setOpenSections(prev => ({ ...prev, library: val }))}
                        />
                    </div>
                )}

                {/* RIGHT PANEL: Canvas & Settings */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-y-auto transition-all duration-300">

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <TabsList className="w-fit h-12 p-1 glass-inset border-none rounded-xl overflow-x-auto scrollbar-hide flex-nowrap">
                                <TabsTrigger
                                    value="logo-bar"
                                    className="min-w-[72px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                >
                                    <span className="flex items-center gap-1.5 sm:gap-2">
                                        <Rows3 className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">Appearance</span>
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="4-row"
                                    className="min-w-[72px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                >
                                    <span className="flex items-center gap-1.5 sm:gap-2">
                                        <Layers className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">4-Row Strip</span>
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="position"
                                    className="min-w-[72px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                >
                                    <span className="flex items-center gap-1.5 sm:gap-2">
                                        <LayoutGrid className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">Placement</span>
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <LogoPresetSelector onSaveClick={() => setSaveDialogOpen(true)} />

                                {formData.logosPlacements.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Remove all placed logos?')) {
                                                clearLogoPlacements()
                                            }
                                        }}
                                        className="gap-2 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative">
                            <TabsContent value="logo-bar" className="h-full mt-0 focus-visible:ring-0">
                                <div className="max-w-3xl mx-auto w-full">
                                    <LogoSettingsSection
                                        designData={formData.designData}
                                        stripMode={formData.logoStripMode}
                                        updateLogoStripMode={setLogoStripMode}
                                        logoBackgroundColor={formData.logoBackgroundColor}
                                        setLogoBackgroundColor={setLogoBackgroundColor}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="4-row" className="h-full mt-0 focus-visible:ring-0">
                                <div className="max-w-4xl mx-auto w-full">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Left: Settings Panel */}
                                        <div className="order-2 lg:order-1">
                                            <EnhancedStripSettings />
                                        </div>
                                        {/* Right: Canvas Preview */}
                                        <div className="order-1 lg:order-2 lg:sticky lg:top-0">
                                            <EnhancedStripCanvas />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="position" className="h-full mt-0 focus-visible:ring-0 absolute inset-0 overflow-y-auto overflow-x-hidden pr-2">
                                <LogoCanvasSection
                                    logos={logos}
                                    formData={formData}
                                    selectedLogoId={selectedLogoId}
                                    setSelectedLogoId={setSelectedLogoId}
                                    handleCellClick={handleCellClick}
                                    removeLogoPlacement={removeLogoPlacement}
                                    updateLogoSize={updateLogoSize}
                                    updateLogoBackground={updateLogoBackground}
                                    updateLogoBackgroundStyle={updateLogoBackgroundStyle}
                                    migrateLogoPosition={migrateLogoPosition}
                                    getLogoAtPosition={getLogoAtPosition}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
