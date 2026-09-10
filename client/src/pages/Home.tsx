import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Bluetooth,
  Cable,
  Check,
  ChevronRight,
  CircleAlert,
  Fish,
  Gauge,
  ImageUp,
  Pause,
  Play,
  Rabbit,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  Video,
  Volume2,
  Waves,
  Wind,
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
type AnimalId = "fish" | "bird" | "frog" | "rabbit";
type SourceMode = "builtIn" | "autoTactile" | "upload";

const DOT_COLUMNS = 60;
const DOT_ROWS = 40;
const FRAME_COUNT = 6;

const animals: Array<{
  id: AnimalId;
  name: string;
  action: string;
  instruction: string;
  feature: string;
  icon: "fish" | "bird" | "frog" | "rabbit";
}> = [
  { id: "fish", name: "물고기", action: "헤엄쳐요", instruction: "커다란 꼬리가 좌우로 흔들려요.", feature: "꼬리를 찾아보세요", icon: "fish" },
  { id: "bird", name: "새", action: "날아가요", instruction: "넓은 날개가 위아래로 퍼져요.", feature: "날개를 찾아보세요", icon: "bird" },
  { id: "frog", name: "개구리", action: "점프해요", instruction: "통통한 몸과 긴 뒷다리가 보여요.", feature: "긴 다리를 찾아보세요", icon: "frog" },
  { id: "rabbit", name: "토끼", action: "깡충깡충", instruction: "긴 귀가 위에 있고, 동그란 꼬리가 뒤에 있어요.", feature: "긴 귀를 찾아보세요", icon: "rabbit" },
];

const autoTactileIcons: Record<AnimalId, string> = {
  fish: "mdi:fish",
  bird: "mdi:bird",
  frog: "fa6-solid:frog",
  rabbit: "mdi:rabbit",
};

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

function triangle(grid: Grid, x: number, y: number, width: number, height: number, direction: "left" | "right") {
  for (let row = 0; row <= height * 2; row += 1) {
    const distance = Math.abs(row - height);
    const rowWidth = Math.max(1, Math.round((width * (height - distance)) / height));
    for (let column = 0; column <= rowWidth; column += 1) {
      setDot(grid, direction === "left" ? x - column : x + column, y - height + row);
    }
  }
}

function fishFrame(phase: number): Grid {
  const grid = emptyGrid();
  const swim = [-2, -1, 0, 2, 1, -1][phase];
  const tailLift = [-4, -1, 3, 4, 1, -3][phase];
  const x = 31 + swim;
  const y = 21;
  ellipse(grid, x, y, 12, 7);
  triangle(grid, x - 10, y + Math.round(tailLift / 3), 10, 8, "left");
  ellipse(grid, x + 2, y + 6, 6, 3);
  setDot(grid, x + 6, y - 2, false);
  setDot(grid, x + 7, y - 2, false);
  setDot(grid, x + 6, y - 1, false);
  for (let bubble = 0; bubble < 3; bubble += 1) {
    const bubbleX = 48 + bubble * 4;
    const bubbleY = 10 + ((phase + bubble * 3) % 7);
    ellipse(grid, bubbleX, bubbleY, 1, 1);
  }
  return grid;
}

function birdFrame(phase: number): Grid {
  const grid = emptyGrid();
  const bob = [-2, -1, 1, 2, 1, -1][phase];
  const wing = [7, 2, -5, -9, -5, 2][phase];
  const x = 29;
  const y = 22 + bob;
  ellipse(grid, x, y, 9, 5);
  ellipse(grid, x + 8, y - 4, 5, 5);
  line(grid, x + 12, y - 4, x + 17, y - 3, 1);
  triangle(grid, x - 7, y + 1, 7, 4, "left");
  ellipse(grid, x - 2, y + wing / 2, 9, 4);
  line(grid, x - 7, y + wing / 2, x - 12, y + wing, 1);
  line(grid, x + 1, y + wing / 2, x + 5, y + wing, 1);
  setDot(grid, x + 9, y - 5, false);
  return grid;
}

