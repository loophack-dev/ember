import { useState, useCallback, useEffect, useRef } from 'react'
import { OfficeState } from './office/engine/officeState.js'
import { OfficeCanvas } from './office/components/OfficeCanvas.js'
import { ToolOverlay } from './office/components/ToolOverlay.js'
import { EditorToolbar } from './office/editor/EditorToolbar.js'
import { EditorState } from './office/editor/editorState.js'
import { EditTool } from './office/types.js'
import { isRotatable } from './office/layout/furnitureCatalog.js'
import { useExtensionMessages } from './hooks/useExtensionMessages.js'
import { useAgentCatalog } from './hooks/useAgentCatalog.js'
import { AgentFormModal } from './components/AgentFormModal.js'
import type { AgentFormMode } from './components/AgentFormModal.js'
import { FireConfirmModal } from './components/FireConfirmModal.js'
import { deleteAgent, putAppearance } from './embers/client.js'
import { mergeAppearanceForMove } from './embers/appearance.js'
import { embersErrorMessage } from './embers/http.js'
import { cacheAgent, getBackendId, getCachedAgent, projectClosed } from './embers/officeBridge.js'
import { isEmberIdle } from './embers/characterStatus.js'
import { PULSE_ANIMATION_DURATION_SEC } from './constants.js'
import { useEditorActions } from './hooks/useEditorActions.js'
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js'
import { ZoomControls } from './components/ZoomControls.js'
import { BottomToolbar } from './components/BottomToolbar.js'
import { DebugView } from './components/DebugView.js'
import { EmbersSidebar } from './components/EmbersSidebar.js'
import { BrandHeader } from './components/BrandHeader.js'

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null }
const editorState = new EditorState()

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState()
  }
  return officeStateRef.current
}

const actionBarBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '22px',
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text-dim)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const actionBarBtnDisabled: React.CSSProperties = {
  ...actionBarBtnStyle,
  opacity: 'var(--pixel-btn-disabled-opacity)',
  cursor: 'default',
}

