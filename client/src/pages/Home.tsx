import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bluetooth,
  Cable,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  Gauge,
  Pause,
  Play,
  Send,
  Sparkles,
  Video,
  Volume2,
  Waves,
  X,
} from "lucide-react";
import {
  DataCodes,
  DisplayMode,
  DotPadScanner,
  DotPadSDK,
  type DotDevice,
} from "@/sdk/DotPadSDK-3.0.2";
import { generatedMotionHex } from "@/generatedMotionFrames";

type Grid = boolean[][];
type ConnectionState = "idle" | "connecting" | "connected" | "error";
type GeneratedAnimalId = keyof typeof generatedMotionHex;
type AnimalId = GeneratedAnimalId | "dolphin" | "whale" | "octopus" | "turtle" | "owl" | "butterfly" | "bee" | "cat" | "dog" | "lion" | "elephant" | "monkey" | "snail";
type AnimalCategory = "water" | "sky" | "land" | "small";

const DOT_COLUMNS = 60;
const DOT_ROWS = 40;
const FRAME_COUNT = 6;
const GENERATED_IDS = new Set<GeneratedAnimalId>(Object.keys(generatedMotionHex) as GeneratedAnimalId[]);

const animalCategories: Array<{ id: AnimalCategory | "all"; label: string; emoji: string }> = [
  { id: "all", label: "모두", emoji: "✨" },
  { id: "water", label: "물속", emoji: "🌊" },
  { id: "sky", label: "하늘", emoji: "☁️" },
  { id: "land", label: "땅위", emoji: "🌳" },
  { id: "small", label: "작은 친구", emoji: "🌼" },
];

const quizOptions = ["헤엄치기", "날기", "깡충 뛰기", "걸어가기"];

