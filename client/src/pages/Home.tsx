import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Bluetooth,
  Cable,
  Check,
  CircleAlert,
  Gauge,
  ImageUp,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import {
  DataCodes,
  DisplayMode,
  DotPadScanner,
  DotPadSDK,
  type DotDevice,
} from "@/sdk/DotPadSDK-3.0.2";

type Grid = boolean[][];
type ConnectionState = "idle" | "connecting" | "connected" | "error";
type MotionType = "shift" | "scan" | "pulse";

const DOT_COLUMNS = 60;
const DOT_ROWS = 40;
const FRAME_COUNT = 6;

const emptyGrid = (): Grid => Array.from({ length: DOT_ROWS }, () => Array(DOT_COLUMNS).fill(false));

function setDot(grid: Grid, x: number, y: number, value = true) {
  if (x >= 0 && x < DOT_COLUMNS && y >= 0 && y < DOT_ROWS) grid[y][x] = value;
}

function ellipse(grid: Grid, cx: number, cy: number, rx: number, ry: number) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) setDot(grid, x, y);
    }
  }
}

function line(grid: Grid, x1: number, y1: number, x2: number, y2: number, thickness = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x1 + ((x2 - x1) * i) / steps);
    const y = Math.round(y1 + ((y2 - y1) * i) / steps);
    for (let oy = -thickness; oy <= thickness; oy += 1) {
      for (let ox = -thickness; ox <= thickness; ox += 1) setDot(grid, x + ox, y + oy);
    }
  }
}

function makeHorseFrame(phase: number): Grid {
  const grid = emptyGrid();
  const bob = Math.round(Math.sin((phase / FRAME_COUNT) * Math.PI * 2) * 2);
  const stride = Math.round(Math.sin((phase / FRAME_COUNT) * Math.PI * 2) * 7);
  const x = 29;
  const y = 20 + bob;

  ellipse(grid, x, y, 14, 6);
  line(grid, 18, y - 2, 10, y - 9, 2);
  ellipse(grid, 8, y - 10, 5, 4);
  line(grid, 5, y - 13, 3, y - 18, 1);
  line(grid, 9, y - 13, 12, y - 18, 1);
  line(grid, 42, y - 1, 54, y - 7 + Math.round(stride / 4), 1);
  line(grid, 27, y + 5, 23 - stride, y + 15, 2);
  line(grid, 34, y + 5, 41 + stride, y + 15, 2);
  line(grid, 24, y + 6, 19 + stride, y + 14, 2);
  line(grid, 37, y + 6, 45 - stride, y + 14, 2);
  line(grid, 17, y + 1, 8, y + 2, 1);

  for (let px = 0; px < DOT_COLUMNS; px += 4) {
    const py = 6 + ((px * 7 + phase * 5) % 28);
    if (px < 18 || px > 42) setDot(grid, px, py);
  }
  return grid;
}

function transformGrid(source: Grid, frame: number, motion: MotionType): Grid {
  if (motion === "pulse") {
    const grid = emptyGrid();
    const centreX = 30;
    const centreY = 20;
    const scale = [0.86, 0.94, 1, 1.08, 1, 0.94][frame];
    source.forEach((row, y) =>
      row.forEach((active, x) => {
        if (!active) return;
        const targetX = Math.round(centreX + (x - centreX) * scale);
        const targetY = Math.round(centreY + (y - centreY) * scale);
        setDot(grid, targetX, targetY);
      }),
    );
    return grid;
  }

  const grid = emptyGrid();
  const offsets = motion === "scan" ? [-6, -3, 0, 3, 6, 3] : [-5, -3, 0, 3, 5, 2];
  const offset = offsets[frame];
  source.forEach((row, y) => row.forEach((active, x) => active && setDot(grid, x + offset, y)));
  return grid;
}

