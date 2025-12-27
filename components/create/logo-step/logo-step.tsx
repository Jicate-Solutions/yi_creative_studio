'use client'

import { useState } from 'react'
import { useLogos } from '@/hooks'
import { useCreativeStore } from '@/stores/creative-store'
import { LogoSettingsSection } from './logo-settings-section'
import { LogoLibrarySection } from './logo-library-section'
import { LogoCanvasSection } from './logo-canvas-section'
import { LogoPosition, migrateLogoPosition } from '@/lib/config/constants'
import { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'
import { toast } from 'sonner'
import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoPresetSelector } from '../logo-preset-selector'
import { SavePresetDialog } from '../save-preset-dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutGrid, Rows3 } from 'lucide-react'

export function LogoStep() {
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
        applyOptimizedPlacements
    } = useCreativeStore()

    const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [activeTab, setActiveTab] = useState('logo-bar')
    const [openSections, setOpenSections] = useState({
        settings: false,
        library: true
    })

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

    // AI-powered logo position optimization
    const handleAIOptimize = async () => {
        if (formData.logosPlacements.length === 0) {
            toast.error('Add logos first to optimize their positions')
            return
        }

        setIsOptimizing(true)
        try {
            const speakerPhotoConfig = useCreativeStore.getState().formData.designData?.customization?.speakerPhoto

            const response = await fetch('/api/optimize-logo-positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logos: formData.logosPlacements.map(p => ({
                        id: p.logoId,
                        name: p.logo?.name || '',
                        type: p.logoType || 'other',
                    })),
                    formatId: formData.formatId || 'event_poster',
                    useAI: false,
                    currentPlacements: formData.logosPlacements.map(p => ({
                        logoId: p.logoId,
                        position: p.position,
                        size: p.size,
                        backgroundShape: p.backgroundShape,
                        backgroundStyle: p.backgroundStyle,
                    })),
                    speakerPhoto: speakerPhotoConfig,
                }),
            })

            const data = await response.json()

            if (data.success && data.placements) {
                applyOptimizedPlacements(data.placements)
                toast.success(data.reasoning || 'Logos optimized for visual balance')
            } else {
                toast.error(data.error || 'Optimization failed')
            }
        } catch (error) {
            console.error('Logo optimization error:', error)
            toast.error('Failed to optimize logo positions')
        } finally {
            setIsOptimizing(false)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-4">
                <div>
                    <h3 className="text-base font-medium">Logo Layout</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                        Customize your logo arrangement. Use the settings for global styles or click individual logos for fine-tuning.
                    </p>
                </div>

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

                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleAIOptimize}
                        disabled={formData.logosPlacements.length === 0 || isOptimizing}
                        className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 border-0 hover:from-indigo-600 hover:to-purple-700 shadow-sm"
                    >
                        {isOptimizing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">
                            {isOptimizing ? 'Optimizing...' : 'AI Layout'}
                        </span>
                    </Button>
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
                        <TabsList className="w-full justify-start h-12 p-1 bg-muted/20 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-xl mb-4">
                            <TabsTrigger value="logo-bar" className="flex-1 max-w-[200px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
                                <span className="flex items-center gap-2">
                                    <Rows3 className="h-4 w-4" />
                                    Logo Bar & Background
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="position" className="flex-1 max-w-[200px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
                                <span className="flex items-center gap-2">
                                    <LayoutGrid className="h-4 w-4" />
                                    Position
                                </span>
                            </TabsTrigger>
                        </TabsList>

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