const animals: Array<{
  id: AnimalId;
  name: string;
  action: string;
  instruction: string;
  feature: string;
  voice: string;
  emoji: string;
  category: AnimalCategory;
  quizAnswer: number;
}> = [
  { id: "fish", name: "물고기", action: "헤엄쳐요", instruction: "꼬리가 위아래로 휘며 앞으로 나아가요.", feature: "꼬리의 좌우 굽힘을 느껴 보세요", voice: "물고기는 꼬리를 좌우로 흔들며 물속을 헤엄쳐요. 꼬리가 휘었다가 반대쪽으로 휘는 순서를 느껴 볼까요?", emoji: "🐟", category: "water", quizAnswer: 0 },
  { id: "bird", name: "새", action: "날아가요", instruction: "넓은 날개가 올라갔다 내려와요.", feature: "날개가 위아래로 바뀌는 것을 느껴 보세요", voice: "새는 큰 날개를 위아래로 움직이며 하늘을 날아요. 날개가 높이 올라가는 때와 아래로 내려오는 때를 찾아볼까요?", emoji: "🐦", category: "sky", quizAnswer: 1 },
  { id: "frog", name: "개구리", action: "점프해요", instruction: "긴 뒷다리가 펴지며 공중으로 뛰어요.", feature: "웅크림, 점프, 착지 순서를 느껴 보세요", voice: "개구리는 긴 뒷다리를 웅크렸다가 쭉 펴며 폴짝 점프해요. 몸이 위로 올라갔다 내려오는 순서를 느껴 볼까요?", emoji: "🐸", category: "land", quizAnswer: 2 },
  { id: "rabbit", name: "토끼", action: "깡충깡충 뛰어요", instruction: "다리가 접혔다 펴지고, 긴 귀가 함께 움직여요.", feature: "다리의 접힘과 펴짐을 느껴 보세요", voice: "토끼는 다리를 접었다가 힘껏 펴며 깡충깡충 뛰어요. 긴 귀와 뒷다리가 어떻게 바뀌는지 찾아볼까요?", emoji: "🐰", category: "land", quizAnswer: 2 },
  { id: "dolphin", name: "돌고래", action: "물살을 가르며 헤엄쳐요", instruction: "길쭉한 몸과 뾰족한 등지느러미가 있어요.", feature: "등지느러미를 찾아보세요", voice: "돌고래는 길쭉한 몸으로 물살을 가르며 헤엄쳐요. 뾰족한 등지느러미가 보여요.", emoji: "🐬", category: "water", quizAnswer: 0 },
  { id: "whale", name: "고래", action: "천천히 헤엄쳐요", instruction: "아주 큰 몸과 넓은 꼬리지느러미가 있어요.", feature: "넓은 꼬리를 찾아보세요", voice: "고래는 아주 큰 몸으로 바다를 천천히 헤엄쳐요. 넓적한 꼬리지느러미를 찾아보세요.", emoji: "🐳", category: "water", quizAnswer: 0 },
  { id: "octopus", name: "문어", action: "다리를 흔들며 움직여요", instruction: "동그란 머리 아래에 여러 개의 긴 다리가 있어요.", feature: "여러 다리를 세어보세요", voice: "문어는 동그란 머리 아래의 여러 다리를 흔들며 움직여요. 긴 다리를 세어볼까요?", emoji: "🐙", category: "water", quizAnswer: 0 },
  { id: "turtle", name: "거북이", action: "느긋하게 헤엄쳐요", instruction: "둥근 등껍질과 네 개의 다리가 있어요.", feature: "둥근 등껍질을 찾아보세요", voice: "바다거북은 둥근 등껍질을 등에 지고 물속을 느긋하게 헤엄쳐요.", emoji: "🐢", category: "water", quizAnswer: 0 },
  { id: "owl", name: "부엉이", action: "날개를 펴고 날아요", instruction: "커다란 둥근 눈과 넓은 날개가 있어요.", feature: "큰 눈을 찾아보세요", voice: "부엉이는 커다란 눈으로 밤을 보고 넓은 날개를 펴고 날아요.", emoji: "🦉", category: "sky", quizAnswer: 1 },
  { id: "butterfly", name: "나비", action: "팔랑팔랑 날아요", instruction: "좌우로 넓게 펼쳐진 두 날개가 있어요.", feature: "두 날개를 찾아보세요", voice: "나비는 예쁜 두 날개를 팔랑팔랑 움직이며 꽃 사이를 날아요.", emoji: "🦋", category: "sky", quizAnswer: 1 },
  { id: "bee", name: "꿀벌", action: "윙윙 날아요", instruction: "작은 몸과 빠르게 움직이는 두 날개가 있어요.", feature: "작은 날개를 찾아보세요", voice: "꿀벌은 작은 날개를 빠르게 움직이며 윙윙 날아요. 꿀을 찾으러 꽃으로 가요.", emoji: "🐝", category: "sky", quizAnswer: 1 },
  { id: "cat", name: "고양이", action: "사뿐사뿐 걸어요", instruction: "뾰족한 귀와 긴 꼬리가 있어요.", feature: "뾰족한 귀를 찾아보세요", voice: "고양이는 푹신한 발로 사뿐사뿐 걸어요. 위로 뾰족한 귀와 긴 꼬리를 찾아보세요.", emoji: "🐱", category: "land", quizAnswer: 3 },
  { id: "dog", name: "강아지", action: "꼬리를 흔들며 걸어요", instruction: "네 개의 다리와 흔드는 꼬리가 있어요.", feature: "흔드는 꼬리를 찾아보세요", voice: "강아지는 네 다리로 걸으며 반가우면 꼬리를 살랑살랑 흔들어요.", emoji: "🐶", category: "land", quizAnswer: 3 },
  { id: "lion", name: "사자", action: "튼튼하게 걸어요", instruction: "커다란 머리 주변에 갈기가 있어요.", feature: "둥근 갈기를 찾아보세요", voice: "사자는 튼튼한 네 다리로 걸어요. 머리 주변의 둥근 갈기가 멋져요.", emoji: "🦁", category: "land", quizAnswer: 3 },
  { id: "elephant", name: "코끼리", action: "쿵쿵 걸어요", instruction: "긴 코와 커다란 귀가 있어요.", feature: "긴 코를 찾아보세요", voice: "코끼리는 긴 코를 흔들며 커다란 발로 쿵쿵 걸어요. 긴 코를 찾아볼까요?", emoji: "🐘", category: "land", quizAnswer: 3 },
  { id: "monkey", name: "원숭이", action: "나무에서 폴짝 뛰어요", instruction: "긴 팔과 구부러진 꼬리가 있어요.", feature: "긴 팔을 찾아보세요", voice: "원숭이는 긴 팔로 나뭇가지를 잡고 폴짝폴짝 뛰어요.", emoji: "🐵", category: "land", quizAnswer: 2 },
  { id: "snail", name: "달팽이", action: "천천히 기어요", instruction: "둥근 집과 두 개의 더듬이가 있어요.", feature: "동그란 집을 찾아보세요", voice: "달팽이는 등에 동그란 집을 지고 아주 천천히 기어가요. 두 더듬이를 찾아보세요.", emoji: "🐌", category: "small", quizAnswer: 3 },
];