function convertImage(image: HTMLImageElement, threshold: number): Grid {
  const canvas = document.createElement("canvas");
  canvas.width = DOT_COLUMNS;
  canvas.height = DOT_ROWS;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return emptyGrid();

  context.fillStyle = "white";
  context.fillRect(0, 0, DOT_COLUMNS, DOT_ROWS);
  const scale = Math.min(DOT_COLUMNS / image.naturalWidth, DOT_ROWS / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (DOT_COLUMNS - width) / 2, (DOT_ROWS - height) / 2, width, height);
  const pixels = context.getImageData(0, 0, DOT_COLUMNS, DOT_ROWS).data;

  return Array.from({ length: DOT_ROWS }, (_, y) =>
    Array.from({ length: DOT_COLUMNS }, (_, x) => {
      const index = (y * DOT_COLUMNS + x) * 4;
      const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      return luminance < threshold && pixels[index + 3] > 60;
    }),
  );
}

function gridToHex(grid: Grid): string {
  const bytes: string[] = [];
  const bitMap = [
    [0, 0, 0],
    [0, 1, 3],
    [1, 0, 1],
    [1, 1, 4],
    [2, 0, 2],
    [2, 1, 5],
    [3, 0, 6],
    [3, 1, 7],
  ];

  for (let cellY = 0; cellY < 10; cellY += 1) {
    for (let cellX = 0; cellX < 30; cellX += 1) {
      let value = 0;
      bitMap.forEach(([row, column, bit]) => {
        if (grid[cellY * 4 + row][cellX * 2 + column]) value |= 1 << bit;
      });
      bytes.push(value.toString(16).padStart(2, "0").toUpperCase());
    }
  }
  return bytes.join("");
}

function DotMatrix({ grid }: { grid: Grid }) {
  return (
    <div className="dot-matrix" aria-label="60 by 40 tactile dot preview" role="img">
      {grid.flatMap((row, y) => row.map((active, x) => <span className={active ? "dot is-up" : "dot"} key={`${x}-${y}`} />))}
    </div>
  );
}

