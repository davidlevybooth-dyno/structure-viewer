# Mol* Complete Integration Guide

## 🎯 Overview

This guide documents the complete findings from extensive experimentation with Mol* v4.18.0 for molecular structure manipulation, consolidating learnings from isolation experiments, component removal testing, and representation control development. It provides **battle-tested patterns**, **working APIs**, and **agent-ready interfaces** for robust LLM integration.

## 📈 Methodology

Through systematic testing of chain isolation, component removal, and representation switching, we've identified:
- **✅ Working patterns** that preserve component structure
- **❌ Broken approaches** to avoid (with explanations why)
- **🚀 Agent-ready APIs** designed for programmatic control
- **⚡ Performance characteristics** for different operations

## 📚 Table of Contents

1. [Working Approaches](#working-approaches)
2. [Non-Working Approaches](#non-working-approaches)
3. [Representation API](#representation-api)
4. [Component Removal](#component-removal)
5. [Chain Isolation](#chain-isolation)
6. [LLM Agent Integration](#llm-agent-integration)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Working Approaches

### 🎯 Chain Isolation (Hide All Others)

**Pattern:** Selection + Subtraction + Multi-Hide

```typescript
// ✅ WORKING: Hide all chains except target
async function isolateChain(plugin: PluginUIContext, targetChain: string) {
  const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
  const { Script } = await import('molstar/lib/mol-script/script');
  const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');

  const hierarchy = plugin.managers.structure.hierarchy.current;
  const structureData = hierarchy.structures[0].cell.obj?.data;
  const allComponents = hierarchy.structures.flatMap(s => s.components);

  // Get all chains except target
  const allChains = new Set<string>();
  for (const unit of structureData.units) {
    const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
    const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
    allChains.add(chainId);
  }
  allChains.delete(targetChain);

  // Hide each other chain
  for (const hideChainId of Array.from(allChains)) {
    const chainSelection = MS.struct.generator.atomGroups({
      'chain-test': MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(), 
        hideChainId
      ])
    });
    
    const selection = Script.getStructureSelection(chainSelection, structureData);
    const loci = StructureSelection.toLociWithSourceUnits(selection);
    
    plugin.managers.structure.selection.fromLoci('set', loci);
    await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
    plugin.managers.structure.selection.clear();
  }
}
```

### 🧬 Component Removal (Water, Ligands, Ions)

**Pattern:** Selection + Subtraction

```typescript
// ✅ WORKING: Remove specific component types
async function removeWater(plugin: PluginUIContext) {
  const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
  const { Script } = await import('molstar/lib/mol-script/script');
  const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');

  const hierarchy = plugin.managers.structure.hierarchy.current;
  const structureData = hierarchy.structures[0].cell.obj?.data;
  const allComponents = hierarchy.structures.flatMap(s => s.components);

  // Select water molecules (HOH)
  const waterSelection = MS.struct.generator.atomGroups({
    'residue-test': MS.core.rel.eq([
      MS.struct.atomProperty.macromolecular.label_comp_id(), 
      'HOH'
    ])
  });

  const selection = Script.getStructureSelection(waterSelection, structureData);
  const loci = StructureSelection.toLociWithSourceUnits(selection);

  plugin.managers.structure.selection.fromLoci('set', loci);
  await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
  plugin.managers.structure.selection.clear();
}
```

### 🎨 Safe Representation Control

**Pattern:** In-Place Updates (Preserves Component Structure)

```typescript
// ✅ WORKING: Safe representation switching
class MolstarRepresentationAPI {
  constructor(private plugin: PluginUIContext) {}

  async setRepresentation(repType: string): Promise<boolean> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      const update = this.plugin.state.data.build();

      // Update existing representations in place (preserves component refs)
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          for (const representation of component.representations) {
            update.to(representation.cell.transform.ref).update({
              type: { name: repType, params: {} },
              colorTheme: { name: 'chain-id', params: {} },
              sizeTheme: { name: 'uniform', params: { value: 1 } },
            });
          }
        }
      }

      await update.commit();
      return true;
    } catch (error) {
      console.error('Representation change failed:', error);
      return false;
    }
  }

  // Convenience methods
  async setCartoon() { return this.setRepresentation('cartoon'); }
  async setSurface() { return this.setRepresentation('molecular-surface'); }
  async setBallAndStick() { return this.setRepresentation('ball-and-stick'); }
}
```

---

## ❌ Non-Working Approaches

### 🚫 StructureSelectionFromExpression (TRUE Isolation)

**Problem:** Creates new structure node but includes ALL atoms regardless of expression

```typescript
// ❌ BROKEN: Always includes all atoms
const isoNode = update
  .to(structCell.transform.ref)
  .apply(StateTransforms.Model.StructureSelectionFromExpression, {
    label: `Chain ${chainId}`,
    expression: expr, // ← Expression is ignored!
  });
```

**Evidence:** Expression validates correctly (finds atoms) but resulting structure contains all chains.

### 🚫 Delete/Recreate Representations

**Problem:** Breaks component references needed for isolation

```typescript
// ❌ BROKEN: Destroys component structure
for (const representation of component.representations) {
  update.delete(representation.cell.transform.ref); // ← Breaks isolation
}
// Adding new representations creates new refs that isolation can't find
```

### 🚫 Direct State Manipulation

**Problem:** APIs don't exist or are unreliable

```typescript
// ❌ BROKEN: These don't work in v4.18.0
plugin.state.updateTree(); // ← Function doesn't exist
plugin.state.build();      // ← Should be plugin.state.data.build()
PluginCommands.State.SetSubtreeVisibility; // ← May not exist depending on bundle
```

---

## 🎨 Representation API

### Core API Class

```typescript
class MolstarRepresentationAPI {
  constructor(private plugin: PluginUIContext) {}

  // Generic method
  async setRepresentation(type: string): Promise<boolean>

  // Convenience methods
  async setCartoon(): Promise<boolean>
  async setSurface(): Promise<boolean>
  async setBallAndStick(): Promise<boolean>
  async setSpacefill(): Promise<boolean>
  async setPoint(): Promise<boolean>

  // Utility
  getCurrentRepresentation(): string | null
}
```

### Usage Patterns

```typescript
// Method 1: Direct convenience methods
const api = new MolstarRepresentationAPI(plugin);
await api.setCartoon();

// Method 2: Generic calls
await api.setRepresentation('molecular-surface');

// Method 3: Programmatic workflows
if (analysisType === 'protein') {
  await api.setCartoon();
} else if (analysisType === 'binding-site') {
  await api.setSurface();
}
```

### Representation Types

| Type | Use Case | Performance |
|------|----------|-------------|
| `cartoon` | Protein secondary structure | ⚡ Fast |
| `ball-and-stick` | Atomic detail | ⚡ Fast |
| `molecular-surface` | Binding sites, cavities | 🐌 Slow (large structures) |
| `spacefill` | Van der Waals volumes | 🔶 Medium |
| `point` | Simplified view | ⚡ Fast |

---

## 🧬 Component Removal

### The Selection + Subtraction Method

**✅ Official Mol* approach** (recommended by maintainers on GitHub):

1. **Build MolScript expression** to select target residues/molecules
2. **Convert to selection** using `Script.getStructureSelection`
3. **Convert to loci** using `StructureSelection.toLociWithSourceUnits`
4. **Add to current selection** using `plugin.managers.structure.selection.fromLoci('set', loci)`
5. **Subtract from components** using `plugin.managers.structure.component.modifyByCurrentSelection(components, 'subtract')`
6. **Clear selection** to clean up

### Complete Working Implementation

```typescript
// Core removal function for any residue type
async function removeResiduesByName(
  plugin: PluginUIContext, 
  residueNames: string[], 
  componentName: string
): Promise<boolean> {
  try {
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');

    const hierarchy = plugin.managers.structure.hierarchy.current;
    const structureData = hierarchy.structures[0]?.cell?.obj?.data;
    const allComponents = hierarchy.structures.flatMap(s => s.components);

    if (!structureData || allComponents.length === 0) return false;

    // Build selection for target residues
    const residueSelection = MS.struct.generator.atomGroups({
      'residue-test': residueNames.length === 1 
        ? MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_comp_id(), residueNames[0]])
        : MS.core.rel.inSet([MS.struct.atomProperty.macromolecular.label_comp_id(), residueNames])
    });

    const selection = Script.getStructureSelection(residueSelection, structureData);
    const loci = StructureSelection.toLociWithSourceUnits(selection);

    if (loci.elements?.length === 0) {
      console.log(`No ${componentName} found to remove`);
      return false;
    }

    // Apply selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', loci);
    await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
    plugin.managers.structure.selection.clear();

    console.log(`✅ Removed ${loci.elements.length} ${componentName} atoms`);
    return true;

  } catch (error) {
    console.error(`Failed to remove ${componentName}:`, error);
    return false;
  }
}

// Convenience functions
async function removeWater(plugin: PluginUIContext): Promise<boolean> {
  return removeResiduesByName(plugin, ['HOH', 'WAT'], 'Water');
}

async function removeLigands(plugin: PluginUIContext): Promise<boolean> {
  return removeResiduesByName(plugin, ['HEM', 'ATP', 'ADP', 'NAD', 'FAD'], 'Ligands');
}

async function removeIons(plugin: PluginUIContext): Promise<boolean> {
  return removeResiduesByName(plugin, ['ZN', 'MG', 'CA', 'FE', 'MN', 'NA', 'CL', 'K'], 'Ions');
}
```

### Dynamic Component Discovery

```typescript
interface ComponentInfo {
  ref: string;
  label: string;
  type: 'water' | 'ligand' | 'ion' | 'polymer' | 'other';
  elementCount: number;
  isVisible: boolean;
}

function discoverComponents(plugin: PluginUIContext): ComponentInfo[] {
  const hierarchy = plugin.managers.structure.hierarchy.current;
  const components: ComponentInfo[] = [];

  for (const structure of hierarchy.structures) {
    for (const component of structure.components) {
      const componentRef = component.key; // KEY INSIGHT: Use .key, not .cell.ref
      const label = component.cell.obj?.label || 'Unknown';
      const elementCount = component.cell.obj?.data?.elementCount || 0;
      
      // Detect component type
      const lowerLabel = label.toLowerCase();
      let type: ComponentInfo['type'] = 'other';
      if (lowerLabel.includes('water')) type = 'water';
      else if (lowerLabel.includes('ligand')) type = 'ligand';
      else if (lowerLabel.includes('ion')) type = 'ion';
      else if (lowerLabel.includes('polymer')) type = 'polymer';

      components.push({
        ref: componentRef,
        label,
        type,
        elementCount,
        isVisible: !component.cell.state?.isHidden
      });
    }
  }
  return components;
}
```

### Common Residue Names by Type

```typescript
const COMMON_RESIDUES = {
  water: ['HOH', 'WAT'],
  ligands: ['HEM', 'ATP', 'ADP', 'NAD', 'FAD', 'GTP', 'GDP', 'COA', 'PLP'],
  ions: ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE', 'MN', 'CO', 'NI', 'CU'],
  common_buffers: ['EDO', 'PEG', 'MPD', 'GOL', 'ACT']
};
```

### Critical Requirements

1. **Must use `applyPreset('default')`** - Creates proper component separation
2. **Selection + Subtraction pattern** - Only working removal method  
3. **Clear selections after** - Prevents visual artifacts
4. **Check for empty selections** - Handle gracefully when nothing to remove
5. **Use component.key for refs** - Not component.cell.ref

---

## 🎯 Chain Isolation

### Two Working Approaches

#### 1. Hide Chain (Single)
```typescript
// Hide specific chain
await hideChain(plugin, 'B'); // Hides chain B, others remain
```

#### 2. Isolate Chain (Multi-Hide)
```typescript
// Show only specific chain
await isolateChain(plugin, 'A'); // Hides B,C,D,E... shows only A
```

### Chain Discovery

```typescript
function discoverChains(structureData: Structure): string[] {
  const chains = new Set<string>();
  for (const unit of structureData.units) {
    if (unit.kind === 0) { // atomic unit
      const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
      const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
      chains.add(chainId);
    }
  }
  return Array.from(chains);
}
```

---

## 🤖 LLM Agent Integration

### Recommended API Structure

```typescript
class MolstarAgentAPI {
  private repAPI: MolstarRepresentationAPI;
  
  constructor(private plugin: PluginUIContext) {
    this.repAPI = new MolstarRepresentationAPI(plugin);
  }

  // High-level agent commands
  async showProteinStructure(chainId?: string) {
    await this.repAPI.setCartoon();
    if (chainId) await this.isolateChain(chainId);
  }

  async analyzeBindingSite(chainId: string, region?: {start: number, end: number}) {
    await this.repAPI.setSurface();
    if (region) await this.isolateRegion(chainId, region);
  }

  async cleanStructure() {
    await this.removeWater();
    await this.removeLigands();
    await this.removeIons();
  }
}
```

### Natural Language Commands

| Command | API Calls |
|---------|-----------|
| "Show me the protein structure" | `setCartoon()` |
| "Isolate chain A" | `isolateChain('A')` |
| "Remove water molecules" | `removeWater()` |
| "Show binding surface" | `setSurface()` |
| "Focus on residues 10-50" | `isolateRegion('A', {start: 10, end: 50})` |

---

## ⚡ Performance Considerations

### Fast Operations
- ✅ **Cartoon/Ball-and-stick** representation switching
- ✅ **Chain isolation** (hide operations)
- ✅ **Component removal** (water, ligands)

### Slow Operations  
- 🐌 **Surface representation** for large structures (AAV9, viral capsids)
- 🐌 **Spacefill** for very large structures
- 🐌 **Initial structure loading** with `applyPreset`

### Optimization Tips
1. **Use cartoon by default** for protein analysis
2. **Switch to surface only when needed** for binding site analysis
3. **Provide user feedback** for slow operations
4. **Consider progressive loading** for very large structures

---

## 🛠 Troubleshooting

### Common Issues

#### 1. "Isolation not working"
**Symptoms:** Chain remains highlighted instead of isolated
**Cause:** Component structure broken by representation changes
**Solution:** Use safe representation API, avoid delete/recreate

#### 2. "Components not found"
**Symptoms:** `modifyByCurrentSelection` has no effect
**Cause:** Structure loaded without `applyPreset('default')`
**Solution:** Always use `applyPreset('default')` for component separation

#### 3. "API calls fail silently"
**Symptoms:** No errors but no visual changes
**Cause:** Wrong API paths for v4.18.0
**Solution:** Use `plugin.state.data.build()` not `plugin.state.build()`

#### 4. "Representations don't switch"
**Symptoms:** Button clicks don't change visualization
**Cause:** Delete/recreate breaking component references
**Solution:** Use in-place updates with `.update()` not `.delete()`

### Debug Logging

```typescript
// Component count verification
const hierarchy = plugin.managers.structure.hierarchy.current;
console.log('Structures:', hierarchy.structures.length);
console.log('Components:', hierarchy.structures.flatMap(s => s.components).length);

// Selection verification
const selection = Script.getStructureSelection(expr, structureData);
const loci = StructureSelection.toLociWithSourceUnits(selection);
console.log('Selection elements:', loci.elements?.length || 0);
```

---

## 🎯 Conclusion

The key to successful Mol* manipulation in v4.18.0 is:

1. **Use the working patterns** (Selection + Subtraction)
2. **Avoid the broken APIs** (StructureSelectionFromExpression, delete/recreate)
3. **Preserve component structure** throughout all operations
4. **Use safe representation switching** for visual control

This foundation provides everything needed for robust LLM agent integration with molecular structure visualization and manipulation.

---

## 📝 Implementation Files

- **Test Page:** `src/app/molstar-isolate-test/page.tsx`
- **Component Removal:** Working functions in test page
- **Representation API:** `MolstarRepresentationAPI` class
- **Chain Isolation:** `isolateChain()` and `hideChain()` functions

## 🔗 Related Documentation

- [Mol* Component Removal Guide](./MOLSTAR_COMPONENT_REMOVAL_GUIDE.md)
- [Project Structure](./README.md)
- [Sequence Interface Guide](./docs/sequence-interface.md)
