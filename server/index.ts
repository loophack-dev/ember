import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import {
  loadCharacterSprites,
  loadWallTiles,
  loadFloorTiles,
  loadFurnitureAssets,
  loadDefaultLayout,
} from "./assetLoader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3456", 10);
const IDLE_SHUTDOWN_MS = 600_000; // 10 minutes

// State
const clients = new Set<WebSocket>();
let lastActivityTime = Date.now();

// Load assets at startup
// In dev mode (tsx), __dirname is server/ so assets are at ../webview-ui/public/assets/
// In production (esbuild), __dirname is dist/ so assets are at ./public/assets/
const devAssetsRoot = join(__dirname, "..", "webview-ui", "public", "assets");
const prodAssetsRoot = join(__dirname, "public", "assets");
const assetsRoot = existsSync(devAssetsRoot) ? devAssetsRoot : prodAssetsRoot;

console.log(`[Server] Loading assets from: ${assetsRoot}`);

const characterSprites = loadCharacterSprites(assetsRoot);
const wallTiles = loadWallTiles(assetsRoot);
const floorTiles = loadFloorTiles(assetsRoot);
const furnitureAssets = loadFurnitureAssets(assetsRoot);

// Persistence directory
const persistDir = join(homedir(), ".pixel-agents");
const persistedLayoutPath = join(persistDir, "layout.json");
const persistedSeatsPath = join(persistDir, "agent-seats.json");

// Load layout: persisted first, then default
function loadLayout(): Record<string, unknown> | null {
  if (existsSync(persistedLayoutPath)) {
    try {
      const content = readFileSync(persistedLayoutPath, "utf-8");
      const layout = JSON.parse(content) as Record<string, unknown>;
      console.log(`[Server] Loaded persisted layout from ${persistedLayoutPath}`);
      return layout;
    } catch (err) {
      console.warn(`[Server] Failed to load persisted layout: ${err instanceof Error ? err.message : err}`);
    }
  }
  return loadDefaultLayout(assetsRoot);
}

let currentLayout = loadLayout();

// Express app
const app = express();
// Serve production build
app.use(express.static(join(__dirname, "public")));

const server = createServer(app);

// WebSocket
const wss = new WebSocketServer({ server });

// Ping/pong heartbeat — keeps clients Set accurate for shutdown guard
const HEARTBEAT_INTERVAL_MS = 30_000;
setInterval(() => {
  for (const ws of clients) {
    if ((ws as unknown as Record<string, boolean>).__isAlive === false) {
      clients.delete(ws);
      ws.terminate();
      continue;
    }
    (ws as unknown as Record<string, boolean>).__isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL_MS);

function sendInitialData(ws: WebSocket): void {
  // Send settings
  ws.send(JSON.stringify({ type: "settingsLoaded", soundEnabled: false }));

  // Send character sprites
  if (characterSprites) {
    ws.send(JSON.stringify({ type: "characterSpritesLoaded", characters: characterSprites.characters }));
  }

  // Send wall tiles
  if (wallTiles) {
    ws.send(JSON.stringify({ type: "wallTilesLoaded", sprites: wallTiles.sprites }));
  }

  // Send floor tiles (optional)
  if (floorTiles) {
    ws.send(JSON.stringify({ type: "floorTilesLoaded", sprites: floorTiles.sprites }));
  }

  // Send furniture assets (optional)
  if (furnitureAssets) {
    ws.send(
      JSON.stringify({
        type: "furnitureAssetsLoaded",
        catalog: furnitureAssets.catalog,
        sprites: furnitureAssets.sprites,
      }),
    );
  }

  // Catalog agents are loaded from Embers REST in the UI. Keep the empty
  // membership snapshot so the existing visualization protocol stays intact.
  ws.send(JSON.stringify({ type: "existingAgents", agents: [], folderNames: {}, agentMeta: {} }));

  // Send layout (must come after existingAgents — the hook buffers agents until layout arrives)
  if (currentLayout) {
    ws.send(JSON.stringify({ type: "layoutLoaded", layout: currentLayout, version: 1 }));
  } else {
    // Send null layout to trigger default layout creation in the UI
    ws.send(JSON.stringify({ type: "layoutLoaded", layout: null, version: 0 }));
  }
}

wss.on("connection", (ws) => {
  lastActivityTime = Date.now();
  (ws as unknown as Record<string, boolean>).__isAlive = true;
  ws.on("pong", () => { (ws as unknown as Record<string, boolean>).__isAlive = true; });
  clients.add(ws);

  ws.on("message", (raw) => {
    lastActivityTime = Date.now();
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "webviewReady" || msg.type === "ready") {
        sendInitialData(ws);
      } else if (msg.type === "saveLayout") {
        try {
          mkdirSync(persistDir, { recursive: true });
          writeFileSync(persistedLayoutPath, JSON.stringify(msg.layout, null, 2));
          currentLayout = msg.layout as Record<string, unknown>;
          // Broadcast to other clients for multi-tab sync
          const data = JSON.stringify({ type: "layoutLoaded", layout: msg.layout, version: 1 });
          for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
          }
        } catch (err) {
          console.error(`[Server] Failed to save layout: ${err instanceof Error ? err.message : err}`);
        }
      } else if (msg.type === "saveAgentSeats") {
        try {
          mkdirSync(persistDir, { recursive: true });
          writeFileSync(persistedSeatsPath, JSON.stringify(msg.seats, null, 2));
        } catch (err) {
          console.error(`[Server] Failed to save agent seats: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch {
      /* ignore invalid messages */
    }
  });

  ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(`Pixel Agents server running at http://localhost:${PORT}`);
});

// Idle shutdown
setInterval(() => {
  if (clients.size === 0 && Date.now() - lastActivityTime > IDLE_SHUTDOWN_MS) {
    console.log("No clients for 10 minutes, shutting down...");
    server.close();
    process.exit(0);
  }
}, 30_000);

// Graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