function frogFrame(phase: number): Grid {
  const grid = emptyGrid();
  const jump = [5, 1, -5, -8, -4, 2][phase];
  const x = 30;
  const y = 22 + jump;
  ellipse(grid, x, y + 1, 11, 6);
  ellipse(grid, x, y - 5, 8, 5);
  ellipse(grid, x - 5, y - 9, 3, 3);
  ellipse(grid, x + 5, y - 9, 3, 3);
  setDot(grid, x - 5, y - 9, false);
  setDot(grid, x + 5, y - 9, false);
  line(grid, x - 8, y + 3, x - 15, y + 10 + Math.max(0, jump), 2);
  line(grid, x + 8, y + 3, x + 15, y + 10 + Math.max(0, jump), 2);
  line(grid, x - 13, y + 10 + Math.max(0, jump), x - 18, y + 11 + Math.max(0, jump), 1);
  line(grid, x + 13, y + 10 + Math.max(0, jump), x + 18, y + 11 + Math.max(0, jump), 1);
  line(grid, x - 5, y + 6, x - 9, y + 10, 1);
  line(grid, x + 5, y + 6, x + 9, y + 10, 1);
  return grid;
}

function rabbitFrame(phase: number): Grid {
  const grid = emptyGrid();
  const hop = [5, 2, -3, -7, -3, 2][phase];
  const slide = [-3, -1, 1, 3, 2, -1][phase];
  const x = 29 + slide;
  const y = 23 + hop;
  ellipse(grid, x, y, 11, 7);
  ellipse(grid, x + 9, y - 5, 6, 5);
  ellipse(grid, x + 8, y - 13, 3, 8);
  ellipse(grid, x + 13, y - 14, 3, 8);
  ellipse(grid, x - 11, y - 1, 4, 4);
  line(grid, x - 2, y + 5, x - 7, y + 12 + Math.max(0, hop), 2);
  line(grid, x + 4, y + 5, x + 9, y + 12 + Math.max(0, hop), 2);
  setDot(grid, x + 11, y - 6, false);
  return grid;
}

function makeAnimalFrame(animal: AnimalId, phase: number) {
  if (animal === "fish") return fishFrame(phase);
  if (animal === "bird") return birdFrame(phase);
  if (animal === "frog") return frogFrame(phase);
  return rabbitFrame(phase);
}

function transformGrid(source: Grid, frame: number, motion: MotionType): Grid {
  if (motion === "pulse") {
    const grid = emptyGrid();
    const centreX = 30;
    const centreY = 20;
    const scale = [0.86, 0.94, 1, 1.08, 1, 0.94][frame];
    source.forEach((row, y) => row.forEach((active, x) => {
      if (active) setDot(grid, Math.round(centreX + (x - centreX) * scale), Math.round(centreY + (y - centreY) * scale));
    }));
    return grid;
  }
  const grid = emptyGrid();
  const offset = motion === "scan" ? [-6, -3, 0, 3, 6, 3][frame] : [-5, -3, 0, 3, 5, 2][frame];
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
  return Array.from({ length: DOT_ROWS }, (_, y) => Array.from({ length: DOT_COLUMNS }, (_, x) => {
    const index = (y * DOT_COLUMNS + x) * 4;
    const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
    return luminance < threshold && pixels[index + 3] > 60;
  }));
}

function gridToHex(grid: Grid): string {
  const bytes: string[] = [];
  const bitMap = [[0, 0, 0], [0, 1, 3], [1, 0, 1], [1, 1, 4], [2, 0, 2], [2, 1, 5], [3, 0, 6], [3, 1, 7]];
  for (let cellY = 0; cellY < 10; cellY += 1) {
    for (let cellX = 0; cellX < 30; cellX += 1) {
      let value = 0;
      bitMap.forEach(([row, column, bit]) => { if (grid[cellY * 4 + row][cellX * 2 + column]) value |= 1 << bit; });
      bytes.push(value.toString(16).padStart(2, "0").toUpperCase());
    }
  }
  return bytes.join("");
}

function DotMatrix({ grid }: { grid: Grid }) {
  return <div className="dot-matrix" aria-label="60 by 40 tactile dot preview" role="img">{grid.flatMap((row, y) => row.map((active, x) => <span className={active ? "dot is-up" : "dot"} key={`${x}-${y}`} />))}</div>;
}

function AnimalIcon({ type, size = 19 }: { type: "fish" | "bird" | "frog" | "rabbit"; size?: number }) {
  if (type === "fish") return <Fish size={size} />;
  if (type === "bird") return <Wind size={size} />;
  if (type === "frog") return <Waves size={size} />;
  return <Rabbit size={size} />;
}

