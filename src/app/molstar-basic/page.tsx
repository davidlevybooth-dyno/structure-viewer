/**
 * Basic Molstar wrapper based on official examples/basic-wrapper
 * This should work without the URL parsing issues
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Script } from 'molstar/lib/mol-script/script';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { EmptyLoci } from 'molstar/lib/mol-model/loci';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';

type LoadParams = { 
    url: string, 
    format?: BuiltInTrajectoryFormat, 
    isBinary?: boolean, 
    assemblyId?: string 
}

class BasicMolstarWrapper {
    plugin!: PluginUIContext;

    async init(target: string | HTMLElement) {
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
                    controls: {
                        enableFullscreen: false
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

    async load({ url, format = 'mmcif', isBinary = false, assemblyId = '' }: LoadParams) {
        console.log('=== LOADING STRUCTURE ===');
        console.log('URL:', url);
        console.log('Format:', format);
        console.log('Binary:', isBinary);
        console.log('Assembly ID:', assemblyId);

        await this.plugin.clear();

        console.log('Step 1: Downloading data...');
        const data = await this.plugin.builders.data.download({ 
            url: Asset.Url(url), 
            isBinary 
        }, { state: { isGhost: true } });

        console.log('Step 2: Parsing trajectory...');
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);

        console.log('Step 3: Applying preset...');
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

        console.log('✅ Structure loaded successfully');
    }

    async loadPDB(pdbId: string) {
        this.currentPdbId = pdbId;
        const url = `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId}_updated.cif`;
        await this.load({ url, format: 'mmcif', isBinary: false });
    }

    setBackground(color: number) {
        PluginCommands.Canvas3D.SetSettings(this.plugin, { 
            settings: props => { 
                props.renderer.backgroundColor = Color(color); 
            } 
        });
    }

    toggleSpin() {
        if (!this.plugin.canvas3d) return;

        const trackball = this.plugin.canvas3d.props.trackball;
        PluginCommands.Canvas3D.SetSettings(this.plugin, {
            settings: {
                trackball: {
                    ...trackball,
                    animate: trackball.animate.name === 'spin'
                        ? { name: 'off', params: {} }
                        : { name: 'spin', params: { speed: 1 } }
                }
            }
        });
        if (this.plugin.canvas3d.props.trackball.animate.name !== 'spin') {
            PluginCommands.Camera.Reset(this.plugin, {});
        }
    }

    // Highlighting functions
    highlightResidue(seqId: number) {
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
            'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), seqId]),
            'group-by': Q.struct.atomProperty.macromolecular.residueKey()
        }), data);
        const loci = StructureSelection.toLociWithSourceUnits(sel);
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
    }

    highlightResidueRange(chainId: string, startSeq: number, endSeq: number) {
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        // Use the correct MolScript API for range selection
        const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId]),
            'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq]),
            'group-by': Q.struct.atomProperty.macromolecular.residueKey()
        }), data);
        const loci = StructureSelection.toLociWithSourceUnits(sel);
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
    }

    clearHighlight() {
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci: EmptyLoci });
    }

    resetCamera() {
        PluginCommands.Camera.Reset(this.plugin, {});
    }

    // Residue range operations
    async hideResidueRange(chainId: string, startSeq: number, endSeq: number) {
        try {
            console.log(`🙈 Hiding residues ${startSeq}-${endSeq} from chain ${chainId}...`);
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.warn('No structures found in hierarchy');
                return;
            }

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) {
                console.warn('No structure data found');
                return;
            }

            // Create selection for the residue range we want to hide
            const hideSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), chainId]),
                'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq])
            }), data);

            // Convert to loci
            const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
            
            if (hideLoci.isEmpty) {
                console.log(`❌ No atoms found for residues ${startSeq}-${endSeq} in chain ${chainId}`);
                return;
            }

            // Set this as the current selection (what we want to hide)
            this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
            
            // Get all components and subtract the selection
            const allComponents = hierarchy.structures.flatMap(s => s.components);
            console.log(`🧬 Found ${allComponents.length} components to process`);
            
            // Use modifyByCurrentSelection to hide the selected residues
            const result = await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
            console.log(`🧬 Hide residue range result:`, result);
            
            // Clear the selection
            this.plugin.managers.structure.selection.clear();
            
            console.log(`✅ Residues ${startSeq}-${endSeq} from chain ${chainId} hidden successfully`);
            
        } catch (error) {
            console.error('Error hiding residue range:', error);
        }
    }

    async isolateResidueRange(chainId: string, startSeq: number, endSeq: number) {
        try {
            console.log(`🔍 Isolating residues ${startSeq}-${endSeq} from chain ${chainId}...`);
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.warn('No structures found in hierarchy');
                return;
            }

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) {
                console.warn('No structure data found');
                return;
            }

            // Strategy: Hide everything EXCEPT the target residue range
            // This will use the same working pattern as hideResidueRange but inverted

            // First, get all available chains to work with
            const allChains = await this.getAvailableChains();
            
            // For each chain, we need to hide:
            // 1. All other chains completely
            // 2. For the target chain, hide residues outside the range
            
            for (const currentChain of allChains) {
                if (currentChain !== chainId) {
                    // Hide entire other chains
                    const hideChainSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), currentChain])
                    }), data);

                    const hideChainLoci = StructureSelection.toLociWithSourceUnits(hideChainSelection);
                    
                    if (!hideChainLoci.isEmpty) {
                        this.plugin.managers.structure.selection.fromLoci('set', hideChainLoci);
                        const allComponents = hierarchy.structures.flatMap(s => s.components);
                        await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                        this.plugin.managers.structure.selection.clear();
                    }
                } else {
                    // For the target chain, hide residues before startSeq
                    if (startSeq > 1) {
                        const hideBeforeSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), chainId]),
                            'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), 1, startSeq - 1])
                        }), data);

                        const hideBeforeLoci = StructureSelection.toLociWithSourceUnits(hideBeforeSelection);
                        
                        if (!hideBeforeLoci.isEmpty) {
                            this.plugin.managers.structure.selection.fromLoci('set', hideBeforeLoci);
                            const allComponents = hierarchy.structures.flatMap(s => s.components);
                            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                            this.plugin.managers.structure.selection.clear();
                        }
                    }

                    // Hide residues after endSeq (assuming max residue around 1000)
                    const hideAfterSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), chainId]),
                        'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), endSeq + 1, 9999])
                    }), data);

                    const hideAfterLoci = StructureSelection.toLociWithSourceUnits(hideAfterSelection);
                    
                    if (!hideAfterLoci.isEmpty) {
                        this.plugin.managers.structure.selection.fromLoci('set', hideAfterLoci);
                        const allComponents = hierarchy.structures.flatMap(s => s.components);
                        await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                        this.plugin.managers.structure.selection.clear();
                    }
                }
            }
            
            console.log(`✅ Residues ${startSeq}-${endSeq} from chain ${chainId} isolated using subtraction method`);
            
        } catch (error) {
            console.error('Error isolating residue range:', error);
        }
    }

    async showResidueRange(chainId: string, startSeq: number, endSeq: number) {
        try {
            console.log(`👁️ Highlighting residues ${startSeq}-${endSeq} from chain ${chainId}...`);
            
            const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
            if (!data) return;

            // Create selection for the residue range
            const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), chainId]),
                'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), startSeq, endSeq]),
                'group-by': Q.struct.atomProperty.macromolecular.residueKey()
            }), data);
            
            const loci = StructureSelection.toLociWithSourceUnits(sel);
            
            // Use highlighting instead of focus for just showing/emphasizing
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
            
            console.log(`✅ Residues ${startSeq}-${endSeq} from chain ${chainId} highlighted`);
            
        } catch (error) {
            console.error('Error highlighting residue range:', error);
        }
    }

    // Chain operations - using working modifyByCurrentSelection pattern
    async hideChain(chainId: string) {
        try {
            console.log(`🙈 Hiding chain ${chainId}...`);
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.warn('No structures found in hierarchy');
                return;
            }

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) {
                console.warn('No structure data found');
                return;
            }

            // Create selection for the chain we want to hide
            const hideSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), chainId])
            }), data);

            // Convert to loci
            const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
            
            // Set this as the current selection (what we want to hide)
            this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
            
            // Get all components and subtract the selection (hide the selected chain)
            const allComponents = hierarchy.structures.flatMap(s => s.components);
            console.log(`🧬 Found ${allComponents.length} components to process`);
            
            // Use modifyByCurrentSelection to hide the selected chain
            const result = await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
            console.log(`🧬 Hide chain result:`, result);
            
            // Clear the selection
            this.plugin.managers.structure.selection.clear();
            
            console.log(`✅ Chain ${chainId} hidden successfully`);
            
        } catch (error) {
            console.error('Error hiding chain:', error);
        }
    }

    async isolateChain(chainId: string) {
        try {
            console.log(`🔍 Isolating chain ${chainId}...`);
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.warn('No structures found in hierarchy');
                return;
            }

            const structure = hierarchy.structures[0];
            const data = structure.cell?.obj?.data;
            if (!data) {
                console.warn('No structure data found');
                return;
            }

            // Get all available chains
            const allChains = await this.getAvailableChains();
            const chainsToHide = allChains.filter(chain => chain !== chainId);
            
            if (chainsToHide.length === 0) {
                console.log('Only one chain available, nothing to isolate');
                return;
            }

            // Hide all chains except the target one
            for (const hideChainId of chainsToHide) {
                const hideSelection = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                    'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_asym_id(), hideChainId])
                }), data);

                const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
                this.plugin.managers.structure.selection.fromLoci('set', hideLoci);
                
                const allComponents = hierarchy.structures.flatMap(s => s.components);
                await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
                
                this.plugin.managers.structure.selection.clear();
            }
            
            console.log(`✅ Chain ${chainId} isolated (hidden chains: ${chainsToHide.join(', ')})`);
            
        } catch (error) {
            console.error('Error isolating chain:', error);
        }
    }

    async showAllChains() {
        try {
            console.log('👁️ Showing all chains...');
            
            // The easiest way to show all chains is to reload the structure
            if (this.currentPdbId) {
                await this.loadPDB(this.currentPdbId);
                console.log('✅ All chains restored by reloading structure');
            } else {
                console.warn('No current PDB ID to reload');
            }
            
        } catch (error) {
            console.error('Error showing all chains:', error);
        }
    }

    // Get available chains for debugging
    async getAvailableChains(): Promise<string[]> {
        const structureData = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!structureData) return [];

        const chains = new Set<string>();
        
        // Iterate through units to find chains using correct Mol* API
        for (const unit of structureData.units) {
            if (unit.kind === 0) { // atomic unit
                const model = unit.model;
                if (model?.atomicHierarchy && unit.elements.length > 0) {
                    const { chainAtomSegments, chains: chainTable } = model.atomicHierarchy;
                    const firstElement = unit.elements[0];
                    const chainIndex = chainAtomSegments.index[firstElement];
                    const asymId = chainTable.label_asym_id.value(chainIndex);
                    if (asymId) chains.add(asymId);
                }
            }
        }
        
        const chainList = Array.from(chains).sort();
        console.log('🔍 Available chains:', chainList);
        return chainList;
    }

    // Component discovery and management
    async discoverComponents(): Promise<Array<{
        ref: string;
        label: string;
        description: string;
        elementCount: number;
        isVisible: boolean;
        type: string;
    }>> {
        const hierarchy = this.plugin.managers.structure.hierarchy.current;
        if (!hierarchy.structures.length) return [];

        const discoveredComponents: Array<{
            ref: string;
            label: string;
            description: string;
            elementCount: number;
            isVisible: boolean;
            type: string;
        }> = [];

        for (const structure of hierarchy.structures) {
            for (const component of structure.components) {
                // Get the correct ref from the component
                let componentRef = component.cell?.transform?.ref;
                
                if (component.cell?.obj) {
                    const node = componentRef ? this.plugin.state.data.select(componentRef)[0] : null;
                    const isVisible = !node?.state?.isHidden;
                    
                    const label = component.cell.obj.label || 'Unknown';
                    const description = component.cell.obj.description || '';
                    const elementCount = component.cell.obj.data?.elementCount || 0;
                    
                    // Categorize component type based on label
                    let type = 'other';
                    const lowerLabel = label.toLowerCase();
                    if (lowerLabel.includes('water')) type = 'water';
                    else if (lowerLabel.includes('ligand')) type = 'ligand';
                    else if (lowerLabel.includes('ion')) type = 'ion';
                    else if (lowerLabel.includes('polymer')) type = 'polymer';
                    else if (lowerLabel.includes('assembly')) type = 'assembly';
                    
                    discoveredComponents.push({
                        ref: componentRef || `missing-ref-${discoveredComponents.length}`,
                        label,
                        description,
                        elementCount,
                        isVisible,
                        type
                    });
                }
            }
        }

        console.log('🔍 Discovered components:', discoveredComponents);
        return discoveredComponents;
    }

    // Remove water molecules using selection + subtraction method
    async removeWater() {
        try {
            console.log('💧 Removing water molecules...');
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.log('❌ No structures found');
                return;
            }

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) {
                console.log('❌ No structure data found');
                return;
            }

            // Build a selection for water molecules (HOH residues)
            const waterExpression = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                'residue-test': Q.core.rel.eq([
                    Q.struct.atomProperty.macromolecular.label_comp_id(), 'HOH'
                ])
            }), structure.cell.obj.data);

            // Convert selection to loci
            const waterLoci = StructureSelection.toLociWithSourceUnits(waterExpression);
            
            if (waterLoci.isEmpty) {
                console.log('❌ No water molecules found in structure');
                return;
            }

            console.log('✅ Found water molecules, removing...');
            
            // Add water loci to current selection
            this.plugin.managers.structure.selection.fromLoci('set', waterLoci);
            
            // Get components with selection and subtract the selected parts
            const sel = this.plugin.managers.structure.hierarchy.getStructuresWithSelection();
            const componentsToModify: any[] = [];
            
            for (const s of sel) {
                componentsToModify.push(...s.components);
            }
            
            if (componentsToModify.length > 0) {
                console.log(`✅ Subtracting water from ${componentsToModify.length} components...`);
                await this.plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
                console.log('✅ Water molecules removed successfully!');
            } else {
                console.log('❌ No components found to modify');
            }
            
            // Clear selection
            this.plugin.managers.structure.selection.clear();
            
        } catch (error) {
            console.error('Failed to remove water:', error);
        }
    }

    // Remove ligands (e.g., HEM for hemoglobin)
    async removeLigands() {
        try {
            console.log('🧪 Removing ligand molecules...');
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.log('❌ No structures found');
                return;
            }

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) {
                console.log('❌ No structure data found');
                return;
            }

            // Common ligand types to remove
            const ligandTypes = ['HEM', 'NAD', 'ATP', 'GTP', 'FAD', 'FMN'];
            let removedAny = false;

            for (const ligandType of ligandTypes) {
                // Build a selection for this ligand type
                const ligandExpression = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                    'residue-test': Q.core.rel.eq([
                        Q.struct.atomProperty.macromolecular.label_comp_id(), ligandType
                    ])
                }), structure.cell.obj.data);

                // Convert selection to loci
                const ligandLoci = StructureSelection.toLociWithSourceUnits(ligandExpression);
                
                if (!ligandLoci.isEmpty) {
                    console.log(`✅ Found ${ligandType} ligands, removing...`);
                    
                    // Add ligand loci to current selection
                    this.plugin.managers.structure.selection.fromLoci('set', ligandLoci);
                    
                    // Get components with selection and subtract the selected parts
                    const sel = this.plugin.managers.structure.hierarchy.getStructuresWithSelection();
                    const componentsToModify: any[] = [];
                    
                    for (const s of sel) {
                        componentsToModify.push(...s.components);
                    }
                    
                    if (componentsToModify.length > 0) {
                        await this.plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
                        removedAny = true;
                    }
                    
                    // Clear selection for next ligand
                    this.plugin.managers.structure.selection.clear();
                }
            }

            if (removedAny) {
                console.log('✅ Ligand molecules removed successfully!');
            } else {
                console.log('❌ No common ligands found in structure');
            }
            
        } catch (error) {
            console.error('Failed to remove ligands:', error);
        }
    }

    // Remove ions
    async removeIons() {
        try {
            console.log('⚡ Removing ion molecules...');
            
            const hierarchy = this.plugin.managers.structure.hierarchy.current;
            if (!hierarchy.structures.length) {
                console.log('❌ No structures found');
                return;
            }

            const structure = hierarchy.structures[0];
            if (!structure.cell?.obj?.data) {
                console.log('❌ No structure data found');
                return;
            }

            // Common ion types to remove
            const ionTypes = ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE', 'SO4', 'PO4'];
            let removedAny = false;

            for (const ionType of ionTypes) {
                // Build a selection for this ion type
                const ionExpression = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({
                    'residue-test': Q.core.rel.eq([
                        Q.struct.atomProperty.macromolecular.label_comp_id(), ionType
                    ])
                }), structure.cell.obj.data);

                // Convert selection to loci
                const ionLoci = StructureSelection.toLociWithSourceUnits(ionExpression);
                
                if (!ionLoci.isEmpty) {
                    console.log(`✅ Found ${ionType} ions, removing...`);
                    
                    // Add ion loci to current selection
                    this.plugin.managers.structure.selection.fromLoci('set', ionLoci);
                    
                    // Get components with selection and subtract the selected parts
                    const sel = this.plugin.managers.structure.hierarchy.getStructuresWithSelection();
                    const componentsToModify: any[] = [];
                    
                    for (const s of sel) {
                        componentsToModify.push(...s.components);
                    }
                    
                    if (componentsToModify.length > 0) {
                        await this.plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
                        removedAny = true;
                    }
                    
                    // Clear selection for next ion
                    this.plugin.managers.structure.selection.clear();
                }
            }

            if (removedAny) {
                console.log('✅ Ion molecules removed successfully!');
            } else {
                console.log('❌ No common ions found in structure');
            }
            
        } catch (error) {
            console.error('Failed to remove ions:', error);
        }
    }

    // Representation controls - using safe update pattern from molstar-test
    async updateRepresentation(representationType: string) {
        try {
            console.log(`🎨 Setting representation to ${representationType}...`);
            
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
            console.log(`✅ Representation changed to ${representationType}`);
            
        } catch (error) {
            console.error('Error updating representation:', error);
            
            // Fallback to full rebuild if update fails
            console.log('🔄 Falling back to full rebuild...');
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
                
                // Add new representations using StateTransforms
                const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
                for (const structure of hierarchy.structures) {
                    for (const component of structure.components) {
                        const colorTheme = (representationType === 'ball-and-stick' || representationType === 'spacefill') 
                            ? 'element-symbol' 
                            : 'chain-id';
                            
                        update.to(component.cell.transform.ref).apply(StateTransforms.Representation.StructureRepresentation3D, {
                            type: { name: representationType, params: {} },
                            colorTheme: { name: colorTheme, params: {} },
                            sizeTheme: { name: 'uniform', params: { value: 1 } },
                        });
                    }
                }
                
                await update.commit();
                console.log(`✅ Fallback representation changed to: ${representationType}`);
                
            } catch (fallbackError) {
                console.error('Both safe and fallback representation change failed:', fallbackError);
            }
        }
    }

    async setCartoon() { return this.updateRepresentation('cartoon'); }
    async setSurface() { return this.updateRepresentation('molecular-surface'); }
    async setBallAndStick() { return this.updateRepresentation('ball-and-stick'); }
    async setSpacefill() { return this.updateRepresentation('spacefill'); }

    // Store current PDB ID for chain operations
    private currentPdbId?: string;
}

export default function MolstarBasicPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<BasicMolstarWrapper | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPdbId, setCurrentPdbId] = useState('1grm');
    const [components, setComponents] = useState<Array<{
        ref: string;
        label: string;
        description: string;
        elementCount: number;
        isVisible: boolean;
        type: string;
    }>>([]);
    const [showComponents, setShowComponents] = useState(false);

    // Initialize wrapper
    useEffect(() => {
        if (!containerRef.current || wrapperRef.current) return;

        const initWrapper = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const wrapper = new BasicMolstarWrapper();
                await wrapper.init(containerRef.current!);
                wrapper.setBackground(0xffffff);
                wrapperRef.current = wrapper;

                // Load default structure
                await wrapper.loadPDB(currentPdbId);
                
                setIsLoading(false);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to initialize';
                setError(message);
                setIsLoading(false);
                console.error('Failed to initialize:', err);
            }
        };

        initWrapper();
    }, [currentPdbId]);

    const handleLoadPDB = async (pdbId: string) => {
        if (!wrapperRef.current) return;

        try {
            setIsLoading(true);
            setError(null);
            await wrapperRef.current.loadPDB(pdbId);
            setCurrentPdbId(pdbId);
            setIsLoading(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load structure';
            setError(message);
            setIsLoading(false);
            console.error('Failed to load PDB:', err);
        }
    };

    const handleHighlightResidue = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.highlightResidue(7);
    };

    const handleHighlightRange = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.highlightResidueRange('A', 1, 10);
    };

    const handleClearHighlight = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.clearHighlight();
    };

    const handleToggleSpin = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.toggleSpin();
    };

    const handleResetCamera = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.resetCamera();
    };

    // Chain operations
    const handleHideChain = (chainId: string) => {
        if (!wrapperRef.current) return;
        wrapperRef.current.hideChain(chainId);
    };

    const handleIsolateChain = (chainId: string) => {
        if (!wrapperRef.current) return;
        wrapperRef.current.isolateChain(chainId);
    };

    const handleShowAllChains = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.showAllChains();
    };

    // Representation changes
    const handleSetCartoon = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.setCartoon();
    };

    const handleSetSurface = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.setSurface();
    };

    const handleSetBallAndStick = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.setBallAndStick();
    };

    const handleSetSpacefill = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.setSpacefill();
    };

    const handleDiscoverChains = async () => {
        if (!wrapperRef.current) return;
        const chains = await wrapperRef.current.getAvailableChains();
        console.log('Available chains:', chains);
    };

    // Residue range operations
    const handleHideResidueRange = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.hideResidueRange('A', 1, 10);
    };

    const handleIsolateResidueRange = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.isolateResidueRange('A', 20, 50);
    };

    const handleShowResidueRange = () => {
        if (!wrapperRef.current) return;
        wrapperRef.current.showResidueRange('A', 80, 100);
    };

    // Component operations
    const handleDiscoverComponents = async () => {
        if (!wrapperRef.current) return;
        const discoveredComponents = await wrapperRef.current.discoverComponents();
        setComponents(discoveredComponents);
        setShowComponents(true);
    };

    const handleRemoveWater = async () => {
        if (!wrapperRef.current) return;
        await wrapperRef.current.removeWater();
        // Refresh component list
        setTimeout(() => handleDiscoverComponents(), 1000);
    };

    const handleRemoveLigands = async () => {
        if (!wrapperRef.current) return;
        await wrapperRef.current.removeLigands();
        // Refresh component list
        setTimeout(() => handleDiscoverComponents(), 1000);
    };

    const handleRemoveIons = async () => {
        if (!wrapperRef.current) return;
        await wrapperRef.current.removeIons();
        // Refresh component list
        setTimeout(() => handleDiscoverComponents(), 1000);
    };

    // Helper functions for component display
    const getTypeIcon = (type: string): string => {
        switch (type) {
            case 'water': return '💧';
            case 'ligand': return '🧪';
            case 'ion': return '⚡';
            case 'polymer': return '🧬';
            case 'assembly': return '🏗️';
            default: return '🔹';
        }
    };

    const getTypeColor = (type: string, isVisible: boolean): string => {
        const alpha = isVisible ? '' : ' opacity-50';
        switch (type) {
            case 'water': return `bg-blue-50 border-blue-200${alpha}`;
            case 'ligand': return `bg-green-50 border-green-200${alpha}`;
            case 'ion': return `bg-yellow-50 border-yellow-200${alpha}`;
            case 'polymer': return `bg-purple-50 border-purple-200${alpha}`;
            case 'assembly': return `bg-gray-50 border-gray-200${alpha}`;
            default: return `bg-gray-50 border-gray-200${alpha}`;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Molstar Basic Wrapper (Official Pattern)</h1>
                
                {/* Controls */}
                <div className="mb-4 space-y-2">
                    {/* Structure Selection */}
                    <div className="flex gap-2 flex-wrap">
                        <select 
                            value={currentPdbId}
                            onChange={(e) => handleLoadPDB(e.target.value)}
                            className="px-3 py-1 border rounded"
                            disabled={isLoading}
                        >
                            <option value="1grm">1GRM</option>
                            <option value="1cbs">1CBS</option>
                            <option value="1crn">1CRN - Crambin</option>
                            <option value="1ubq">1UBQ - Ubiquitin</option>
                            <option value="4hhb">4HHB - Hemoglobin</option>
                            <option value="1lyz">1LYZ - Lysozyme</option>
                        </select>
                    </div>

                    {/* Representation Controls */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">Representations:</span>
                        <button onClick={handleSetCartoon} disabled={isLoading} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm">Cartoon</button>
                        <button onClick={handleSetSurface} disabled={isLoading} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm">Surface</button>
                        <button onClick={handleSetBallAndStick} disabled={isLoading} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm">Ball & Stick</button>
                        <button onClick={handleSetSpacefill} disabled={isLoading} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm">Spacefill</button>
                    </div>

                    {/* Chain Controls */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">Chains:</span>
                        <button onClick={handleDiscoverChains} disabled={isLoading} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm">Find Chains</button>
                        <button onClick={() => handleHideChain('A')} disabled={isLoading} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm">Hide A</button>
                        <button onClick={() => handleIsolateChain('A')} disabled={isLoading} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-sm">Isolate A</button>
                        <button onClick={handleShowAllChains} disabled={isLoading} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm">Show All</button>
                    </div>

                    {/* Residue Range Controls */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">Residue Ranges:</span>
                        <button onClick={handleHideResidueRange} disabled={isLoading} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm">Hide A:1-10</button>
                        <button onClick={handleIsolateResidueRange} disabled={isLoading} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm">Isolate A:20-50</button>
                        <button onClick={handleShowResidueRange} disabled={isLoading} className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 text-sm">Show A:80-100</button>
                    </div>

                    {/* Component Management */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">Components:</span>
                        <button onClick={handleDiscoverComponents} disabled={isLoading} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm">Discover</button>
                        <button onClick={handleRemoveWater} disabled={isLoading} className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 text-sm">Remove 💧</button>
                        <button onClick={handleRemoveLigands} disabled={isLoading} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm">Remove 🧪</button>
                        <button onClick={handleRemoveIons} disabled={isLoading} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-sm">Remove ⚡</button>
                    </div>

                    {/* Highlighting & Camera */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">Highlight:</span>
                        <button onClick={handleHighlightResidue} disabled={isLoading} className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 text-sm">Residue 7</button>
                        <button onClick={handleHighlightRange} disabled={isLoading} className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 text-sm">A:1-10</button>
                        <button onClick={handleClearHighlight} disabled={isLoading} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm">Clear</button>
                        <button onClick={handleToggleSpin} disabled={isLoading} className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50 text-sm">Spin</button>
                        <button onClick={handleResetCamera} disabled={isLoading} className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 text-sm">Reset Camera</button>
                    </div>
                </div>

                {/* Component Discovery Panel */}
                {showComponents && (
                    <div className="mb-4 p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Structure Components</h3>
                            <button 
                                onClick={() => setShowComponents(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {components.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No components found. Click "Discover" to scan the structure.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {components.map((component, index) => (
                                    <div
                                        key={`${component.ref}-${index}`}
                                        className={`flex items-center justify-between p-3 rounded border ${getTypeColor(component.type, component.isVisible)}`}
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <span className="text-xl">{getTypeIcon(component.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {component.label}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {component.elementCount} elements • {component.type}
                                                </div>
                                                {component.description && (
                                                    <div className="text-xs text-gray-400 truncate mt-1">
                                                        {component.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                component.isVisible 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {component.isVisible ? 'Visible' : 'Hidden'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-3 text-xs text-gray-500">
                            💡 Components are discovered by analyzing the structure hierarchy. Use the remove buttons above to hide specific component types.
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                        Loading...
                    </div>
                )}

                {/* Molstar container */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div 
                        ref={containerRef}
                        className="w-full h-[700px] bg-white relative"
                        style={{ 
                            position: 'relative',
                            maxWidth: '100%',
                            maxHeight: '700px',
                            overflow: 'hidden'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}