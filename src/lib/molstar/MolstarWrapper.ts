import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Color } from 'molstar/lib/mol-util/color';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Script } from 'molstar/lib/mol-script/script';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export interface LoadParams {
    url: string;
    format?: string;
    isBinary?: boolean;
    assemblyId?: string;
}

export interface ComponentInfo {
    ref: string;
    label: string;
    description: string;
    elementCount: number;
    isVisible: boolean;
    type: string;
}

/**
 * Clean, reusable Molstar wrapper with all proven functionality
 * Extracted from working prototype for production use
 */
export class MolstarWrapper {
    plugin: PluginUIContext | null = null;
    private currentPdbId?: string;

    /**
     * Initialize the Molstar plugin
     */
    async init(target: string | HTMLElement): Promise<PluginUIContext> {
        this.plugin = await createPluginUI({
            target: typeof target === 'string' ? document.getElementById(target)! : target,
            render: renderReact18,
            spec: {
                ...DefaultPluginUISpec(),
                layout: {
                    initial: {
                        isExpanded: false,
                        showControls: true,
                        regionState: {
                            bottom: 'hidden',
                            left: 'hidden',
                            right: 'full',
                            top: 'hidden'
                        }
                    }
                },
                canvas3d: {
                    camera: {
                        helper: {
                            axes: {
                                name: 'off',
                                params: {}
                            }
                        }
                    },
                    renderer: {
                        backgroundColor: Color(0xffffff)
                    }
                },
                components: {
                    remoteState: 'none'
                }
            }
        });

        // Ensure we start in windowed mode, not fullscreen
        if (this.plugin.layout.state.regionState.top === 'full') {
            this.plugin.layout.setProps({
                regionState: {
                    bottom: 'hidden',
                    left: 'hidden',
                    right: 'full',
                    top: 'hidden'
                }
            });
        }

        return this.plugin;
    }

