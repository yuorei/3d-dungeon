export type Chapter = {
  title: string;
  subtitle: string;
  z: number;
};

export const chapters: Chapter[] = [
  { title: "森", subtitle: "湿った土と青い霧の中で目を覚ます", z: 0 },
  { title: "違和感", subtitle: "木々の奥で、地面そのものが淡く脈打つ", z: -62 },
  { title: "洞窟入口", subtitle: "苔むした岩肌が月光を飲み込んでいる", z: -116 },
  { title: "神秘ダンジョン", subtitle: "水音、結晶、古い道が深部へ誘う", z: -184 },
  { title: "遺跡", subtitle: "忘れられた柱と紋様が問いを残す", z: -264 },
  { title: "巨大空間", subtitle: "青と紫の光に満ちた地底の聖域", z: -352 },
];

export function getChapterIndex(z: number) {
  let index = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    if (z <= chapters[i].z + 18) index = i;
  }
  return index;
}