function EditActionBar({ editor, editorState: es }: { editor: ReturnType<typeof useEditorActions>; editorState: EditorState }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const undoDisabled = es.undoStack.length === 0
  const redoDisabled = es.redoStack.length === 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--pixel-controls-z)',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        background: 'var(--pixel-bg)',
        border: '2px solid var(--pixel-border)',
        borderRadius: 0,
        padding: '4px 8px',
        boxShadow: 'var(--pixel-shadow)',
      }}
    >
      <button
        style={undoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={undoDisabled ? undefined : editor.handleUndo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        style={redoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={redoDisabled ? undefined : editor.handleRedo}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>
      <button
        style={actionBarBtnStyle}
        onClick={editor.handleSave}
        title="Save layout"
      >
        Save
      </button>
      {!showResetConfirm ? (
        <button
          style={actionBarBtnStyle}
          onClick={() => setShowResetConfirm(true)}
          title="Reset to last saved layout"
        >
          Reset
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '22px', color: 'var(--pixel-reset-text)' }}>Reset?</span>
          <button
            style={{ ...actionBarBtnStyle, background: 'var(--pixel-danger-bg)', color: '#fff' }}
            onClick={() => { setShowResetConfirm(false); editor.handleReset() }}
          >
            Yes
          </button>
          <button
            style={actionBarBtnStyle}
            onClick={() => setShowResetConfirm(false)}
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  const editor = useEditorActions(getOfficeState, editorState)

  const isEditDirty = useCallback(() => editor.isEditMode && editor.isDirty, [editor.isEditMode, editor.isDirty])

  const { agents, selectedAgent, agentTools, agentStatuses, subagentTools, subagentCharacters, layoutReady, loadedAssets } = useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty)
  const { catalogError, setCatalogError } = useAgentCatalog(layoutReady)

  const [isDebugMode, setIsDebugMode] = useState(false)
  const [formMode, setFormMode] = useState<AgentFormMode | null>(null)
  const [relocatingAgentId, setRelocatingAgentId] = useState<number | null>(null)
  const [fireTargetId, setFireTargetId] = useState<number | null>(null)
  const [fireBusy, setFireBusy] = useState(false)
  const relocatingRef = useRef<number | null>(null)

  const setRelocating = useCallback((id: number | null) => {
    relocatingRef.current = id
    setRelocatingAgentId(id)
  }, [])

  const handleToggleDebugMode = useCallback(() => setIsDebugMode((prev) => !prev), [])

  const handleToggleEditMode = useCallback(() => {
    setRelocating(null)
    setFireTargetId(null)
    editor.handleToggleEditMode()
  }, [editor, setRelocating])

  const handleSelectAgent = useCallback((id: number) => {
    const os = getOfficeState()
    if (os.characters.get(id)?.isSubagent) return
    os.selectedAgentId = id
    os.cameraFollowId = id
    setRelocating(null)
  }, [setRelocating])

  const containerRef = useRef<HTMLDivElement>(null)

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0)
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    handleToggleEditMode,
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (relocatingRef.current !== null) {
        setRelocating(null)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setRelocating])

  const requestFire = useCallback((id: number) => {
    const os = getOfficeState()
    if (os.characters.get(id)?.isSubagent) return
    if (!isEmberIdle(getBackendId(id))) return
    setRelocating(null)
    setFireTargetId(id)
  }, [setRelocating])

  const handleConfirmFire = useCallback(async () => {
    if (fireTargetId === null) return
    const uuid = getBackendId(fireTargetId)
    if (!uuid) {
      setCatalogError('Could not find this Ember in the catalog')
      return
    }
    setFireBusy(true)
    try {
      await deleteAgent(uuid)
      projectClosed(uuid)
      setFireTargetId(null)
    } catch (err) {
      setCatalogError(embersErrorMessage(err))
    } finally {
      setFireBusy(false)
    }
  }, [fireTargetId, setCatalogError])

  const handleEditAgent = useCallback((id: number) => {
    if (!isEmberIdle(getBackendId(id))) return
    setRelocating(null)
    setFireTargetId(null)
    setFormMode({ kind: 'edit', displayId: id })
  }, [setRelocating])

  const handleMoveAgent = useCallback((id: number) => {
    const os = getOfficeState()
    if (os.characters.get(id)?.isSubagent) return
    if (!isEmberIdle(getBackendId(id))) return
    os.selectedAgentId = id
    setFireTargetId(null)
    setRelocating(id)
  }, [setRelocating])

  const handleHire = useCallback(() => {
    setRelocating(null)
    setFireTargetId(null)
    setFormMode({ kind: 'create' })
  }, [setRelocating])

  const persistMove = useCallback(async (agentId: number, seatId: string | null, col: number, row: number) => {
    const uuid = getBackendId(agentId)
    if (!uuid) {
      setCatalogError('Could not find this Ember in the catalog')
      setRelocating(null)
      return
    }
    const cached = getCachedAgent(uuid)
    try {
      const updated = await putAppearance(uuid, mergeAppearanceForMove(cached?.appearance, seatId, col, row))
      cacheAgent(updated)
    } catch (err) {
      setCatalogError(embersErrorMessage(err))
    } finally {
      setRelocating(null)
    }
  }, [setCatalogError, setRelocating])

  const handleRelocatePlace = useCallback((agentId: number, col: number, row: number) => {
    if (relocatingRef.current !== agentId) return
    if (!isEmberIdle(getBackendId(agentId))) {
      setRelocating(null)
      return
    }
    const os = getOfficeState()
    const ch = os.characters.get(agentId)
    if (!ch || ch.isSubagent) return

    const seatId = os.getSeatAtTile(col, row)
    if (seatId) {
      const seat = os.seats.get(seatId)
      if (!seat || (seat.assigned && ch.seatId !== seatId)) return
      if (ch.seatId === seatId) os.sendToSeat(agentId)
      else os.reassignSeat(agentId, seatId)
      void persistMove(agentId, seatId, col, row)
      return
    }

    const walkable = os.walkableTiles.some((tile) => tile.col === col && tile.row === row)
    if (!walkable) return
    const alreadyThere = ch.tileCol === col && ch.tileRow === row
    const previousSeat = ch.seatId
    os.releaseSeat(agentId)
    const walked = os.walkToTile(agentId, col, row)
    if (!walked && !alreadyThere) {
      if (previousSeat) os.reassignSeat(agentId, previousSeat)
      return
    }
    void persistMove(agentId, null, col, row)
  }, [persistMove])

  const handleClick = useCallback((agentId: number) => {
    const os = getOfficeState()
    if (os.characters.get(agentId)?.isSubagent) return
    if (os.selectedAgentId !== relocatingRef.current) {
      setRelocating(null)
    }
  }, [setRelocating])

  const officeState = getOfficeState()

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint = editor.isEditMode && (() => {
    if (editorState.selectedFurnitureUid) {
      const item = officeState.getLayout().furniture.find((f) => f.uid === editorState.selectedFurnitureUid)
      if (item && isRotatable(item.type)) return true
    }
    if (editorState.activeTool === EditTool.FURNITURE_PLACE && isRotatable(editorState.selectedFurnitureType)) {
      return true
    }
    return false
  })()

  if (!layoutReady) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vscode-foreground)' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes pixel-agents-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .pixel-agents-pulse { animation: pixel-agents-pulse ${PULSE_ANIMATION_DURATION_SEC}s ease-in-out infinite; }
      `}</style>

      <BrandHeader />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '70%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <OfficeCanvas
        officeState={officeState}
        onClick={handleClick}
        isEditMode={editor.isEditMode}
        editorState={editorState}
        onEditorTileAction={editor.handleEditorTileAction}
        onEditorEraseAction={editor.handleEditorEraseAction}
        onEditorSelectionChange={editor.handleEditorSelectionChange}
        onDeleteSelected={editor.handleDeleteSelected}
        onRotateSelected={editor.handleRotateSelected}
        onDragMove={editor.handleDragMove}
        editorTick={editor.editorTick}
        zoom={editor.zoom}
        onZoomChange={editor.handleZoomChange}
        panRef={editor.panRef}
        relocatingAgentId={relocatingAgentId}
        onRelocatePlace={handleRelocatePlace}
      />

      <ZoomControls zoom={editor.zoom} onZoomChange={editor.handleZoomChange} />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--pixel-vignette)',
          pointerEvents: 'none',
          zIndex: 40,
        }}
      />

      {catalogError && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 60,
            background: 'var(--pixel-bg)',
            border: '2px solid var(--pixel-border)',
            color: '#ff8a8a',
            fontSize: '16px',
            padding: '6px 10px',
            maxWidth: 420,
          }}
        >
          {catalogError}
          <button
            onClick={() => setCatalogError(null)}
            style={{
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--pixel-text)',
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>
      )}

      <BottomToolbar
        isEditMode={editor.isEditMode}
        onAddAgent={handleHire}
        onToggleEditMode={handleToggleEditMode}
        isDebugMode={isDebugMode}
        onToggleDebugMode={handleToggleDebugMode}
      />

      <AgentFormModal
        mode={formMode}
        officeState={officeState}
        onClose={() => setFormMode(null)}
      />

      {fireTargetId !== null && (
        <FireConfirmModal
          agentName={
            officeState.characters.get(fireTargetId)?.folderName
            || getCachedAgent(getBackendId(fireTargetId) ?? '')?.name
            || `Ember #${fireTargetId}`
          }
          onCancel={() => { if (!fireBusy) setFireTargetId(null) }}
          onConfirm={() => { void handleConfirmFire() }}
          busy={fireBusy}
        />
      )}

      {editor.isEditMode && editor.isDirty && (
        <EditActionBar editor={editor} editorState={editorState} />
      )}

      {showRotateHint && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: editor.isDirty ? 'translateX(calc(-50% + 100px))' : 'translateX(-50%)',
            zIndex: 49,
            background: 'var(--pixel-hint-bg)',
            color: '#fff',
            fontSize: '20px',
            padding: '3px 8px',
            borderRadius: 0,
            border: '2px solid var(--pixel-accent)',
            boxShadow: 'var(--pixel-shadow)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Press <b>R</b> to rotate
        </div>
      )}

      {editor.isEditMode && (() => {
        // Compute selected furniture color from current layout
        const selUid = editorState.selectedFurnitureUid
        const selColor = selUid
          ? officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null
          : null
        return (
          <EditorToolbar
            activeTool={editorState.activeTool}
            selectedTileType={editorState.selectedTileType}
            selectedFurnitureType={editorState.selectedFurnitureType}
            selectedFurnitureUid={selUid}
            selectedFurnitureColor={selColor}
            floorColor={editorState.floorColor}
            wallColor={editorState.wallColor}
            onToolChange={editor.handleToolChange}
            onTileTypeChange={editor.handleTileTypeChange}
            onFloorColorChange={editor.handleFloorColorChange}
            onWallColorChange={editor.handleWallColorChange}
            onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
            onFurnitureTypeChange={editor.handleFurnitureTypeChange}
            loadedAssets={loadedAssets}
          />
        )
      })()}

      <ToolOverlay
        officeState={officeState}
        agents={agents}
        agentTools={agentTools}
        subagentCharacters={subagentCharacters}
        containerRef={containerRef}
        zoom={editor.zoom}
        panRef={editor.panRef}
        onEditAgent={handleEditAgent}
        onMoveAgent={handleMoveAgent}
        onFireAgent={requestFire}
        showHireActions={!editor.isEditMode && formMode === null && fireTargetId === null}
        isRelocating={relocatingAgentId !== null}
      />

      {isDebugMode && (
        <DebugView
          agents={agents}
          selectedAgent={selectedAgent}
          agentTools={agentTools}
          agentStatuses={agentStatuses}
          subagentTools={subagentTools}
          onSelectAgent={handleSelectAgent}
          onCloseAgent={requestFire}
        />
      )}
      </div>

      <EmbersSidebar
        officeState={officeState}
        agents={agents}
        agentTools={agentTools}
        onSelect={handleSelectAgent}
        onEdit={handleEditAgent}
        onFire={requestFire}
      />
      </div>
    </div>
  )
}

export default App
