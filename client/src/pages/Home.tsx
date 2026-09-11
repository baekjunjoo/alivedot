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
  KeyCodes,
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

const frameGuides: Record<AnimalId, readonly string[]> = {
  fish: [
    "몸통은 곧고 꼬리는 뒤로 길게 뻗어 있어요. 꼬리 끝의 갈라진 모양을 찾아보세요.",
    "꼬리가 왼쪽으로 휘기 시작했어요. 몸통 뒤쪽이 함께 왼쪽으로 기울어요.",
    "꼬리가 가장 왼쪽까지 휘었어요. 물을 왼쪽으로 밀어내는 모습을 느껴 보세요.",
    "꼬리가 가운데를 지나 반대쪽으로 돌아가고 있어요. 휜 방향이 바뀌는 곳을 찾아보세요.",
    "꼬리가 오른쪽으로 크게 휘었어요. 아까 왼쪽으로 휜 프레임과 비교해 보세요.",
    "꼬리가 다시 몸통 뒤쪽으로 모였어요. 한 번의 좌우 꼬리 흔들기가 끝났어요.",
  ],
  bird: [
    "두 날개가 몸 옆에 가깝게 내려와 있어요. 몸통보다 넓게 퍼진 날개 끝을 찾아보세요.",
    "왼쪽과 오른쪽 날개가 바깥쪽으로 열리기 시작했어요. 날개 폭이 조금 넓어졌어요.",
    "두 날개가 가장 높이 올라갔어요. 몸 위쪽으로 솟은 넓은 면을 천천히 만져 보세요.",
    "날개가 아래를 향해 힘차게 내려오고 있어요. 위로 솟았던 모양과 방향이 바뀌었어요.",
    "날개 끝이 몸 아래쪽으로 더 내려왔어요. 공기를 아래로 미는 동작을 느껴 보세요.",
    "날개가 다시 몸 가까이 모였어요. 위로 올리고 아래로 내린 한 번의 날갯짓이 끝났어요.",
  ],
  frog: [
    "몸을 낮추고 긴 뒷다리를 접은 준비 자세예요. 몸 뒤쪽의 접힌 다리를 찾아보세요.",
    "뒷다리가 뒤로 펴지기 시작했어요. 접혀 있던 관절이 길게 늘어나는 것을 느껴 보세요.",
    "두 뒷다리가 가장 길게 펴졌어요. 땅을 밀어 몸을 앞으로 보내는 순간이에요.",
    "몸이 공중으로 올라간 자세예요. 다리가 몸에서 떨어져 길게 뻗어 있어요.",
    "앞발이 먼저 아래로 향해 착지를 준비해요. 뒷다리는 다시 몸 쪽으로 접히기 시작해요.",
    "몸이 다시 낮아지고 뒷다리가 접혔어요. 다음 점프를 준비하는 웅크린 자세예요.",
  ],
  rabbit: [
    "긴 귀가 위로 서 있고 뒷다리는 몸 아래에 접혀 있어요. 귀와 큰 뒷발을 찾아보세요.",
    "뒷다리가 뒤로 펴지며 몸이 앞으로 밀려나기 시작해요. 귀도 살짝 뒤로 기울어요.",
    "몸이 공중으로 떠오른 자세예요. 앞발은 앞으로, 뒷발은 뒤로 길게 나뉘어 있어요.",
    "앞발이 먼저 바닥 쪽으로 내려와요. 길게 뻗었던 몸이 다시 낮아지고 있어요.",
    "뒷다리가 몸 밑으로 모이며 착지 힘을 받아요. 앞뒤 다리의 거리가 가까워졌어요.",
    "뒷다리가 다시 접힌 준비 자세예요. 귀는 위로 서 있고 다음 깡충뛰기를 기다려요.",
  ],
  dolphin: [
    "길쭉한 몸이 곧게 뻗어 있고 등지느러미가 위쪽에 있어요. 꼬리지느러미를 찾아보세요.",
    "몸 뒤쪽과 꼬리가 아래쪽으로 휘기 시작했어요. 등지느러미와 꼬리의 높이가 달라졌어요.",
    "꼬리지느러미가 가장 아래로 내려간 자세예요. 몸통의 물결 모양을 따라가 보세요.",
    "꼬리가 가운데를 지나 위쪽으로 돌아가고 있어요. 몸 뒤쪽의 휜 방향이 바뀌어요.",
    "꼬리지느러미가 위로 크게 올라갔어요. 앞 프레임의 아래쪽 꼬리와 비교해 보세요.",
    "꼬리가 다시 몸 뒤쪽으로 모였어요. 위아래 꼬리 흔들기 한 번이 끝났어요.",
  ],
  whale: [
    "아주 큰 몸통 뒤에 넓은 꼬리지느러미가 있어요. 꼬리의 양쪽 끝을 찾아보세요.",
    "넓은 꼬리가 아래쪽으로 기울기 시작했어요. 큰 몸통의 뒤끝이 함께 움직여요.",
    "꼬리지느러미가 가장 아래로 내려갔어요. 물을 아래로 밀어내는 큰 움직임이에요.",
    "꼬리가 가운데로 돌아오며 몸 뒤쪽의 방향이 바뀌어요. 넓은 꼬리 면을 비교해 보세요.",
    "꼬리지느러미가 위로 올라갔어요. 앞의 아래쪽 꼬리와 반대 모양이에요.",
    "꼬리가 다시 뒤로 곧게 모였어요. 고래의 느린 위아래 꼬리 흔들기가 끝났어요.",
  ],
  octopus: [
    "동그란 머리 아래로 여러 다리가 아래와 옆으로 퍼져 있어요. 가장 긴 다리를 찾아보세요.",
    "왼쪽 다리들이 바깥쪽으로 더 뻗기 시작했어요. 다리 끝이 머리에서 멀어져요.",
    "왼쪽 다리들이 가장 넓게 펼쳐졌어요. 여러 갈래가 한쪽으로 흐르는 느낌을 느껴 보세요.",
    "왼쪽 다리는 안으로 모이고 오른쪽 다리가 바깥으로 뻗기 시작했어요. 방향이 바뀌어요.",
    "오른쪽 다리들이 가장 넓게 흔들렸어요. 아까 펼쳐진 왼쪽 다리와 비교해 보세요.",
    "다리가 다시 머리 아래로 모였어요. 한 번의 좌우 다리 물결이 끝났어요.",
  ],
  turtle: [
    "둥근 등껍질 옆에 네 지느러미가 몸 가까이 있어요. 앞지느러미 두 개를 찾아보세요.",
    "오른쪽 앞지느러미가 앞으로 펴지기 시작했어요. 반대쪽 지느러미는 몸 가까이에 있어요.",
    "오른쪽 앞지느러미가 가장 멀리 뻗었어요. 물을 뒤로 미는 넓은 면을 느껴 보세요.",
    "오른쪽 지느러미가 몸 쪽으로 돌아오고 왼쪽 앞지느러미가 앞으로 나가요.",
    "왼쪽 앞지느러미가 가장 멀리 뻗었어요. 양쪽 지느러미가 번갈아 움직여요.",
    "두 앞지느러미가 다시 등껍질 가까이 모였어요. 느긋한 한 번의 저음이 끝났어요.",
  ],
  owl: [
    "커다란 눈 아래에서 두 날개가 몸 옆에 접혀 있어요. 양옆의 날개 끝을 찾아보세요.",
    "양쪽 날개가 바깥쪽으로 열리기 시작했어요. 몸의 폭이 넓어져요.",
    "두 날개가 몸 위쪽으로 가장 높이 올라갔어요. 위로 솟은 넓은 날개 면을 느껴 보세요.",
    "날개가 아래쪽으로 힘차게 내려오기 시작했어요. 위쪽으로 솟았던 모양이 바뀌어요.",
    "날개 끝이 몸 아래쪽까지 넓게 내려왔어요. 공기를 아래로 미는 순간이에요.",
    "날개가 몸 옆으로 다시 모였어요. 부엉이의 한 번의 큰 날갯짓이 끝났어요.",
  ],
  butterfly: [
    "몸 양옆의 두 날개가 비교적 위로 세워져 있어요. 가운데 가는 몸통을 찾아보세요.",
    "양쪽 날개가 바깥으로 열리기 시작했어요. 왼쪽과 오른쪽의 폭이 넓어져요.",
    "두 날개가 가장 넓게 펼쳐졌어요. 몸통을 가운데에 두고 좌우가 크게 퍼져 있어요.",
    "날개가 다시 위쪽으로 접히기 시작했어요. 넓었던 좌우 폭이 줄어들어요.",
    "두 날개가 몸 위에서 가까워졌어요. 꽃잎처럼 열린 모양이 접히는 중이에요.",
    "날개가 처음처럼 위로 모였어요. 팔랑하고 펼쳤다가 접은 한 번의 날갯짓이 끝났어요.",
  ],
  bee: [
    "작은 몸통 양옆에 짧은 날개가 있어요. 몸 뒤쪽의 뾰족한 끝도 찾아보세요.",
    "양쪽 날개가 바깥쪽으로 퍼지기 시작했어요. 몸보다 넓어진 부분을 느껴 보세요.",
    "날개가 가장 넓게 펼쳐졌어요. 작은 몸통 주변에 빠른 진동이 생기는 자세예요.",
    "날개가 반대 방향으로 기울며 다시 움직여요. 왼쪽과 오른쪽 끝의 위치를 비교해 보세요.",
    "날개가 몸 가까이로 돌아와요. 넓게 퍼졌던 모양이 줄어들고 있어요.",
    "날개가 처음 자세에 가까워졌어요. 윙윙 빠르게 움직이는 한 번의 날개 순서가 끝났어요.",
  ],
  cat: [
    "오른쪽을 보는 고양이예요. 오른쪽 앞발은 바닥에 있고 긴 꼬리는 뒤쪽으로 뻗어 있어요.",
    "왼쪽 앞발이 앞으로 들리기 시작했어요. 오른쪽 앞발은 몸을 지탱하고 있어요.",
    "왼쪽 앞발이 가장 앞으로 길게 나왔어요. 반대쪽 뒷다리는 뒤로 뻗어 걸음 폭이 넓어졌어요.",
    "왼쪽 앞발이 바닥으로 내려오고 오른쪽 앞발이 들리기 시작했어요. 다리 역할이 바뀌어요.",
    "오른쪽 앞발이 앞으로 나왔어요. 긴 꼬리는 몸의 균형을 잡으며 뒤쪽에 있어요.",
    "오른쪽 앞발이 바닥을 짚고 네 발이 다시 몸 아래로 모였어요. 사뿐한 한 걸음이 끝났어요.",
  ],
  dog: [
    "오른쪽을 보는 강아지예요. 네 발이 몸 아래에 있고 꼬리는 뒤쪽으로 뻗어 있어요.",
    "왼쪽 앞발이 앞으로 들리고 꼬리가 위쪽으로 살짝 흔들려요. 한 걸음을 시작해요.",
    "왼쪽 앞발이 가장 앞으로 나왔고 오른쪽 뒷다리는 뒤로 뻗어 있어요. 앞뒤 다리가 멀어졌어요.",
    "왼쪽 앞발이 바닥으로 내려오며 오른쪽 앞발이 들리기 시작했어요. 꼬리 방향도 바뀌어요.",
    "오른쪽 앞발이 앞으로 나왔어요. 꼬리는 반가운 듯 옆으로 흔들리고 있어요.",
    "오른쪽 앞발이 바닥을 짚고 네 발이 다시 몸 아래로 모였어요. 꼬리 흔들며 한 걸음이 끝났어요.",
  ],
  lion: [
    "오른쪽을 보는 사자예요. 둥근 갈기 아래로 네 다리가 몸을 단단히 받치고 있어요.",
    "왼쪽 앞발이 앞으로 들리기 시작했어요. 갈기는 머리 둘레에 둥글게 남아 있어요.",
    "왼쪽 앞발이 가장 앞으로 길게 나왔어요. 오른쪽 뒷다리는 뒤로 뻗어 큰 걸음이 되었어요.",
    "왼쪽 앞발이 바닥으로 내려오고 오른쪽 앞발이 들리기 시작했어요. 다리의 역할이 바뀌어요.",
    "오른쪽 앞발이 앞으로 나왔어요. 긴 꼬리는 몸 뒤쪽에서 균형을 잡아요.",
    "오른쪽 앞발이 바닥을 짚고 네 발이 다시 갈기 아래로 모였어요. 튼튼한 한 걸음이 끝났어요.",
  ],
  elephant: [
    "오른쪽을 보는 코끼리예요. 긴 코가 아래로 늘어지고 네 발이 몸 아래에 있어요.",
    "왼쪽 앞발이 들리기 시작했어요. 긴 코는 앞으로 살짝 흔들리며 걸음을 따라가요.",
    "왼쪽 앞발이 가장 앞으로 크게 나왔어요. 반대쪽 뒷다리는 뒤로 뻗어 아주 큰 걸음이에요.",
    "왼쪽 앞발이 바닥으로 내려오고 오른쪽 앞발이 들리기 시작했어요. 코가 아래쪽으로 부드럽게 휘어요.",
    "오른쪽 앞발이 앞으로 나왔어요. 커다란 귀와 긴 코를 다시 찾아보세요.",
    "오른쪽 앞발이 바닥을 짚고 네 발이 다시 몸 아래로 모였어요. 쿵쿵 한 걸음이 끝났어요.",
  ],
  monkey: [
    "몸을 낮추고 긴 팔과 다리를 접은 준비 자세예요. 뒤쪽의 구부러진 꼬리를 찾아보세요.",
    "다리가 펴지며 몸이 앞으로 올라가기 시작했어요. 긴 팔은 앞으로 뻗어요.",
    "몸이 공중에 떠 있고 두 다리가 몸 아래로 접혔어요. 꼬리는 위쪽으로 올라가 균형을 잡아요.",
    "긴 팔과 앞발이 먼저 아래로 내려와 착지를 준비해요. 다리는 앞으로 나와 있어요.",
    "다리가 다시 몸 아래로 접히며 착지 힘을 받아요. 꼬리는 아래쪽으로 돌아와요.",
    "몸을 다시 낮추고 긴 팔을 준비했어요. 다음 폴짝 뛰기를 기다리는 자세예요.",
  ],
  snail: [
    "둥근 소라 모양 집 아래로 짧은 몸이 있어요. 앞쪽의 두 더듬이를 찾아보세요.",
    "머리와 발이 앞으로 길게 뻗기 시작했어요. 더듬이도 앞쪽을 향해 있어요.",
    "몸이 가장 길고 낮게 늘어났어요. 둥근 집은 뒤쪽에 남고 발은 앞으로 나아가요.",
    "앞으로 뻗었던 발이 집 아래로 당겨져요. 몸이 짧아지고 조금 높아져요.",
    "머리와 발이 다시 앞으로 나가요. 두 더듬이가 위쪽으로 선 모습을 찾아보세요.",
    "몸이 처음처럼 짧은 기는 자세로 돌아왔어요. 아주 느린 한 번의 기어가기가 끝났어요.",
  ],
};