function hexToGrid(hex: string): Grid {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (value) => Number.parseInt(value, 16));
  return Array.from({ length: DOT_ROWS }, (_, y) => Array.from({ length: DOT_COLUMNS }, (_, x) => {
    const byte = bytes[y * 8 + Math.floor(x / 8)] ?? 0;
    return (byte & (1 << (7 - (x % 8)))) !== 0;
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

export default function Home() {
  const [selectedAnimal, setSelectedAnimal] = useState<GeneratedAnimalId>("fish");
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | "all">("all");
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowExploring, setIsSlowExploring] = useState(false);
  const [speed, setSpeed] = useState(2.5);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"ready" | "correct" | "wrong">("ready");
  const [quizScore, setQuizScore] = useState(0);
  const [log, setLog] = useState("Higgsfield 동작 영상에서 뽑은 6개 프레임을 촉각 도트로 재생해 보세요.");
  const sdkRef = useRef<DotPadSDK | null>(null);
  const deviceRef = useRef<DotDevice | null>(null);
  const timerRef = useRef<number | null>(null);
  const playRef = useRef(false);
  const framesRef = useRef<Grid[]>([]);
  const speedRef = useRef(speed);

  const activeAnimal = animals.find((animal) => animal.id === selectedAnimal) ?? animals[0];
  const catalogAnimals = selectedCategory === "all" ? animals : animals.filter((animal) => animal.category === selectedCategory);
  const frames = useMemo(() => generatedMotionHex[selectedAnimal].map(hexToGrid), [selectedAnimal]);
  const currentGrid = frames[frameIndex] ?? frames[0];
  framesRef.current = frames;
  speedRef.current = speed;

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    sdkRef.current?.disconnect();
  }, []);

  const writeToDevice = useCallback((grid: Grid) => {
    if (!sdkRef.current || !deviceRef.current) return;
    try {
      sdkRef.current.displayGraphicData(gridToHex(grid), deviceRef.current, DisplayMode.GraphicMode);
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "닷패드로 프레임을 보낼 수 없어요.");
    }
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
    setIsSlowExploring(false);
    playRef.current = true;
    setIsPlaying(true);
    setLog(deviceRef.current ? "Higgsfield 영상 프레임을 닷패드에 차례대로 보내고 있어요." : "화면에서 실제 동작 프레임을 보고 있어요. 닷패드를 연결하면 촉각으로도 느낄 수 있어요.");
    runNextFrame(frameIndex);
  }, [frameIndex, runNextFrame]);

  const selectAnimal = (animal: AnimalId) => {
    if (!GENERATED_IDS.has(animal as GeneratedAnimalId)) {
      const target = animals.find((item) => item.id === animal);
      setLog(`${target?.name ?? "이 동물"}은 아직 영상 기반 프레임을 만드는 중이에요. 현재는 물고기, 새, 개구리, 토끼의 실제 동작을 탐험할 수 있어요.`);
      return;
    }
    const target = animals.find((item) => item.id === animal) ?? animals[0];
    stopPlayback(`${target.name}의 실제 동작 프레임을 준비했어요.`);
    setSelectedAnimal(animal as GeneratedAnimalId);
    setFrameIndex(0);
    setIsSlowExploring(false);
    setQuizChoice(null);
    setQuizResult("ready");
  };

  const speakDescription = () => {
    if (!("speechSynthesis" in window)) {
      setLog("이 브라우저에서는 음성 안내를 지원하지 않아요.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(activeAnimal.voice);
    speech.lang = "ko-KR";
    speech.rate = 0.86;
    speech.pitch = 1.12;
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => { setIsSpeaking(false); setLog("음성 안내를 재생하지 못했어요. 다시 눌러 보세요."); };
    window.speechSynthesis.speak(speech);
    setLog(`${activeAnimal.name}의 동작 순서를 음성으로 안내하고 있어요.`);
  };

  const speakFrameGuide = useCallback((index: number) => {
    const frameNumber = index + 1;
    const guides = [
      `${activeAnimal.name}의 첫 번째 자세예요. 몸의 전체 모양을 천천히 만져 보세요.`,
      `두 번째 자세예요. ${activeAnimal.feature} 움직이기 시작해요.`,
      `세 번째 자세예요. 가장 크게 달라진 부분을 찾아보세요.`,
      `네 번째 자세예요. 동작이 반대쪽으로 바뀌는 느낌을 비교해 보세요.`,
      `다섯 번째 자세예요. 처음 자세와 무엇이 다른지 손끝으로 확인해 보세요.`,
      `여섯 번째 자세예요. 한 번의 동작 순서가 끝났어요. 처음 프레임으로 돌아가 비교해 볼까요?`,
    ];
    if (!("speechSynthesis" in window)) {
      setLog(`느린 탐색 ${frameNumber}번 프레임: ${guides[index]}`);
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(guides[index]);
    speech.lang = "ko-KR";
    speech.rate = 0.7;
    speech.pitch = 1.06;
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(speech);
    setLog(`느린 탐색 ${frameNumber}번 프레임을 닷패드에 보냈어요. 설명을 들으며 천천히 만져 보세요.`);
  }, [activeAnimal]);

  const exploreFrame = useCallback((nextIndex: number) => {
    stopPlayback("느린 탐색 모드로 바꿨어요. 프레임을 하나씩 느껴 보세요.");
    setIsSlowExploring(true);
    setFrameIndex(nextIndex);
    writeToDevice(framesRef.current[nextIndex]);
    speakFrameGuide(nextIndex);
  }, [speakFrameGuide, stopPlayback, writeToDevice]);

  const answerQuiz = (choice: number) => {
    if (quizResult === "correct") return;
    setQuizChoice(choice);
    if (choice === activeAnimal.quizAnswer) {
      setQuizResult("correct");
      setQuizScore((score) => score + 1);
      setLog(`정답이에요! ${activeAnimal.name}는 ${activeAnimal.action}`);
      return;
    }
    setQuizResult("wrong");
    setLog("다시 생각해 볼까요? 실제 동작 프레임을 한 번 더 보고 음성 안내도 들어보세요.");
  };

  const setupSdk = useCallback(() => {
    if (sdkRef.current) return sdkRef.current;
    const sdk = new DotPadSDK();
    sdk.setCallBack((device, code, message) => {
      if (code === DataCodes.Connected) {
        deviceRef.current = device;
        setConnection("connected");
        setDeviceName("닷패드 연결됨");
        setLog("닷패드가 준비됐어요. 실제 동작 프레임을 손끝으로 느껴 보세요.");
      }
      if (code === DataCodes.Disconnected) {
        deviceRef.current = null;
        setConnection("idle");
        setDeviceName(null);
        stopPlayback("닷패드 연결이 끊겼어요. 화면 미리보기는 다시 시작할 수 있어요.");
      }
      if (code === DataCodes.ResponseDisplayLineComplete) setLog("프레임이 전달됐어요. 다음 동작을 준비하고 있어요.");
      if (message && code === DataCodes.ConnectedFail) setLog(message);
    }, null);
    sdkRef.current = sdk;
    return sdk;
  }, [stopPlayback]);

  const connectBluetooth = async () => {
    if (!("bluetooth" in navigator)) {
      setConnection("error");
      setLog("Chrome 또는 Edge에서 HTTPS로 이 페이지를 열어 주세요.");
      return;
    }
    setConnection("connecting");
    setLog("목록에서 닷패드를 골라 주세요.");
    try {
      const device = await new DotPadScanner().startBleScan();
      if (!device) {
        setConnection("idle");
        setLog("기기 선택을 취소했어요.");
        return;
      }
      const connected = await setupSdk().connectBleDevice(device);
      if (connected) {
        deviceRef.current = connected;
        setConnection("connected");
        setDeviceName(device.name ?? "닷패드 연결됨");
        setLog("블루투스로 닷패드가 연결됐어요. 이제 실제 동작을 재생해 보세요.");
      } else {
        setConnection("error");
        setLog("선택한 기기와 연결하지 못했어요.");
      }
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "블루투스 연결에 실패했어요.");
    }
  };

  const connectUsb = async () => {
    if (!("serial" in navigator)) {
      setConnection("error");
      setLog("Chrome 또는 Edge에서 USB 연결을 시도해 주세요.");
      return;
    }
    setConnection("connecting");
    setLog("목록에서 USB 닷패드를 골라 주세요.");
    try {
      const port = await new DotPadScanner().startUsbScan();
      if (!port) {
        setConnection("idle");
        setLog("기기 선택을 취소했어요.");
        return;
      }
      const connected = await setupSdk().connectUsbDevice(port);
      if (connected) {
        deviceRef.current = connected;
        setConnection("connected");
        setDeviceName("USB 닷패드 연결됨");
        setLog("USB로 닷패드가 연결됐어요. 이제 실제 동작을 재생해 보세요.");
      } else {
        setConnection("error");
        setLog("선택한 기기와 연결하지 못했어요.");
      }
    } catch (error) {
      setConnection("error");
      setLog(error instanceof Error ? error.message : "USB 연결에 실패했어요.");
    }
  };

  const disconnect = () => {
    stopPlayback("닷패드 연결을 끊었어요.");
    sdkRef.current?.disconnect(deviceRef.current);
    deviceRef.current = null;
    setConnection("idle");
    setDeviceName(null);
  };

  const exportVideo = () => {
    if (!("MediaRecorder" in window) || !HTMLCanvasElement.prototype.captureStream) {
      setLog("이 브라우저에서는 영상 저장을 지원하지 않아요. Chrome 또는 Edge를 사용해 주세요.");
      return;
    }
    setIsExportingVideo(true);
    setLog("Higgsfield 동작 프레임 6장을 촉각 WebM 영상으로 만들고 있어요.");
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (!context) {
      setIsExportingVideo(false);
      return;
    }
    const drawFrame = (grid: Grid, position: number) => {
      context.fillStyle = "#071019";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#dfff70";
      context.font = "700 32px sans-serif";
      context.fillText(`${activeAnimal.name} ${activeAnimal.action}`, 70, 62);
      context.fillStyle = "#9aa59a";
      context.font = "20px sans-serif";
      context.fillText(`HIGGSFIELD MOTION FRAME ${String((position % FRAME_COUNT) + 1).padStart(2, "0")} / 06`, 70, 96);
      const spacing = 12;
      const offsetX = (canvas.width - DOT_COLUMNS * spacing) / 2;
      const offsetY = (canvas.height - DOT_ROWS * spacing) / 2 + 28;
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
      link.download = `${activeAnimal.id}-higgsfield-tactile-motion.webm`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setIsExportingVideo(false);
      setLog("영상 파일을 저장했어요. 닷패드에서도 같은 6개 프레임을 반복 재생할 수 있어요.");
    };
    recorder.start();
    let current = 0;
    drawFrame(videoFrames[current], current);
    const frameDelay = Math.max(80, Math.round(1000 / speed));
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= videoFrames.length) {
        window.clearInterval(timer);
        window.setTimeout(() => recorder.stop(), frameDelay);
        return;
      }
      drawFrame(videoFrames[current], current);
    }, frameDelay);
  };

  const connectionLabel = connection === "connected" ? deviceName ?? "닷패드 연결됨" : connection === "connecting" ? "연결 중…" : connection === "error" ? "연결을 확인해 주세요" : "닷패드가 아직 없어요";

  return (
    <main className="app-shell kid-mode">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div><div><p className="eyebrow">DOT PAD · GENERATED MOTION</p><h1>닷 <em>동물놀이터</em></h1></div></div>
        <div className="topbar-right"><div className={`connection-pill ${connection}`}><span className="connection-led" />{connectionLabel}</div>{connection === "connected" ? <button className="compact-button disconnect" onClick={disconnect}><X size={15} />연결 끊기</button> : <button className="compact-button" onClick={connectBluetooth} disabled={connection === "connecting"}><Bluetooth size={15} />닷패드 연결</button>}</div>
      </header>

      <section className="intro-strip"><div><p className="eyebrow">HIGGSFIELD 동작 영상 → 촉각 도트</p><h2>동물의 <em>진짜 동작 순서</em>를<br />손끝으로 찾아봐요.</h2></div><div className="how-to"><span>1</span><p>동작을 고르고</p><ChevronRight size={16} /><span>2</span><p>프레임을 재생한 뒤</p><ChevronRight size={16} /><span>3</span><p>닷패드에서 느껴요</p></div></section>

      <section className="workspace">
        <aside className="control-rail">
          <section className="rail-section catalog-section">
            <div className="section-heading"><span>01</span><h2>동물 도감</h2><b className="catalog-count">{animals.length}</b></div>
            <p className="catalog-note"><Clapperboard size={14} />실제 동작 프레임 17종 완성</p>
            <div className="category-tabs" role="tablist" aria-label="동물 카테고리">
              {animalCategories.map((category) => <button key={category.id} className={selectedCategory === category.id ? "active" : ""} onClick={() => setSelectedCategory(category.id)} role="tab" aria-selected={selectedCategory === category.id}><span>{category.emoji}</span>{category.label}</button>)}
            </div>
            <div className="catalog-grid">{catalogAnimals.map((animal) => {
              const ready = GENERATED_IDS.has(animal.id as GeneratedAnimalId);
              return <button key={animal.id} className={`catalog-card ${selectedAnimal === animal.id ? "selected" : ""} ${!ready ? "pending" : ""}`} onClick={() => selectAnimal(animal.id)} aria-pressed={selectedAnimal === animal.id} aria-label={`${animal.name} ${ready ? "동작 영상 프레임 재생" : "동작 프레임 준비 중"}`}><span className="catalog-emoji">{animal.emoji}</span><span><b>{animal.name}</b><small>{ready ? animal.action : "영상 프레임 준비 중"}</small></span>{selectedAnimal === animal.id ? <Check size={16} className="card-check" /> : !ready ? <i className="pending-dot" aria-hidden="true" /> : null}</button>;
            })}</div>
          </section>

          <section className="rail-section mission-box">
            <div className="section-heading"><span>02</span><h2>듣고 찾아봐요</h2></div>
            <div className="mission-hero"><span>{activeAnimal.emoji}</span><div><p className="mission-title">{activeAnimal.name}가 {activeAnimal.action}</p><p className="mission-copy">{activeAnimal.instruction}</p></div></div>
            <button className={`voice-button ${isSpeaking ? "speaking" : ""}`} onClick={speakDescription}><Volume2 size={22} /><span>{isSpeaking ? "설명하는 중이에요" : "동물 설명 듣기"}</span></button>
            <div className="mission-prompt"><Sparkles size={15} />{activeAnimal.feature}</div>
          </section>

          <section className={`rail-section quiz-section ${quizResult}`}>
            <div className="section-heading"><span>03</span><h2>움직임 퀴즈</h2><b className="score-chip">별 {quizScore}</b></div>
            <p className="quiz-question">{activeAnimal.emoji} <b>{activeAnimal.name}</b>는 어떻게 움직일까요?</p>
            <div className="quiz-options">{quizOptions.map((option, index) => <button key={option} className={`${quizChoice === index ? "chosen" : ""} ${quizResult === "correct" && index === activeAnimal.quizAnswer ? "answer" : ""}`} onClick={() => answerQuiz(index)} disabled={quizResult === "correct"}><span>{index + 1}</span>{option}</button>)}</div>
            <p className="quiz-feedback" aria-live="polite">{quizResult === "correct" ? "참 잘했어요! 반짝반짝 별을 받았어요." : quizResult === "wrong" ? "조금만 더 생각해 봐요. 실제 프레임을 다시 봐도 좋아요." : "정답을 눌러 보세요."}</p>
          </section>

          <section className="rail-section pipeline-section">
            <div className="section-heading"><span>04</span><h2>어떻게 만들었을까요?</h2></div>
            <div className="motion-pipeline"><div><span>01</span><b>Higgsfield</b><small>동물 동작 영상</small></div><ChevronRight size={17} /><div><span>02</span><b>6 프레임</b><small>움직임 순서 선택</small></div><ChevronRight size={17} /><div><span>03</span><b>60 × 40</b><small>촉각 도트 변환</small></div></div>
            <p className="pipeline-copy">그림을 좌우로 밀어 움직이지 않아요. 영상 속 실제 자세 변화를 여섯 장의 촉각 프레임으로 바꿨어요.</p>
          </section>

          <section className="rail-section connection-section"><div className="section-heading"><span>05</span><h2>닷패드로 보내요</h2></div><button className="connection-button bluetooth" onClick={connectBluetooth} disabled={connection === "connecting" || connection === "connected"}><Bluetooth size={20} /><span><b>블루투스 연결</b><small>Chrome에서 연결</small></span></button><button className="connection-button" onClick={connectUsb} disabled={connection === "connecting" || connection === "connected"}><Cable size={20} /><span><b>USB 케이블</b><small>유선으로 연결</small></span></button></section>
        </aside>

        <section className="stage">
          <div className="stage-bar"><div><p className="eyebrow">HIGGSFIELD MOTION · 6 FRAMES · 60 × 40 DOTS</p><h2><span>{activeAnimal.name}</span> {activeAnimal.action}</h2></div><div className="matrix-stat"><span>60</span><i>×</i><span>40</span><small>2,400 DOTS</small></div></div>
          <div className="preview-shell"><div className="preview-corner tl" /><div className="preview-corner tr" /><div className="preview-corner bl" /><div className="preview-corner br" /><div className="scanline" /><DotMatrix grid={currentGrid} /><div className="preview-footer"><span>실제 동작 {String(frameIndex + 1).padStart(2, "0")} / {String(FRAME_COUNT).padStart(2, "0")}</span><span>Higgsfield 영상 프레임</span></div></div>
          <div className="transport-panel"><div className="transport-main"><button className={`play-button ${isPlaying ? "playing" : ""}`} onClick={() => (isPlaying ? stopPlayback() : startPlayback())}>{isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />}{isPlaying ? "잠시 멈추기" : "동작 재생"}</button><button className="frame-button" onClick={() => { stopPlayback("다음 실제 동작을 보여 줬어요."); const next = (frameIndex + 1) % frames.length; setFrameIndex(next); writeToDevice(frames[next]); }} title="다음 동작 보내기"><Send size={16} /></button><button className="video-button" onClick={exportVideo} disabled={isExportingVideo} title="WebM 영상 저장"><Video size={16} />{isExportingVideo ? "만드는 중" : "영상 저장"}</button></div><div className="speed-control"><Gauge size={15} /><label htmlFor="speed">속도</label><input id="speed" type="range" min="0.5" max="7" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><b>{speed.toFixed(1)} fps</b></div></div>
          <div className={`slow-explore ${isSlowExploring ? "active" : ""}`}>
            <div className="slow-explore-copy"><span className="slow-explore-icon"><Volume2 size={18} /></span><div><p>느린 탐색 모드</p><small>프레임을 하나씩 넘기고 설명을 들으며 손끝으로 확인해요.</small></div></div>
            <div className="slow-explore-controls"><button className="slow-frame-button" onClick={() => exploreFrame((frameIndex + frames.length - 1) % frames.length)} aria-label="이전 프레임 느린 탐색"><ChevronLeft size={20} />이전</button><button className="slow-listen-button" onClick={() => exploreFrame(frameIndex)}><Volume2 size={18} />{isSlowExploring ? `프레임 ${frameIndex + 1} 다시 듣기` : "느린 탐색 시작"}</button><button className="slow-frame-button" onClick={() => exploreFrame((frameIndex + 1) % frames.length)} aria-label="다음 프레임 느린 탐색">다음<ChevronRight size={20} /></button></div>
          </div>
        </section>
      </section>
      <footer className="status-deck"><div className="status-message"><span className={connection === "error" ? "status-icon error" : "status-icon"}>{connection === "error" ? <CircleAlert size={16} /> : connection === "connected" ? <Check size={16} /> : <Sparkles size={16} />}</span><p>{log}</p></div><div className="sdk-badge"><Waves size={14} />DOTPAD WEB SDK <b>v3.0.2</b></div></footer>
    </main>
  );
}