    /**
     * Load structure from URL using proven builders pattern
     */
    async load({ url, format = 'mmcif', isBinary = false, assemblyId = '' }: LoadParams): Promise<void> {
        if (!this.plugin) throw new Error('Plugin not initialized');

        console.log('Loading structure:', url);

        await this.plugin.clear();

        const data = await this.plugin.builders.data.download({ 
            url: Asset.Url(url), 
            isBinary 
        }, { state: { isGhost: true } });

        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'mmcif');
        await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
            structure: assemblyId ? {
                name: 'assembly',
                params: { id: assemblyId }
            } : {
                name: 'model',
                params: {}
            },
            showUnitcell: false,
            representationPreset: 'auto'
        });

        // Reset camera
        PluginCommands.Camera.Reset(this.plugin, {});
    }

    /**
     * Load PDB structure by ID
     */
    async loadPDB(pdbId: string): Promise<void> {
        this.currentPdbId = pdbId;
        const url = `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId}_updated.cif`;
        await this.load({ url, format: 'mmcif', isBinary: false });
    }

    /**
     * Set background color
     */
    setBackground(color: number): void {
        if (!this.plugin) return;
        PluginCommands.Canvas3D.SetSettings(this.plugin, { 
            settings: props => { 
                props.renderer.backgroundColor = Color(color); 
            } 
        });
    }

    /**
     * Toggle spin animation
     */
    toggleSpin(): void {
        if (!this.plugin) return;
        PluginCommands.Canvas3D.SetSettings(this.plugin, {
            settings: props => {
                props.trackball.animate.name = props.trackball.animate.name === 'spin' ? 'off' : 'spin';
            }
        });
    }

    /**
     * Reset camera to default position
     */
    resetCamera(): void {
        if (!this.plugin) return;
        PluginCommands.Camera.Reset(this.plugin, {});
    }

    /**
     * Highlight single residue
     */
    highlightResidue(chainId: string, seqId: number): void {
        if (!this.plugin) return;
        
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
            'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_seq_id(), seqId]),
            'group-by': Q.struct.atomProperty.macromolecular.residueKey()
        }), data);
        
        const loci = StructureSelection.toLociWithSourceUnits(sel);
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
    }

    /**
     * Highlight residue range
     */
    highlightResidueRange(chainId: string, startSeq: number, endSeq: number): void {
        if (!this.plugin) return;
        
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
            'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq]),
            'group-by': Q.struct.atomProperty.macromolecular.residueKey()
        }), data);
        
        const loci = StructureSelection.toLociWithSourceUnits(sel);
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
    }

    /**
     * Clear all highlights
     */
    clearHighlight(): void {
        if (!this.plugin) return;
        this.plugin.managers.interactivity.lociHighlights.clearHighlights();
    }

    /**
     * Focus camera on currently visible structure content
     * TEMPORARILY DISABLED due to persistent 'entity-test' API conflicts
     * Users can manually use Reset button for camera adjustment
     */
    private async focusOnVisibleStructure(): Promise<void> {
        // Method disabled - no auto-focus to prevent API errors
        console.log('📷 Auto-focus disabled - use Reset button for camera adjustment');
        return;
        
        /* DISABLED CODE - keeping for future debugging
        if (!this.plugin) return;
        
        try {
            console.log('📷 Auto-focusing camera on visible structure...');
            
            setTimeout(() => {
                try {
                    if (this.plugin) {
                        this.resetCamera();
                        console.log('✅ Camera focused on visible structure');
                    }
                } catch (error) {
                    console.error('Error in delayed camera reset:', error);
                }
            }, 150);
            
        } catch (error) {
            console.error('Error setting up camera focus:', error);
        }
        */
    }

    /**
     * Get available chains in the structure
     */
    async getAvailableChains(): Promise<string[]> {
        if (!this.plugin) return [];
        
        const structureData = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!structureData) return [];

        const chains = new Set<string>();
        
        // More comprehensive chain discovery for large structures like 7MT0
        for (const unit of structureData.units) {
            if (unit.kind === 0) { // atomic unit
                const model = unit.model;
                if (model?.atomicHierarchy) {
                    const { chainAtomSegments, chains: chainTable } = model.atomicHierarchy;
                    
                    // For large structures, sample elements to find all chains efficiently
                    const sampleSize = Math.min(unit.elements.length, 10000);
                    const step = Math.max(1, Math.floor(unit.elements.length / sampleSize));
                    
                    for (let i = 0; i < unit.elements.length; i += step) {
                        const element = unit.elements[i];
                        const chainIndex = chainAtomSegments.index[element];
                        
                        // Get both label_asym_id and auth_asym_id for completeness
                        const labelAsymId = chainTable.label_asym_id.value(chainIndex);
                        const authAsymId = chainTable.auth_asym_id.value(chainIndex);
                        
                        if (labelAsymId) chains.add(labelAsymId);
                        if (authAsymId && authAsymId !== labelAsymId) chains.add(authAsymId);
                    }
                }
            }
        }
        
        const chainList = Array.from(chains).sort();
        console.log(`🔍 Found ${chainList.length} chains in structure:`, chainList);
        return chainList;
    }

    /**
     * Highlight residues from sequence selection
     * This is the core sequence→structure integration method
     */
    highlightResidues(selections: Array<{chainId: string, startSeq: number, endSeq: number}>): void {
        if (!this.plugin) return;
        
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        if (selections.length === 0) {
            // Clear highlights if no selections
            this.clearHighlight();
            return;
        }

        try {
            // Create selections for each range
            const allSelections = selections.map(({chainId, startSeq, endSeq}) => {
                if (startSeq === endSeq) {
                    // Single residue
                    return Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                        'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq]),
                        'group-by': Q.struct.atomProperty.macromolecular.residueKey()
                    }), data);
                } else {
                    // Residue range
                    return Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                        'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq]),
                        'group-by': Q.struct.atomProperty.macromolecular.residueKey()
                    }), data);
                }
            });

            // Combine all selections into loci
            const allLoci = allSelections.map(sel => StructureSelection.toLociWithSourceUnits(sel));
            
            // Highlight all selections with persistent highlighting
            if (allLoci.length > 0) {
                // Clear any existing highlights first
                this.plugin.managers.interactivity.lociHighlights.clearHighlights();
                
                // Add persistent highlights that won't be cleared by mouse interactions
                allLoci.forEach((loci, index) => {
                    if (loci?.elements && loci.elements.length > 0 && this.plugin) {
                        this.plugin.managers.interactivity.lociHighlights.highlight(
                            { loci },
                            false // Don't clear existing highlights
                        );
                    }
                });
            }
            
        } catch (error) {
            console.error('Error highlighting residues:', error);
        }
    }

    /**
     * Highlight specific residues by chain and residue numbers
     * Convenience method for simple highlighting
     */
    highlightSpecificResidues(chainId: string, residueNumbers: number[]): void {
        if (residueNumbers.length === 0) {
            this.clearHighlight();
            return;
        }

        // Group consecutive residues into ranges for efficiency
        const ranges: Array<{chainId: string, startSeq: number, endSeq: number}> = [];
        residueNumbers.sort((a, b) => a - b);
        
        let rangeStart = residueNumbers[0];
        let rangeEnd = residueNumbers[0];
        
        for (let i = 1; i < residueNumbers.length; i++) {
            if (residueNumbers[i] === rangeEnd + 1) {
                // Consecutive residue, extend range
                rangeEnd = residueNumbers[i];
            } else {
                // Gap found, finish current range and start new one
                ranges.push({chainId, startSeq: rangeStart, endSeq: rangeEnd});
                rangeStart = residueNumbers[i];
                rangeEnd = residueNumbers[i];
            }
        }
        
        // Add the final range
        ranges.push({chainId, startSeq: rangeStart, endSeq: rangeEnd});
        
        // Highlight all ranges
        this.highlightResidues(ranges);
    }

    /**
     * Representation controls - using safe update pattern
     */
    async updateRepresentation(representationType: string): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.warn('No structures available');
                return;
            }

            // SAFE APPROACH: Update existing representations in place
            const update = this.plugin.state.data.build();
            
            for (const structure of hierarchy.structures) {
                for (const component of structure.components) {
                    for (const representation of component.representations) {
                        // Determine coloring scheme based on representation type
                        const colorTheme = (representationType === 'ball-and-stick' || representationType === 'spacefill') 
                            ? 'element-symbol' 
                            : 'chain-id';
                            
                        // Update the representation type in place
                        update.to(representation.cell.transform.ref).update({
                            type: { name: representationType, params: {} },
                            colorTheme: { name: colorTheme, params: {} },
                            sizeTheme: { name: 'uniform', params: { value: 1 } },
                        });
                    }
                }
            }
            
            await update.commit();
            
        } catch (error) {
            console.error('Error updating representation:', error);
            
            // Fallback to full rebuild if update fails
            try {
                const hierarchy = this.plugin.managers.structure.hierarchy.current;
                const update = this.plugin.state.data.build();
                
                // Remove existing representations
                for (const structure of hierarchy.structures) {
                    for (const component of structure.components) {
                        for (const representation of component.representations) {
                            update.delete(representation.cell.transform.ref);
                        }
                    }
                }
                
                await update.commit();
                
                // Add new representation
                const newUpdate = this.plugin.state.data.build();
                for (const structure of hierarchy.structures) {
                    for (const component of structure.components) {
                        const colorTheme = (representationType === 'ball-and-stick' || representationType === 'spacefill') 
                            ? 'element-symbol' 
                            : 'chain-id';
                            
                        newUpdate.to(component.cell).update((old: any) => ({
                            ...old,
                            type: { name: representationType, params: {} },
                            colorTheme: { name: colorTheme, params: {} },
                            sizeTheme: { name: 'uniform', params: { value: 1 } }
                        }));
                    }
                }
                
                await newUpdate.commit();
                
            } catch (fallbackError) {
                console.error('Both safe and fallback representation change failed:', fallbackError);
            }
        }
    }

    async setCartoon(): Promise<void> { 
        return this.updateRepresentation('cartoon'); 
    }
    
    async setSurface(): Promise<void> { 
        return this.updateRepresentation('molecular-surface'); 
    }
    
    async setBallAndStick(): Promise<void> { 
        return this.updateRepresentation('ball-and-stick'); 
    }
    
    async setSpacefill(): Promise<void> { 
        return this.updateRepresentation('spacefill'); 
    }

    /**
     * Chain operations - using working modifyByCurrentSelection pattern
     */
    async hideChain(chainId: string): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) return;

            const hideSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId])
            }), data);

            const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
            this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
            
            const allComponents = hierarchy.structures.flatMap(s => s.components);
            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
            
            this.plugin.managers.structure.selection.clear();
            
        } catch (error) {
            console.error('Error hiding chain:', error);
        }
    }

    async isolateChain(chainId: string): Promise<void> {
        if (!this.plugin) return;
        
        try {
            console.log(`🎯 Isolating chain: "${chainId}"`);
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) return;

            // Get all available chains to debug
            const allChains = await this.getAvailableChains();
            console.log(`📋 All chains found:`, allChains);
            console.log(`🎯 Target chain to keep: "${chainId}"`);
            
            const chainsToHide = allChains.filter(id => id !== chainId);
            console.log(`🚫 Chains to hide:`, chainsToHide);

            if (chainsToHide.length === 0) {
                console.log('⚠️ No chains to hide - only one chain in structure');
                return;
            }

            // Hide chains one by one - this approach actually works better for complex structures
            for (const hideChainId of chainsToHide) {
                console.log(`🚫 Hiding chain: "${hideChainId}"`);
                
                const hideSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                    'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), hideChainId])
                }), data);

                const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
                
                if (hideLoci && hideLoci.elements && hideLoci.elements.length > 0) {
                    this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
                    const allComponents = hierarchy.structures.flatMap(s => s.components);
                    await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                    this.plugin.managers.structure.selection.clear();
                    console.log(`✅ Successfully hid chain: "${hideChainId}"`);
                } else {
                    console.log(`⚠️ No atoms found for chain: "${hideChainId}"`);
                }
            }
            
            console.log(`✅ Isolation complete - only chain "${chainId}" should be visible`);
            
            // Note: Auto-focus temporarily disabled due to API conflicts
            // Users can manually reset camera using the Reset button if needed
            
        } catch (error) {
            console.error('Error isolating chain:', error);
        }
    }

    async showAllChains(): Promise<void> {
        if (!this.plugin) return;
        
        try {
            if (this.currentPdbId) {
                await this.loadPDB(this.currentPdbId);
            }
        } catch (error) {
            console.error('Error showing all chains:', error);
        }
    }


    /**
     * Residue-level operations
     */
    async hideResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) return;

            // Create selection for the residue range to hide
            const hideSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq])
            }), data);

            const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
            
            if (!hideLoci || hideLoci.elements.length === 0) return;

            // Set selection and hide using modifyByCurrentSelection
            this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
            const allComponents = hierarchy.structures.flatMap(s => s.components);
            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
            this.plugin.managers.structure.selection.clear();
            
        } catch (error) {
            console.error('Error hiding residue range:', error);
        }
    }

    async isolateResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) return;

            // Get all available chains
            const allChains = await this.getAvailableChains();
            
            // Hide everything EXCEPT the target residue range
            for (const currentChain of allChains) {
                if (currentChain !== chainId) {
                    // Hide entire other chains
                    const hideChainSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), currentChain])
                    }), data);

                    const hideChainLoci = StructureSelection.toLociWithSourceUnits(hideChainSelection);
                    
                    if (hideChainLoci && hideChainLoci.elements.length > 0) {
                        this.plugin.managers.structure.selection.fromLoci('set', hideChainLoci);
                        const allComponents = hierarchy.structures.flatMap(s => s.components);
                        await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                        this.plugin.managers.structure.selection.clear();
                    }
                } else {
                    // For the target chain, hide residues before startSeq
                    if (startSeq > 1) {
                        const hideBeforeSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                            'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), 1, startSeq - 1])
                        }), data);

                        const hideBeforeLoci = StructureSelection.toLociWithSourceUnits(hideBeforeSelection);
                        
                        if (hideBeforeLoci && hideBeforeLoci.elements.length > 0) {
                            this.plugin.managers.structure.selection.fromLoci('set', hideBeforeLoci);
                            const allComponents = hierarchy.structures.flatMap(s => s.components);
                            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                            this.plugin.managers.structure.selection.clear();
                        }
                    }

                    // For the target chain, hide residues after endSeq
                    // Use a reasonable upper bound (most proteins don't exceed 10000 residues)
                    const maxResidue = 10000;
                    
                    if (endSeq < maxResidue) {
                        const hideAfterSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                            'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), endSeq + 1, maxResidue])
                        }), data);

                        const hideAfterLoci = StructureSelection.toLociWithSourceUnits(hideAfterSelection);
                        
                        if (hideAfterLoci && hideAfterLoci.elements.length > 0) {
                            this.plugin.managers.structure.selection.fromLoci('set', hideAfterLoci);
                            const allComponents = hierarchy.structures.flatMap(s => s.components);
                            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                            this.plugin.managers.structure.selection.clear();
                        }
                    }
                }
            }
            
            // Note: Auto-focus disabled for residue range isolation due to API conflicts
            // Users can manually reset camera if needed using the Reset button
            console.log('✅ Residue range isolation complete');
            
        } catch (error) {
            console.error('Error isolating residue range:', error);
        }
    }

    async showResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (!data) return;

            // Create selection for the residue range to highlight
            const selection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
                'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq]),
                'group-by': Q.struct.atomProperty.macromolecular.residueKey()
            }), data);
            
            const loci = StructureSelection.toLociWithSourceUnits(selection);
            
            // Use highlighting for visual emphasis (non-destructive)
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
            
        } catch (error) {
            console.error('Error highlighting residue range:', error);
        }
    }

    /**
     * Component removal operations
     */
    async removeWater(): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) return;

            const data = structure.cell.obj.data;

            // Create selection for water molecules (HOH, WAT, etc.)
            const waterSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'residue-test': Q.core.logic.or([
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'HOH']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'WAT']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'H2O'])
                ])
            }), data);

            const waterLoci = StructureSelection.toLociWithSourceUnits(waterSelection);
            
            if (waterLoci && waterLoci.elements.length > 0) {
                this.plugin.managers.structure.selection.fromLoci('set', waterLoci);
                const allComponents = hierarchy.structures.flatMap(s => s.components);
                await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                this.plugin.managers.structure.selection.clear();
            }
            
        } catch (error) {
            console.error('Error removing water:', error);
        }
    }

    async removeLigands(): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) return;

            const data = structure.cell.obj.data;

            // Create selection for common ligands
            const ligandSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'residue-test': Q.core.logic.or([
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'HEM']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'ATP']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'ADP']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'GTP']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'GDP']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'NAD']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'FAD'])
                ])
            }), data);

            const ligandLoci = StructureSelection.toLociWithSourceUnits(ligandSelection);
            
            if (ligandLoci && ligandLoci.elements.length > 0) {
                this.plugin.managers.structure.selection.fromLoci('set', ligandLoci);
                const allComponents = hierarchy.structures.flatMap(s => s.components);
                await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                this.plugin.managers.structure.selection.clear();
            }
            
        } catch (error) {
            console.error('Error removing ligands:', error);
        }
    }

    async removeIons(): Promise<void> {
        if (!this.plugin) return;
        
        try {
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) return;

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) return;

            const data = structure.cell.obj.data;

            // Create selection for common ions
            const ionSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
                'residue-test': Q.core.logic.or([
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'CA']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'MG']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'ZN']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'FE']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'NA']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'CL']),
                    Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'K'])
                ])
            }), data);

            const ionLoci = StructureSelection.toLociWithSourceUnits(ionSelection);
            
            if (ionLoci && ionLoci.elements.length > 0) {
                this.plugin.managers.structure.selection.fromLoci('set', ionLoci);
                const allComponents = hierarchy.structures.flatMap(s => s.components);
                await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                this.plugin.managers.structure.selection.clear();
            }
            
        } catch (error) {
            console.error('Error removing ions:', error);
        }
    }

    /**
     * Destroy the plugin and clean up resources
     */
    destroy(): void {
        if (this.plugin) {
            this.plugin.dispose();
            this.plugin = null;
        }
    }
}