function hexToGrid(hex: string): Grid {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (value) => Number.parseInt(value, 16));
  return Array.from({ length: DOT_ROWS }, (_, y) => Array.from({ length: DOT_COLUMNS }, (_, x) => {
    const byte = bytes[y * 8 + Math.floor(x / 8)] ?? 0;
    return (byte & (1 << (7 - (x % 8)))) !== 0;
  }));
}

function gridToHex(grid: Grid): string {
  const bytes: string[] = [];
  const bitMap = [[0, 0, 0], [0, 1, 4], [1, 0, 1], [1, 1, 5], [2, 0, 2], [2, 1, 6], [3, 0, 3], [3, 1, 7]];
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
  const [exploredFrames, setExploredFrames] = useState<number[]>([]);
  const [speed, setSpeed] = useState(0.5);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"ready" | "correct" | "wrong">("ready");
  const [quizScore, setQuizScore] = useState(0);
  const [reviewChoice, setReviewChoice] = useState<AnimalId | null>(null);
  const [reviewResult, setReviewResult] = useState<"ready" | "correct" | "wrong">("ready");
  const [log, setLog] = useState("Higgsfield 동작 영상에서 뽑은 6개 프레임을 촉각 도트로 재생해 보세요.");
  const sdkRef = useRef<DotPadSDK | null>(null);
  const deviceRef = useRef<DotDevice | null>(null);
  const timerRef = useRef<number | null>(null);
  const playRef = useRef(false);
  const framesRef = useRef<Grid[]>([]);
  const speedRef = useRef(speed);
  const frameIndexRef = useRef(0);
  const slowExploringRef = useRef(false);
  const exploreFrameRef = useRef<(nextIndex: number) => void>(() => {});

  const activeAnimal = animals.find((animal) => animal.id === selectedAnimal) ?? animals[0];
  const catalogAnimals = selectedCategory === "all" ? animals : animals.filter((animal) => animal.category === selectedCategory);
  const frames = useMemo(() => generatedMotionHex[selectedAnimal].map(hexToGrid), [selectedAnimal]);
  const currentGrid = frames[frameIndex] ?? frames[0];
  const explorationComplete = exploredFrames.length === FRAME_COUNT;
  const reviewOptions = useMemo(() => {
    const candidates = [
      activeAnimal,
      ...animals.filter((animal) => animal.id !== activeAnimal.id && animal.category === activeAnimal.category),
      ...animals.filter((animal) => animal.id !== activeAnimal.id && animal.category !== activeAnimal.category),
    ].slice(0, 4);
    const shift = animals.findIndex((animal) => animal.id === activeAnimal.id) % candidates.length;
    return [...candidates.slice(shift), ...candidates.slice(0, shift)];
  }, [activeAnimal]);
  framesRef.current = frames;
  speedRef.current = speed;
  frameIndexRef.current = frameIndex;
  slowExploringRef.current = isSlowExploring;

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
    setExploredFrames([]);
    setQuizChoice(null);
    setQuizResult("ready");
    setReviewChoice(null);
    setReviewResult("ready");
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
    const guide = frameGuides[activeAnimal.id][index] ?? "이 프레임의 몸 모양을 천천히 만져 보세요.";
    const narration = `${activeAnimal.name}의 ${frameNumber}번째 자세예요. ${guide}`;
    if (!("speechSynthesis" in window)) {
      setLog(`느린 탐색 ${frameNumber}번 프레임: ${narration}`);
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(narration);
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
    setExploredFrames((current) => current.includes(nextIndex) ? current : [...current, nextIndex]);
    writeToDevice(framesRef.current[nextIndex]);
    speakFrameGuide(nextIndex);
  }, [speakFrameGuide, stopPlayback, writeToDevice]);

  exploreFrameRef.current = exploreFrame;

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

  const answerReviewQuiz = (choice: AnimalId) => {
    if (!explorationComplete || reviewResult === "correct") return;
    setReviewChoice(choice);
    if (choice === activeAnimal.id) {
      setReviewResult("correct");
      setLog(`정답이에요! 방금 손끝으로 느낀 움직임은 ${activeAnimal.name}의 동작이었어요.`);
      return;
    }
    setReviewResult("wrong");
    setLog("조금만 더 생각해 볼까요? 프레임을 다시 넘기며 다리, 날개, 꼬리의 움직임을 비교해 보세요.");
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
    }, (_device, keyCode) => {
      if (keyCode !== KeyCodes.PanningLeft && keyCode !== KeyCodes.PanningRight) return;
      if (!slowExploringRef.current) {
        setLog("느린 탐색을 시작한 뒤 닷패드의 패닝 키로 이전·다음 프레임을 넘겨 보세요.");
        return;
      }
      const activeFrames = framesRef.current;
      if (!activeFrames.length) return;
      const direction = keyCode === KeyCodes.PanningLeft ? -1 : 1;
      const nextIndex = (frameIndexRef.current + direction + activeFrames.length) % activeFrames.length;
      exploreFrameRef.current(nextIndex);
    });
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
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div><div><p className="eyebrow">TACTILE MOTION</p><h1>AliveDot</h1></div></div>
        <div className="topbar-right"><div className={`connection-pill ${connection}`}><span className="connection-led" />{connectionLabel}</div>{connection === "connected" ? <button className="compact-button disconnect" onClick={disconnect}><X size={15} />연결 끊기</button> : <button className="compact-button" onClick={connectBluetooth} disabled={connection === "connecting"}><Bluetooth size={15} />닷패드 연결</button>}</div>
      </header>

      <section className="intro-strip"><div><p className="eyebrow">ALIVEDOT · TACTILE LEARNING</p><h2>움직임을 <em>손끝으로</em><br />이해하는 경험.</h2><p className="intro-copy">AliveDot은 동물의 움직임을 촉각 프레임으로 바꿔, DotPad에서 천천히 탐색할 수 있도록 돕습니다.</p></div><div className="how-to"><span>1</span><p>동작을 고르고</p><ChevronRight size={16} /><span>2</span><p>프레임을 재생한 뒤</p><ChevronRight size={16} /><span>3</span><p>닷패드에서 느껴요</p></div></section>

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
          <div className="preview-shell"><div className="preview-corner tl" /><div className="preview-corner tr" /><div className="preview-corner bl" /><div className="preview-corner br" /><div className="scanline" /><DotMatrix grid={currentGrid} /><div className="preview-footer"><span>실제 동작 {String(frameIndex + 1).padStart(2, "0")} / {String(FRAME_COUNT).padStart(2, "0")}</span></div></div>
          <div className="transport-panel"><div className="transport-main"><button className={`play-button ${isPlaying ? "playing" : ""}`} onClick={() => (isPlaying ? stopPlayback() : startPlayback())}>{isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />}{isPlaying ? "잠시 멈추기" : "동작 재생"}</button><button className="frame-button" onClick={() => { stopPlayback("다음 실제 동작을 보여 줬어요."); const next = (frameIndex + 1) % frames.length; setFrameIndex(next); writeToDevice(frames[next]); }} title="다음 동작 보내기"><Send size={16} /></button><button className="video-button" onClick={exportVideo} disabled={isExportingVideo} title="WebM 영상 저장"><Video size={16} />{isExportingVideo ? "만드는 중" : "영상 저장"}</button></div><div className="speed-control"><Gauge size={15} /><label htmlFor="speed">속도</label><input id="speed" type="range" min="0.5" max="7" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><b>{speed.toFixed(1)} fps</b></div></div>
          <div className={`slow-explore ${isSlowExploring ? "active" : ""}`}>
            <div className="slow-explore-copy"><span className="slow-explore-icon"><Volume2 size={18} /></span><div><p>느린 탐색 모드</p><small>프레임을 하나씩 넘기고 설명을 들으며 손끝으로 확인해요. 닷패드의 패닝 키로 이전·다음 프레임을 넘길 수 있어요.</small></div></div>
            <div className="slow-explore-controls"><button className="slow-frame-button" onClick={() => exploreFrame((frameIndex + frames.length - 1) % frames.length)} aria-label="이전 프레임 느린 탐색"><ChevronLeft size={20} />이전</button><button className="slow-listen-button" onClick={() => exploreFrame(frameIndex)}><Volume2 size={18} />{isSlowExploring ? `프레임 ${frameIndex + 1} 다시 듣기` : "느린 탐색 시작"}</button><button className="slow-frame-button" onClick={() => exploreFrame((frameIndex + 1) % frames.length)} aria-label="다음 프레임 느린 탐색">다음<ChevronRight size={20} /></button></div>
            <div className={`review-quiz ${explorationComplete ? "unlocked" : "locked"} ${reviewResult}`} aria-live="polite">
              <div className="review-heading"><span className="review-number">복습</span><div><p>방금 느낀 동물은 누구일까요?</p><small>{explorationComplete ? "움직임의 특징을 떠올리고 동물을 골라 보세요." : `느린 탐색 ${exploredFrames.length} / ${FRAME_COUNT} 프레임을 느끼면 열려요.`}</small></div><b>{explorationComplete ? "열림" : `${exploredFrames.length} / ${FRAME_COUNT}`}</b></div>
              {explorationComplete ? <><div className="review-options">{reviewOptions.map((animal) => <button key={animal.id} className={`${reviewChoice === animal.id ? "chosen" : ""} ${reviewResult === "correct" && animal.id === activeAnimal.id ? "answer" : ""}`} onClick={() => answerReviewQuiz(animal.id)} disabled={reviewResult === "correct"}><span>{animal.emoji}</span>{animal.name}</button>)}</div><p className="review-feedback">{reviewResult === "correct" ? `맞았어요! ${activeAnimal.feature}` : reviewResult === "wrong" ? "힌트: 프레임을 다시 넘기며 가장 크게 바뀐 부분을 찾아보세요." : "동물 이름을 눌러 답해 보세요."}</p></> : <div className="review-lock"><Sparkles size={15} />여섯 장을 모두 만지면, 움직임만으로 동물을 맞히는 복습이 시작돼요.</div>}
            </div>
          </div>
        </section>
      </section>
      <footer className="status-deck"><div className="status-message"><span className={connection === "error" ? "status-icon error" : "status-icon"}>{connection === "error" ? <CircleAlert size={16} /> : connection === "connected" ? <Check size={16} /> : <Sparkles size={16} />}</span><p>{log}</p></div><div className="sdk-badge"><Waves size={14} />DOTPAD WEB SDK <b>v3.0.2</b></div></footer>
    </main>
  );
}