export default function Home() {
  const [baseGrid, setBaseGrid] = useState<Grid>(() => makeHorseFrame(0));
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [motion, setMotion] = useState<MotionType>("shift");
  const [speed, setSpeed] = useState(1.2);
  const [threshold, setThreshold] = useState(128);
  const [sourceName, setSourceName] = useState("Built-in gallop study");
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [log, setLog] = useState("Ready. Load an image or run the built-in test loop.");
  const sdkRef = useRef<DotPadSDK | null>(null);
  const deviceRef = useRef<DotDevice | null>(null);
  const timerRef = useRef<number | null>(null);
  const playRef = useRef(false);
  const framesRef = useRef<Grid[]>([]);
  const speedRef = useRef(speed);
  const inputRef = useRef<HTMLInputElement>(null);

  const frames = useMemo(() => {
    if (sourceName === "Built-in gallop study") return Array.from({ length: FRAME_COUNT }, (_, index) => makeHorseFrame(index));
    return Array.from({ length: FRAME_COUNT }, (_, index) => transformGrid(baseGrid, index, motion));
  }, [baseGrid, motion, sourceName]);

  const currentGrid = frames[frameIndex] ?? frames[0];
  framesRef.current = frames;
  speedRef.current = speed;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      sdkRef.current?.disconnect();
    };
  }, []);

  const writeToDevice = useCallback((grid: Grid) => {
    if (!sdkRef.current || !deviceRef.current) return;
    try {
      sdkRef.current.displayGraphicData(gridToHex(grid), deviceRef.current, DisplayMode.GraphicMode);
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "Dot Pad output could not be sent.");
    }
  }, []);

  const stopPlayback = useCallback((message = "Playback paused.") => {
    playRef.current = false;
    setIsPlaying(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setLog(message);
  }, []);

  const runNextFrame = useCallback(
    (index: number) => {
      if (!playRef.current) return;
      const activeFrames = framesRef.current;
      const nextIndex = index % activeFrames.length;
      setFrameIndex(nextIndex);
      writeToDevice(activeFrames[nextIndex]);
      timerRef.current = window.setTimeout(() => runNextFrame(nextIndex + 1), Math.round(1000 / speedRef.current));
    },
    [writeToDevice],
  );

  const startPlayback = useCallback(() => {
    if (frames.length === 0) return;
    playRef.current = true;
    setIsPlaying(true);
    setLog(deviceRef.current ? "Streaming frames to the connected Dot Pad." : "Preview playback is running — connect a Dot Pad to stream output.");
    runNextFrame(frameIndex);
  }, [frameIndex, frames.length, runNextFrame]);

  const setupSdk = useCallback(() => {
    if (sdkRef.current) return sdkRef.current;
    const sdk = new DotPadSDK();
    sdk.setCallBack(
      (device, code, message) => {
        if (code === DataCodes.Connected) {
          deviceRef.current = device;
          setConnection("connected");
          setDeviceName((device as unknown as { deviceName?: string }).deviceName ?? "Dot Pad");
          setLog("Dot Pad connected and ready for frame streaming.");
        }
        if (code === DataCodes.Disconnected) {
          deviceRef.current = null;
          setConnection("idle");
          setDeviceName(null);
          stopPlayback("Dot Pad disconnected. Preview is paused.");
        }
        if (code === DataCodes.ResponseDisplayLineComplete) setLog("Frame delivered — waiting for the next frame.");
        if (message && code === DataCodes.ConnectedFail) setLog(message);
      },
      null,
    );
    sdkRef.current = sdk;
    return sdk;
  }, [stopPlayback]);

  const connectBluetooth = async () => {
    if (!("bluetooth" in navigator)) {
      setConnection("error");
      setLog("Web Bluetooth is unavailable. Use current Chrome or Edge over HTTPS.");
      return;
    }
    setConnection("connecting");
    setLog("Choose a Dot Pad in the Chrome Bluetooth dialog.");
    try {
      const scanner = new DotPadScanner();
      const device = await scanner.startBleScan();
      if (!device) {
        setConnection("idle");
        setLog("Bluetooth device selection was cancelled.");
        return;
      }
      const connected = await setupSdk().connectBleDevice(device);
      if (connected) {
        deviceRef.current = connected;
        setConnection("connected");
        setDeviceName(device.name ?? "Dot Pad");
        setLog("Dot Pad connected via Bluetooth LE. Press Play to stream.");
      } else {
        setConnection("error");
        setLog("The selected device did not complete the Dot Pad connection.");
      }
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "Bluetooth connection failed.");
    }
  };

  const connectUsb = async () => {
    if (!("serial" in navigator)) {
      setConnection("error");
      setLog("Web Serial is unavailable. Use current Chrome or Edge.");
      return;
    }
    setConnection("connecting");
    setLog("Choose the USB Dot Pad in the browser dialog.");
    try {
      const scanner = new DotPadScanner();
      const port = await scanner.startUsbScan();
      if (!port) {
        setConnection("idle");
        setLog("USB device selection was cancelled.");
        return;
      }
      const connected = await setupSdk().connectUsbDevice(port);
      if (connected) {
        deviceRef.current = connected;
        setConnection("connected");
        setDeviceName("Dot Pad via USB");
        setLog("Dot Pad connected via USB. Press Play to stream.");
      } else {
        setConnection("error");
        setLog("The selected device did not complete the Dot Pad connection.");
      }
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "USB connection failed.");
    }
  };

  const disconnect = () => {
    stopPlayback("Dot Pad disconnected.");
    sdkRef.current?.disconnect(deviceRef.current);
    deviceRef.current = null;
    setConnection("idle");
    setDeviceName(null);
  };

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setLog("Choose a PNG, JPG, WebP, or GIF image file.");
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      setBaseGrid(convertImage(image, threshold));
      setSourceName(file.name);
      setFrameIndex(0);
      setLog(`${file.name} converted to a 60 × 40 tactile frame sequence.`);
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      setLog("That image could not be processed.");
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => loadFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    loadFile(event.dataTransfer.files?.[0]);
  };

  const resetStudy = () => {
    stopPlayback("Built-in gallop study restored.");
    setBaseGrid(makeHorseFrame(0));
    setSourceName("Built-in gallop study");
    setFrameIndex(0);
  };

  const connectionLabel = connection === "connected" ? deviceName ?? "Dot Pad connected" : connection === "connecting" ? "Connecting…" : connection === "error" ? "Connection issue" : "No device connected";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div>
            <p className="eyebrow">DOT PAD / LAB TOOL</p>
            <h1>MOTION <em>TEST</em></h1>
          </div>
        </div>
        <div className="topbar-right">
          <div className={`connection-pill ${connection}`}><span className="connection-led" />{connectionLabel}</div>
          {connection === "connected" ? (
            <button className="compact-button disconnect" onClick={disconnect}><X size={15} />Disconnect</button>
          ) : (
            <button className="compact-button" onClick={connectBluetooth} disabled={connection === "connecting"}><Bluetooth size={15} />Connect Dot Pad</button>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="control-rail">
          <section className="rail-section source-section">
            <div className="section-heading"><span>01</span><h2>Source</h2></div>
            <label className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileInput} />
              <div className="upload-icon"><ImageUp size={21} /></div>
              <strong>Drop an image</strong>
              <small>PNG, JPG, WebP or GIF</small>
              <button type="button" className="browse-link" onClick={() => inputRef.current?.click()}><Upload size={13} />Browse files</button>
            </label>
            <div className="source-meta"><span className="source-dot" />{sourceName}</div>
            <button className="reset-button" onClick={resetStudy}><RotateCcw size={14} />Load gallop test</button>
          </section>

          <section className="rail-section">
            <div className="section-heading"><span>02</span><h2>Translation</h2></div>
            <label className="control-label" htmlFor="motion">Motion mapping</label>
            <select id="motion" value={motion} onChange={(event) => { setMotion(event.target.value as MotionType); setFrameIndex(0); }} disabled={sourceName === "Built-in gallop study"}>
              <option value="shift">Horizontal drift</option>
              <option value="scan">Scan pass</option>
              <option value="pulse">Scale pulse</option>
            </select>
            <div className="slider-head"><label htmlFor="threshold">Darkness threshold</label><b>{threshold}</b></div>
            <input id="threshold" type="range" min="60" max="210" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
            <p className="field-note">Upload conversion uses a 60 × 40 dot matrix. Reload an image after changing threshold.</p>
          </section>

          <section className="rail-section connection-section">
            <div className="section-heading"><span>03</span><h2>Output</h2></div>
            <button className="connection-button bluetooth" onClick={connectBluetooth} disabled={connection === "connecting" || connection === "connected"}><Bluetooth size={17} /><span><b>Bluetooth LE</b><small>Connect through Chrome</small></span></button>
            <button className="connection-button" onClick={connectUsb} disabled={connection === "connecting" || connection === "connected"}><Cable size={17} /><span><b>USB Serial</b><small>Direct wired connection</small></span></button>
          </section>
        </aside>

        <section className="stage">
          <div className="stage-bar">
            <div><p className="eyebrow">TACTILE GRAPHIC / GRAPHIC MODE</p><h2>Live Dot Field</h2></div>
            <div className="matrix-stat"><span>60</span><i>×</i><span>40</span><small>2,400 DOTS</small></div>
          </div>

          <div className="preview-shell">
            <div className="preview-corner tl" /><div className="preview-corner tr" /><div className="preview-corner bl" /><div className="preview-corner br" />
            <div className="scanline" />
            <DotMatrix grid={currentGrid} />
            <div className="preview-footer"><span>FRAME {String(frameIndex + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}</span><span>GRAPHIC BUFFER · 300 CELLS</span></div>
          </div>

          <div className="transport-panel">
            <div className="transport-main">
              <button className={`play-button ${isPlaying ? "playing" : ""}`} onClick={() => (isPlaying ? stopPlayback() : startPlayback())}>
                {isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />} {isPlaying ? "Pause stream" : "Play stream"}
              </button>
              <button className="frame-button" onClick={() => { stopPlayback("Frame advanced manually."); const next = (frameIndex + 1) % frames.length; setFrameIndex(next); writeToDevice(frames[next]); }} title="Send next frame"><Send size={16} /></button>
            </div>
            <div className="speed-control"><Gauge size={15} /><label htmlFor="speed">Rate</label><input id="speed" type="range" min="0.4" max="2.5" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><b>{speed.toFixed(1)} fps</b></div>
          </div>
        </section>
      </section>

      <footer className="status-deck">
        <div className="status-message"><span className={connection === "error" ? "status-icon error" : "status-icon"}>{connection === "error" ? <CircleAlert size={16} /> : connection === "connected" ? <Check size={16} /> : <Sparkles size={16} />}</span><p>{log}</p></div>
        <div className="sdk-badge"><Wifi size={14} />DOTPAD WEB SDK <b>v3.0.2</b></div>
      </footer>
    </main>
  );
}
