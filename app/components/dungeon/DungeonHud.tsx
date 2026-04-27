import { chapters } from "./chapters";

type DungeonHudProps = {
  chapterIndex: number;
  hasStarted: boolean;
  isLocked: boolean;
  progress: number;
};

export function DungeonHud({
  chapterIndex,
  hasStarted,
  isLocked,
  progress,
}: DungeonHudProps) {
  const chapter = chapters[chapterIndex];

  return (
    <>
      <section className="pointer-events-none absolute left-0 right-0 top-0 p-4 sm:p-6">
        <div className="flex max-w-5xl items-start justify-between gap-4">
          <div className="max-w-[min(76vw,520px)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Mystic Dungeon
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-5xl">
              {chapter.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-cyan-50/78 sm:text-base">
              {chapter.subtitle}
            </p>
          </div>
          <div className="hidden min-w-40 text-right sm:block">
            <p className="text-xs text-cyan-100/60">進行度</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{progress}%</p>
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 max-w-full p-4 sm:p-6">
        <div className="flex w-full max-w-5xl min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ol className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {chapters.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "shrink-0 border px-3 py-2 text-xs backdrop-blur-md",
                  index === chapterIndex
                    ? "border-cyan-200/70 bg-cyan-100/16 text-white"
                    : index < chapterIndex
                      ? "border-emerald-200/35 bg-emerald-200/10 text-emerald-50/80"
                      : "border-white/12 bg-black/22 text-white/52",
                ].join(" ")}
              >
                {item.title}
              </li>
            ))}
          </ol>
          <div className="w-full max-w-sm border border-white/12 bg-black/30 px-4 py-3 text-xs leading-5 text-cyan-50/74 backdrop-blur-md">
            {isLocked
              ? "WASDで移動、マウスで視点操作、Shiftで早歩き。Escでカーソルを戻せます。"
              : hasStarted
                ? "クリックすると探索に戻ります。"
                : "クリックして目を覚ます。森の奥へ進むと、洞窟が開きます。"}
          </div>
        </div>
      </div>
    </>
  );
}
