//back side
import Back from "../assets/card/1.webp";

//card shapes
import Heart from "../assets/card/shapes/HH.webp";
import Diamond from "../assets/card/shapes/DD.webp";
import Club from "../assets/card/shapes/CC.webp";
import Spade from "../assets/card/shapes/SS.webp";

// Number cards
import Two from "../assets/card/number/2.png";
import Three from "../assets/card/number/3.png";
import Four from "../assets/card/number/4.png";
import Five from "../assets/card/number/5.png";
import Six from "../assets/card/number/6.png";
import Seven from "../assets/card/number/7.png";
import Eight from "../assets/card/number/8.png";
import Nine from "../assets/card/number/9.png";
import Ten from "../assets/card/number/10.png";
import Jack from "../assets/card/number/J.png";
import Queen from "../assets/card/number/Q.png";
import King from "../assets/card/number/K.png";
import Ace from "../assets/card/number/A.png";

// Individual cards from other folder
// Aces
import ASS from "../assets/card/other/ASS.webp";
import AHH from "../assets/card/other/AHH.webp";
import ADD from "../assets/card/other/ADD.webp";
import ACC from "../assets/card/other/ACC.webp";

// Kings
import KSS from "../assets/card/other/KSS.webp";
import KHH from "../assets/card/other/KHH.webp";
import KDD from "../assets/card/other/KDD.webp";
import KCC from "../assets/card/other/KCC.webp";

// Queens
import QSS from "../assets/card/other/QSS.webp";
import QHH from "../assets/card/other/QHH.webp";
import QDD from "../assets/card/other/QDD.webp";
import QCC from "../assets/card/other/QCC.webp";

// Jacks
import JSS from "../assets/card/other/JSS.webp";
import JHH from "../assets/card/other/JHH.webp";
import JDD from "../assets/card/other/JDD.webp";
import JCC from "../assets/card/other/JCC.webp";

// 10s
import TenSS from "../assets/card/other/10SS.webp";
import TenHH from "../assets/card/other/10HH.webp";
import TenDD from "../assets/card/other/10DD.webp";
import TenCC from "../assets/card/other/10CC.webp";

// 9s
import NineSS from "../assets/card/other/9SS.webp";
import NineHH from "../assets/card/other/9HH.webp";
import NineDD from "../assets/card/other/9DD.webp";
import NineCC from "../assets/card/other/9CC.webp";

// 8s
import EightSS from "../assets/card/other/8SS.webp";
import EightHH from "../assets/card/other/8HH.webp";
import EightDD from "../assets/card/other/8DD.webp";
import EightCC from "../assets/card/other/8CC.webp";

// 7s
import SevenSS from "../assets/card/other/7SS.webp";
import SevenHH from "../assets/card/other/7HH.webp";
import SevenDD from "../assets/card/other/7DD.webp";
import SevenCC from "../assets/card/other/7CC.webp";

// 6s
import SixSS from "../assets/card/other/6SS.webp";
import SixHH from "../assets/card/other/6HH.webp";
import SixDD from "../assets/card/other/6DD.webp";
import SixCC from "../assets/card/other/6CC.webp";

// 5s
import FiveSS from "../assets/card/other/5SS.webp";
import FiveHH from "../assets/card/other/5HH.webp";
import FiveDD from "../assets/card/other/5DD.webp";
import FiveCC from "../assets/card/other/5CC.webp";

// 4s
import FourSS from "../assets/card/other/4SS.webp";
import FourHH from "../assets/card/other/4HH.webp";
import FourDD from "../assets/card/other/4DD.webp";
import FourCC from "../assets/card/other/4CC.webp";

// 3s
import ThreeSS from "../assets/card/other/3SS.webp";
import ThreeHH from "../assets/card/other/3HH.webp";
import ThreeDD from "../assets/card/other/3DD.webp";
import ThreeCC from "../assets/card/other/3CC.webp";

// 2s
import TwoSS from "../assets/card/other/2SS.webp";
import TwoHH from "../assets/card/other/2HH.webp";
import TwoDD from "../assets/card/other/2DD.webp";
import TwoCC from "../assets/card/other/2CC.webp";

export const cardImage = {
  back: Back,
};

export const cardType = {
  Heart: Heart,
  Diamond: Diamond,
  Club: Club,
  Spade: Spade,
};

// Shape color categorization
export const shapeColors = {
  red: {
    Heart: Heart, // Red heart
    Diamond: Diamond, // Red diamond
  },
  black: {
    Club: Club, // Black club
    Spade: Spade, // Black spade
  },
};

// Helper function to get shapes by color
export const getShapesByColor = (color: "red" | "black") => {
  return shapeColors[color];
};

// Helper function to get all red shapes
export const getRedShapes = () => {
  return shapeColors.red;
};

// Helper function to get all black shapes
export const getBlackShapes = () => {
  return shapeColors.black;
};

// Helper function to check if a shape is red
export const isRedShape = (shape: string) => {
  return shape === "Heart" || shape === "Diamond";
};

// Helper function to check if a shape is black
export const isBlackShape = (shape: string) => {
  return shape === "Club" || shape === "Spade";
};

// Helper function to get shape color
export const getShapeColor = (shape: string): "red" | "black" | null => {
  if (isRedShape(shape)) return "red";
  if (isBlackShape(shape)) return "black";
  return null;
};

// Number card mappings
export const numberCards = {
  "2": Two,
  "3": Three,
  "4": Four,
  "5": Five,
  "6": Six,
  "7": Seven,
  "8": Eight,
  "9": Nine,
  "10": Ten,
  J: Jack,
  Q: Queen,
  K: King,
  A: Ace,
};

