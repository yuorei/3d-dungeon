import { MysticDungeon } from "../components/dungeon/MysticDungeon";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Mystic 3D Dungeon" },
    {
      name: "description",
      content: "森から洞窟、遺跡、巨大空間へ歩いて進む一人称3D体験",
    },
  ];
}

export default function Index() {
  return <MysticDungeon />;
}