export default function Home() {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalId>("fish");
  const [baseGrid, setBaseGrid] = useState<Grid>(() => makeAnimalFrame("fish", 0));
  const [sourceMode, setSourceMode] = useState<SourceMode>("builtIn");
  const [isLoadingAutoSource, setIsLoadingAutoSource] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [motion, setMotion] = useState<MotionType>("shift");
  const [speed, setSpeed] = useState(2.5);
  const [threshold, setThreshold] = useState(128);
  const [sourceName, setSourceName] = useState("물고기 · 헤엄치기");
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [log, setLog] = useState("동물을 고르고 재생을 눌러, 움직임을 먼저 눈으로 확인해 보세요.");
  const sdkRef = useRef<DotPadSDK | null>(null);
  const deviceRef = useRef<DotDevice | null>(null);
  const timerRef = useRef<number | null>(null);
  const playRef = useRef(false);
  const framesRef = useRef<Grid[]>([]);
  const speedRef = useRef(speed);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeAnimal = animals.find((animal) => animal.id === selectedAnimal) ?? animals[0];
  const isCustomImage = sourceMode !== "builtIn";
  const displayName = sourceMode === "autoTactile" ? "Auto Tactile 그림" : sourceMode === "upload" ? "내 그림" : activeAnimal.name;
  const displayAction = sourceMode === "builtIn" ? activeAnimal.action : "움직여요";
  const frames = useMemo(() => isCustomImage ? Array.from({ length: FRAME_COUNT }, (_, index) => transformGrid(baseGrid, index, motion)) : Array.from({ length: FRAME_COUNT }, (_, index) => makeAnimalFrame(selectedAnimal, index)), [baseGrid, isCustomImage, motion, selectedAnimal]);
  const currentGrid = frames[frameIndex] ?? frames[0];
  framesRef.current = frames;
  speedRef.current = speed;

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); sdkRef.current?.disconnect(); }, []);

  const writeToDevice = useCallback((grid: Grid) => {
    if (!sdkRef.current || !deviceRef.current) return;
    try { sdkRef.current.displayGraphicData(gridToHex(grid), deviceRef.current, DisplayMode.GraphicMode); }
    catch (error) { setConnection("error"); setLog(error instanceof Error ? error.message : "닷패드로 프레임을 보낼 수 없어요."); }
  }, []);

  const stopPlayback = useCallback((message = "재생을 잠시 멈췄어요.") => {
    playRef.current = false;
    setIsPlaying(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setLog(message);
  }, []);

  const runNextFrame = useCallback((index: number) => {
    if (!playRef.current) return;
    const activeFrames = framesRef.current;
    const nextIndex = index % activeFrames.length;
    setFrameIndex(nextIndex);
    writeToDevice(activeFrames[nextIndex]);
    timerRef.current = window.setTimeout(() => runNextFrame(nextIndex + 1), Math.round(1000 / speedRef.current));
  }, [writeToDevice]);

  const startPlayback = useCallback(() => {
    if (frames.length === 0) return;
    playRef.current = true;
    setIsPlaying(true);
    setLog(deviceRef.current ? "닷패드에 동물의 움직임을 보내고 있어요." : "화면에서 움직임을 보고 있어요. 닷패드를 연결하면 촉각으로도 느낄 수 있어요.");
    runNextFrame(frameIndex);
  }, [frameIndex, frames.length, runNextFrame]);

  const setupSdk = useCallback(() => {
    if (sdkRef.current) return sdkRef.current;
    const sdk = new DotPadSDK();
    sdk.setCallBack((device, code, message) => {
      if (code === DataCodes.Connected) {
        deviceRef.current = device;
        setConnection("connected");
        setDeviceName("닷패드 연결됨");
        setLog("닷패드가 준비됐어요. 재생 버튼을 눌러 동물을 느껴 보세요.");
      }
      if (code === DataCodes.Disconnected) {
        deviceRef.current = null;
        setConnection("idle");
        setDeviceName(null);
        stopPlayback("닷패드 연결이 끊겼어요. 화면 미리보기는 다시 시작할 수 있어요.");
      }
      if (code === DataCodes.ResponseDisplayLineComplete) setLog("프레임이 전달됐어요. 다음 움직임을 준비하고 있어요.");
      if (message && code === DataCodes.ConnectedFail) setLog(message);
    }, null);
    sdkRef.current = sdk;
    return sdk;
  }, [stopPlayback]);

  const connectBluetooth = async () => {
    if (!("bluetooth" in navigator)) { setConnection("error"); setLog("Chrome 또는 Edge에서 HTTPS로 이 페이지를 열어 주세요."); return; }
    setConnection("connecting");
    setLog("목록에서 닷패드를 골라 주세요.");
    try {
      const device = await new DotPadScanner().startBleScan();
      if (!device) { setConnection("idle"); setLog("기기 선택을 취소했어요."); return; }
      const connected = await setupSdk().connectBleDevice(device);
      if (connected) { deviceRef.current = connected; setConnection("connected"); setDeviceName(device.name ?? "닷패드 연결됨"); setLog("블루투스로 닷패드가 연결됐어요. 이제 재생해 보세요."); }
      else { setConnection("error"); setLog("선택한 기기와 연결하지 못했어요."); }
    } catch (error) { setConnection("error"); setLog(error instanceof Error ? error.message : "블루투스 연결에 실패했어요."); }
  };

  const connectUsb = async () => {
    if (!("serial" in navigator)) { setConnection("error"); setLog("Chrome 또는 Edge에서 USB 연결을 시도해 주세요."); return; }
    setConnection("connecting");
    setLog("목록에서 USB 닷패드를 골라 주세요.");
    try {
      const port = await new DotPadScanner().startUsbScan();
      if (!port) { setConnection("idle"); setLog("기기 선택을 취소했어요."); return; }
      const connected = await setupSdk().connectUsbDevice(port);
      if (connected) { deviceRef.current = connected; setConnection("connected"); setDeviceName("USB 닷패드 연결됨"); setLog("USB로 닷패드가 연결됐어요. 이제 재생해 보세요."); }
      else { setConnection("error"); setLog("선택한 기기와 연결하지 못했어요."); }
    } catch (error) { setConnection("error"); setLog(error instanceof Error ? error.message : "USB 연결에 실패했어요."); }
  };

  const disconnect = () => { stopPlayback("닷패드 연결을 끊었어요."); sdkRef.current?.disconnect(deviceRef.current); deviceRef.current = null; setConnection("idle"); setDeviceName(null); };

  const selectAnimal = (animal: AnimalId) => {
    stopPlayback(`${animals.find((item) => item.id === animal)?.name ?? "동물"}의 움직임을 준비했어요.`);
    const model = animals.find((item) => item.id === animal) ?? animals[0];
    setSelectedAnimal(animal);
    setBaseGrid(makeAnimalFrame(animal, 0));
    setSourceMode("builtIn");
    setSourceName(`${model.name} · ${model.action}`);
    setFrameIndex(0);
  };

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) { setLog("PNG, JPG, WebP, GIF 그림 파일을 골라 주세요."); return; }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { stopPlayback(`${file.name} 그림을 60 × 40 촉각 움직임으로 바꿨어요.`); setBaseGrid(convertImage(image, threshold)); setSourceMode("upload"); setSourceName(file.name); setFrameIndex(0); URL.revokeObjectURL(objectUrl); };
    image.onerror = () => { setLog("그림을 읽을 수 없어요. 다른 파일을 골라 주세요."); URL.revokeObjectURL(objectUrl); };
    image.src = objectUrl;
  };

  const loadAutoTactileSource = async () => {
    const iconId = autoTactileIcons[selectedAnimal];
    const [prefix, name] = iconId.split(/:(.+)/);
    setIsLoadingAutoSource(true);
    stopPlayback("Auto Tactile 소스에서 동물 아이콘을 불러오고 있어요.");
    try {
      const response = await fetch(`https://api.iconify.design/${prefix}/${name}.svg?height=480`);
      if (!response.ok) throw new Error("동물 아이콘을 찾지 못했어요.");
      const svg = (await response.text()).replace(/currentColor/g, "#000000");
      const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("아이콘을 그림으로 바꾸지 못했어요."));
        image.src = objectUrl;
      });
      setBaseGrid(convertImage(image, 170));
      setSourceMode("autoTactile");
      setSourceName(`Auto Tactile · ${iconId}`);
      setFrameIndex(0);
      setLog(`${activeAnimal.name} 아이콘을 Auto Tactile 방식의 60 × 40 촉각 그래픽으로 불러왔어요.`);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setLog(error instanceof Error ? error.message : "Auto Tactile 소스를 불러오지 못했어요.");
    } finally {
      setIsLoadingAutoSource(false);
    }
  };

  const exportVideo = () => {
    if (!("MediaRecorder" in window) || !HTMLCanvasElement.prototype.captureStream) {
      setLog("이 브라우저에서는 영상 저장을 지원하지 않아요. Chrome 또는 Edge를 사용해 주세요.");
      return;
    }
    setIsExportingVideo(true);
    setLog("6프레임 움직임을 WebM 영상으로 만들고 있어요.");
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (!context) { setIsExportingVideo(false); return; }
    const drawFrame = (grid: Grid) => {
      context.fillStyle = "#071019";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#9aa59a";
      context.font = "24px sans-serif";
      context.fillText(`${displayName} · ${displayAction}`, 72, 58);
      const spacing = 12;
      const offsetX = (canvas.width - DOT_COLUMNS * spacing) / 2;
      const offsetY = (canvas.height - DOT_ROWS * spacing) / 2 + 20;
      grid.forEach((row, y) => row.forEach((active, x) => {
        context.beginPath();
        context.arc(offsetX + x * spacing + spacing / 2, offsetY + y * spacing + spacing / 2, active ? 4.3 : 1.4, 0, Math.PI * 2);
        context.fillStyle = active ? "#dfff70" : "#26343a";
        context.fill();
      }));
    };
    const videoFrames = Array.from({ length: 3 }, () => framesRef.current).flat();
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(canvas.captureStream(Math.max(12, speed * 2)), { mimeType });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sourceMode === "builtIn" ? activeAnimal.id : "tactile"}-motion.webm`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setIsExportingVideo(false);
      setLog("영상 파일을 저장했어요. 닷패드에서는 같은 프레임을 재생할 수 있어요.");
    };
    recorder.start();
    let current = 0;
    drawFrame(videoFrames[current]);
    const frameDelay = Math.max(80, Math.round(1000 / speed));
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= videoFrames.length) {
        window.clearInterval(timer);
        window.setTimeout(() => recorder.stop(), frameDelay);
        return;
      }
      drawFrame(videoFrames[current]);
    }, frameDelay);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => loadFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); loadFile(event.dataTransfer.files?.[0]); };
  const connectionLabel = connection === "connected" ? deviceName ?? "닷패드 연결됨" : connection === "connecting" ? "연결 중…" : connection === "error" ? "연결을 확인해 주세요" : "닷패드가 아직 없어요";

  return (
    <main className="app-shell kid-mode">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div><div><p className="eyebrow">DOT PAD · ANIMAL PLAYGROUND</p><h1>닷 <em>동물놀이터</em></h1></div></div>
        <div className="topbar-right"><div className={`connection-pill ${connection}`}><span className="connection-led" />{connectionLabel}</div>{connection === "connected" ? <button className="compact-button disconnect" onClick={disconnect}><X size={15} />연결 끊기</button> : <button className="compact-button" onClick={connectBluetooth} disabled={connection === "connecting"}><Bluetooth size={15} />닷패드 연결</button>}</div>
      </header>

      <section className="intro-strip"><div><p className="eyebrow">오늘의 촉각 탐험</p><h2>동물의 <em>모양</em>과 <em>움직임</em>을<br />손끝으로 찾아봐요.</h2></div><div className="how-to"><span>1</span><p>동물을 고르고</p><ChevronRight size={16} /><span>2</span><p>재생한 뒤</p><ChevronRight size={16} /><span>3</span><p>닷패드에서 느껴요</p></div></section>

      <section className="workspace">
        <aside className="control-rail">
          <section className="rail-section animal-section"><div className="section-heading"><span>01</span><h2>동물을 골라요</h2></div><div className="animal-grid">{animals.map((animal) => <button key={animal.id} className={`animal-card ${selectedAnimal === animal.id && !isCustomImage ? "selected" : ""}`} onClick={() => selectAnimal(animal.id)} aria-pressed={selectedAnimal === animal.id && !isCustomImage}><AnimalIcon type={animal.icon} /><span><b>{animal.name}</b><small>{animal.action}</small></span>{selectedAnimal === animal.id && !isCustomImage && <Check size={13} className="card-check" />}</button>)}</div></section>
          <section className="rail-section mission-box"><div className="section-heading"><span>02</span><h2>찾아보기</h2></div><div className="mission-icon"><AnimalIcon type={activeAnimal.icon} size={26} /></div><p className="mission-title">{activeAnimal.name}가 {activeAnimal.action}</p><p className="mission-copy">{sourceMode === "autoTactile" ? "Auto Tactile 아이콘의 큰 모양이 어떻게 바뀌는지 찾아보세요." : sourceMode === "upload" ? "내 그림의 큰 모양이 어떻게 바뀌는지 찾아보세요." : activeAnimal.instruction}</p><div className="mission-prompt"><Volume2 size={15} />{sourceMode === "builtIn" ? activeAnimal.feature : "큰 모양을 찾아보세요"}</div></section>
          <section className="rail-section source-section">
            <div className="section-heading"><span>03</span><h2>그림 소스를 골라요</h2></div>
            <div className="auto-source">
              <div className="auto-source-icon"><Sparkles size={18} /></div>
              <div><b>Auto Tactile 동물 아이콘</b><p>선택한 동물의 벡터 아이콘을 60 × 40 도트로 바꿔요.</p></div>
              <button onClick={loadAutoTactileSource} disabled={isLoadingAutoSource}>{isLoadingAutoSource ? "불러오는 중…" : "불러오기"}</button>
            </div>
            <div className="source-divider"><span>또는</span></div>
            <label className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileInput} />
              <div className="upload-icon"><ImageUp size={20} /></div><strong>동물 그림을 넣어 보세요</strong><small>PNG, JPG, WebP 또는 GIF</small>
              <button type="button" className="browse-link" onClick={() => inputRef.current?.click()}><Upload size={13} />그림 고르기</button>
            </label>
            <div className="source-meta"><span className="source-dot" />{sourceName}</div>
            <label className="control-label" htmlFor="motion">불러온 그림 움직임</label>
            <select id="motion" value={motion} onChange={(event) => { setMotion(event.target.value as MotionType); setFrameIndex(0); }} disabled={!isCustomImage}>
              <option value="shift">좌우로 이동</option><option value="scan">스캔하며 이동</option><option value="pulse">커졌다 작아지기</option>
            </select>
            <div className="slider-head"><label htmlFor="threshold">그림 진하기</label><b>{threshold}</b></div>
            <input id="threshold" type="range" min="60" max="210" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          </section>
          <section className="rail-section connection-section"><div className="section-heading"><span>04</span><h2>닷패드로 보내요</h2></div><button className="connection-button bluetooth" onClick={connectBluetooth} disabled={connection === "connecting" || connection === "connected"}><Bluetooth size={17} /><span><b>블루투스</b><small>Chrome에서 연결</small></span></button><button className="connection-button" onClick={connectUsb} disabled={connection === "connecting" || connection === "connected"}><Cable size={17} /><span><b>USB 케이블</b><small>유선으로 연결</small></span></button></section>
        </aside>

        <section className="stage">
          <div className="stage-bar"><div><p className="eyebrow">손끝 미리보기 · 60 × 40 DOTS</p><h2><span>{displayName}</span> {displayAction}</h2></div><div className="matrix-stat"><span>60</span><i>×</i><span>40</span><small>2,400 DOTS</small></div></div>
          <div className="preview-shell"><div className="preview-corner tl" /><div className="preview-corner tr" /><div className="preview-corner bl" /><div className="preview-corner br" /><div className="scanline" /><DotMatrix grid={currentGrid} /><div className="preview-footer"><span>동작 {String(frameIndex + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}</span><span>그래픽 영역 · 300 셀</span></div></div>
          <div className="transport-panel"><div className="transport-main"><button className={`play-button ${isPlaying ? "playing" : ""}`} onClick={() => (isPlaying ? stopPlayback() : startPlayback())}>{isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />}{isPlaying ? "잠시 멈추기" : "움직임 보기"}</button><button className="frame-button" onClick={() => { stopPlayback("다음 동작을 보여 줬어요."); const next = (frameIndex + 1) % frames.length; setFrameIndex(next); writeToDevice(frames[next]); }} title="다음 동작 보내기"><Send size={16} /></button><button className="video-button" onClick={exportVideo} disabled={isExportingVideo} title="WebM 영상 저장"><Video size={16} />{isExportingVideo ? "만드는 중" : "영상 저장"}</button></div><div className="speed-control"><Gauge size={15} /><label htmlFor="speed">속도</label><input id="speed" type="range" min="0.5" max="7" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><b>{speed.toFixed(1)} fps</b></div></div>
        </section>
      </section>
      <footer className="status-deck"><div className="status-message"><span className={connection === "error" ? "status-icon error" : "status-icon"}>{connection === "error" ? <CircleAlert size={16} /> : connection === "connected" ? <Check size={16} /> : <Sparkles size={16} />}</span><p>{log}</p></div><div className="sdk-badge"><Waves size={14} />DOTPAD WEB SDK <b>v3.0.2</b></div></footer>
    </main>
  );
}