// Individual card mappings
export const individualCards = {
  // Aces - SS->HH, HH->DD, DD->SS, CC->CC
  ASS: ASS,
  AHH: AHH,
  ADD: ADD,
  ACC: ACC,
  // Kings - SS->HH, HH->DD, DD->SS, CC->CC
  KSS: KSS,
  KHH: KHH,
  KDD: KSS,
  KCC: KCC,
  // Queens - SS->HH, HH->DD, DD->SS, CC->CC
  QSS: QSS,
  QHH: QHH,
  QDD: QDD,
  QCC: QCC,
  // Jacks - SS->HH, HH->DD, DD->SS, CC->CC
  JSS: JSS,
  JHH: JHH,
  JDD: JDD,
  JCC: JCC,
  // 10s - SS->HH, HH->DD, DD->SS, CC->CC
  "10SS": TenSS,
  "10HH": TenHH,
  "10DD": TenDD,
  "10CC": TenCC,
  // 9s - SS->HH, HH->DD, DD->SS, CC->CC
  "9SS": NineSS,
  "9HH": NineHH,
  "9DD": NineDD,
  "9CC": NineCC,
  // 8s - SS->HH, HH->DD, DD->SS, CC->CC
  "8SS": EightSS,
  "8HH": EightHH,
  "8DD": EightDD,
  "8CC": EightCC,
  // 7s - SS->HH, HH->DD, DD->SS, CC->CC
  "7SS": SevenSS,
  "7HH": SevenHH,
  "7DD": SevenDD,
  "7CC": SevenCC,
  // 6s - SS->HH, HH->DD, DD->SS, CC->CC
  "6SS": SixSS,
  "6HH": SixHH,
  "6DD": SixDD,
  "6CC": SixCC,
  // 5s - SS->HH, HH->DD, DD->SS, CC->CC
  "5SS": FiveSS,
  "5HH": FiveHH,
  "5DD": FiveDD,
  "5CC": FiveCC,
  // 4s - SS->HH, HH->DD, DD->SS, CC->CC
  "4SS": FourSS,
  "4HH": FourHH,
  "4DD": FourDD,
  "4CC": FourCC,
  // 3s - SS->HH, HH->DD, DD->SS, CC->CC
  "3SS": ThreeSS,
  "3HH": ThreeHH,
  "3DD": ThreeDD,
  "3CC": ThreeCC,
  // 2s - SS->HH, HH->DD, DD->SS, CC->CC
  "2SS": TwoSS,
  "2HH": TwoHH,
  "2DD": TwoDD,
  "2CC": TwoCC,
};

// another type card mapping
export const anotherCards = {
  // Aces - SS->HH, HH->DD, DD->SS, CC->CC
  ASS: AHH,
  AHH: ADD,
  ADD: ASS,
  ACC: ACC,
  // Kings - SS->HH, HH->DD, DD->SS, CC->CC
  KSS: KHH,
  KHH: KDD,
  KDD: KSS,
  KCC: KCC,
  // Queens - SS->HH, HH->DD, DD->SS, CC->CC
  QSS: QHH,
  QHH: QDD,
  QDD: QSS,
  QCC: QCC,
  // Jacks - SS->HH, HH->DD, DD->SS, CC->CC
  JSS: JHH,
  JHH: JDD,
  JDD: JSS,
  JCC: JCC,
  // 10s - SS->HH, HH->DD, DD->SS, CC->CC
  "10SS": TenHH,
  "10HH": TenDD,
  "10DD": TenSS,
  "10CC": TenCC,
  // 9s - SS->HH, HH->DD, DD->SS, CC->CC
  "9SS": NineHH,
  "9HH": NineDD,
  "9DD": NineSS,
  "9CC": NineCC,
  // 8s - SS->HH, HH->DD, DD->SS, CC->CC
  "8SS": EightHH,
  "8HH": EightDD,
  "8DD": EightSS,
  "8CC": EightCC,
  // 7s - SS->HH, HH->DD, DD->SS, CC->CC
  "7SS": SevenHH,
  "7HH": SevenDD,
  "7DD": SevenSS,
  "7CC": SevenCC,
  // 6s - SS->HH, HH->DD, DD->SS, CC->CC
  "6SS": SixHH,
  "6HH": SixDD,
  "6DD": SixSS,
  "6CC": SixCC,
  // 5s - SS->HH, HH->DD, DD->SS, CC->CC
  "5SS": FiveHH,
  "5HH": FiveDD,
  "5DD": FiveSS,
  "5CC": FiveCC,
  // 4s - SS->HH, HH->DD, DD->SS, CC->CC
  "4SS": FourHH,
  "4HH": FourDD,
  "4DD": FourSS,
  "4CC": FourCC,
  // 3s - SS->HH, HH->DD, DD->SS, CC->CC
  "3SS": ThreeHH,
  "3HH": ThreeDD,
  "3DD": ThreeSS,
  "3CC": ThreeCC,
  // 2s - SS->HH, HH->DD, DD->SS, CC->CC
  "2SS": TwoHH,
  "2HH": TwoDD,
  "2DD": TwoSS,
  "2CC": TwoCC,
};

// Helper function to get card image by rank and suit
export const getCardImage = (rank: string, suit: string) => {
  const cardKey = `${rank}${suit}`;
  return individualCards[cardKey as keyof typeof individualCards] || Back;
};

// Helper function to get card image by full card code (e.g., "AS", "KH", "10D")
export const getCardByCode = (
  cardCode: string,
  gameSlug?: string,
  type?: string
) => {
  // if (type === "individual") {
  //   return individualCards[cardCode as keyof typeof individualCards] || Back;
  // } else {
    return anotherCards[cardCode as keyof typeof anotherCards] || Back;
  // }
};

// Helper function to get number card image by rank
export const getNumberCard = (rank: string) => {
  return numberCards[rank as keyof typeof numberCards] || Back;
};
